import * as cheerio from "cheerio";
import type { Element } from "domhandler";

// URL del grupo de investigaciÃ³n en Scienti.
export const SCIENTI_URL =
  "https://scienti.minciencias.gov.co/gruplac/jsp/visualiza/visualizagr.jsp?nro=00000000008079";

// Base de la API de Crossref para consultar metadata por DOI.
const CROSSREF_BASE = "https://api.crossref.org/works";

// ---------- tipos ----------------------------------------------------------

type PublicacionScienti = {
  numero: string;
  titulo: string;
  revistaPais: string;
  anio: string | null;
  autores: string | null;
  doi: string | null; // DOI en bruto extraÃ­do de Scienti (ej. "10.xxxx/yyyy")
};

// Estructura final que devuelve el endpoint, enriquecida con Crossref.
export type Publicacion = {
  numero: string;
  titulo: string;
  revista: string;
  editorial: string | null;
  anio: string | null;
  autores: string | null;
  doi: string | null;
  url: string | null; // enlace canónico: URL de Crossref o fallback a doi.org
};

export type ScientiItem = {
  numero: string;
  titulo: string;
  detalle: string | null;
  anio: string | null;
  autores: string | null;
  doi: string | null;
  url: string | null;
};

export type ScientiCatalogo = {
  publicaciones: Publicacion[];
  software: ScientiItem[];
  capitulosLibro: ScientiItem[];
  librosFormacion: ScientiItem[];
  librosDivulgacion: ScientiItem[];
};

// ---------- caché en memoria -----------------------------------------------
// Evita consultar Crossref más de una vez por DOI mientras el proceso está vivo.
// En producción SSR, el proceso Node persiste entre peticiones, por lo que
// funciona como una caché "warm" entre usuarios.
const crossrefCache = new Map<string, Publicacion>();

// Caché en memoria para el catálogo completo de Scienti (artículos, libros, software).
// Evita volver a scrapear MinCiencias y consultar Crossref en cada visita.
let catalogoCache: {
  timestamp: number;
  datos: ScientiCatalogo;
} | null = null;

// TTL (Tiempo de vida de la caché): 24 horas en milisegundos
const TTL_CATALOGO_MS = 24 * 60 * 60 * 1000;

// Deduplicador de peticiones en vuelo (evita consultas simultáneas idénticas)
let promesaEnVuelo: Promise<ScientiCatalogo> | null = null;

// ---------- helpers ---------------------------------------------------------

function normalizarTextoSeccion(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extraerNumero(texto: string): string {
  const match = texto.match(/^\s*(\d+\.)/);
  return match ? match[1] : "";
}

function extraerAnio(texto: string): string | null {
  const years = texto.match(/\b(?:19|20)\d{2}\b/g);
  return years && years.length > 0 ? years[years.length - 1] : null;
}

function extraerAutores(texto: string): string | null {
  const match = texto.match(/Autores:\s*(.*)$/i);
  return match ? match[1].trim() : null;
}

function extraerTituloGenerico(texto: string): string {
  const numero = extraerNumero(texto);
  const textoSinNumero = numero ? texto.replace(new RegExp(`^\\s*${escapeRegExp(numero)}\\s*-\\s*`, "i"), "") : texto;
  const textoSinTipo = textoSinNumero.replace(/^[^:]+:\s*/i, "");

  const paises = [
    "Colombia",
    "México",
    "Brasil",
    "Ecuador",
    "Argentina",
    "Perú",
    "Chile",
    "Venezuela",
    "España",
    "Estados Unidos",
    "Canadá",
    "Portugal",
    "Uruguay",
    "Paraguay",
    "Bolivia",
    "Costa Rica",
    "Panamá",
    "Guatemala",
  ];
  const patronPaises = paises.join("|");

  const titulo = textoSinTipo
    .split(new RegExp(`\\s*,\\s*(?:${patronPaises})\\s*,`, "i"))[0]
    .split(/\s*\b(?:Disponibilidad|Nombre comercial|Sitio web|ISBN|ISSN|Autores|Vol\.|Ed\.|Ed\. editorial|Tipo|Nombre del proyecto)\b/i)[0]
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[.;,]+$/g, "")
    .trim();

  return titulo;
}

function extraerDetalleGenerico(texto: string): string | null {
  const titulo = extraerTituloGenerico(texto);
  const numero = extraerNumero(texto);
  const restante = texto
    .replace(new RegExp(`^\\s*(?:${escapeRegExp(numero)}\\s*-\\s*)?`, "i"), "")
    .replace(new RegExp(`^${escapeRegExp(titulo)}`, "i"), "")
    .replace(/^[^:]*:\s*/i, "")
    .split(/\s*(?:Autores:|autores:)/i)[0]
    .replace(/^[\s:,.\-]+|[\s:,.\-]+$/g, "")
    .trim();

  return restante || null;
}

function extraerDoiDesdeTexto(texto: string): string | null {
  const match = texto.match(/(?:https?:\/\/)?(?:dx\.)?doi\.org\/(10\.\d{4,}\/\S+)|(?:^|\s)(10\.\d{4,}\/\S+)/i);
  return match ? (match[1] ?? match[0].replace(/^.*?(10\.\d{4,}\/\S+)$/i, "$1")).replace(/[.,;)\]>\]]+$/, "") : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extraerItemsSeccion($: cheerio.CheerioAPI, headerTd: Element): ScientiItem[] {
  const filaEncabezado = $(headerTd).closest("tr");
  const filasSeccion = filaEncabezado.nextAll("tr");
  const items: ScientiItem[] = [];
  const clavesVistas = new Set<string>();

  filasSeccion.each((_rowIndex: number, tr: Element) => {
    const fila = $(tr);
    if (fila.find("td.celdaEncabezado").length > 0) {
      return false;
    }

    const celdas = fila.children("td");
    if (celdas.length < 2) {
      return;
    }

    const celdaContenido = celdas.eq(1);
    const clasesPermitidas = ["celdas1", "celdas0", "celdas_1", "celdas_0"];
    if (!clasesPermitidas.some((clase) => celdaContenido.hasClass(clase))) {
      return;
    }

    const textoCompleto = celdaContenido.text().replace(/\s+/g, " ").trim();
    if (!textoCompleto) {
      return;
    }

    const titulo = extraerTituloGenerico(textoCompleto);
    if (!titulo) {
      return;
    }

    const numero = extraerNumero(textoCompleto);
    const anio = extraerAnio(textoCompleto);
    const autores = extraerAutores(textoCompleto);
    const detalle = extraerDetalleGenerico(textoCompleto);
    let doi: string | null = extraerDoiDesdeTexto(textoCompleto);

    if (!doi) {
      celdaContenido.find("a[href]").each((_i, anchor) => {
        if (doi) return;
        const href = $(anchor).attr("href") ?? "";
        doi = extraerDoi(href);
      });
    }

    const clave = `${normalizarClave(titulo)}|${normalizarClave(anio ?? "")}`;
    if (clavesVistas.has(clave)) {
      return;
    }

    clavesVistas.add(clave);
    items.push({
      numero,
      titulo,
      detalle,
      anio,
      autores,
      doi,
      url: doi ? urlDoi(doi) : null,
    });
  });

  return items;
}

// Normaliza texto para comparar publicaciones y deduplicar por título + año.
function normalizarClave(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extrae el DOI de un enlace href de Scienti.
// Los enlaces pueden tener forma: https://doi.org/10.xxx/yyy o http://dx.doi.org/10.xxx/yyy
function extraerDoi(href: string): string | null {
  const match = href.match(/(?:doi\.org\/)?(10\.\d{4,}\/\S+)/i);
  return match ? match[1].replace(/[.,;)>\]]+$/, "") : null; // limpia trailing chars
}

// Construye el enlace doi.org canÃ³nico a partir del DOI en bruto.
function urlDoi(doi: string): string {
  return `https://doi.org/${doi}`;
}

// Consulta Crossref para un DOI dado y devuelve la publicaciÃ³n enriquecida.
// Retorna null si Crossref no tiene datos o falla la peticiÃ³n.
async function enriquecerConCrossref(
  scienti: PublicacionScienti
): Promise<Publicacion> {
  const { doi } = scienti;

  // Sin DOI no podemos consultar Crossref: devolvemos los datos de Scienti
  // y usamos la pÃ¡gina del grupo como enlace predeterminado.
  if (!doi) {
    return {
      numero: scienti.numero,
      titulo: scienti.titulo,
      revista: scienti.revistaPais,
      editorial: null,
      anio: scienti.anio,
      autores: scienti.autores,
      doi: null,
      url: SCIENTI_URL,
    };
  }

  // Revisamos cachÃ© antes de llamar a la API.
  if (crossrefCache.has(doi)) {
    return crossrefCache.get(doi)!;
  }

  try {
    const res = await fetch(`${CROSSREF_BASE}/${encodeURIComponent(doi)}`, {
      headers: {
        // Buena prÃ¡ctica: Crossref pide identificarse con un User-Agent descriptivo.
        "User-Agent": "GIEU-Site/1.0 (https://grupoinformaticaeducativa.uninorte.edu.co; mailto:cvieira@uninorte.edu.co)",
      },
    });

    if (!res.ok) {
      // Crossref respondiÃ³ con error (404 DOI no encontrado, 429 rate-limit, etc.).
      // Caemos al fallback con datos de Scienti.
      throw new Error(`Crossref ${res.status}`);
    }

    const json = await res.json() as {
      message: {
        title?: string[];
        author?: { given?: string; family?: string }[];
        "published-print"?: { "date-parts"?: number[][] };
        "published-online"?: { "date-parts"?: number[][] };
        "container-title"?: string[];
        publisher?: string;
        DOI?: string;
        URL?: string;
        resource?: { primary?: { URL?: string } };
      };
    };

    const msg = json.message;

    // TÃ­tulo: Crossref entrega un array de strings; tomamos el primero.
    const titulo = msg.title?.[0] ?? scienti.titulo;

    // Autores: concatenamos "Apellido, Nombre" separados por " ; ".
    const autores =
      msg.author && msg.author.length > 0
        ? msg.author
            .map((a) => [a.family, a.given].filter(Boolean).join(", "))
            .join(" ; ")
        : scienti.autores;

    // AÃ±o de publicaciÃ³n: preferimos impreso, sino online.
    const dateParts =
      msg["published-print"]?.["date-parts"]?.[0] ??
      msg["published-online"]?.["date-parts"]?.[0];
    const anio = dateParts ? String(dateParts[0]) : scienti.anio;

    // Revista (container-title) y editorial (publisher).
    const revista = msg["container-title"]?.[0] ?? scienti.revistaPais;
    const editorial = msg.publisher ?? null;

    // URL: primero resource.primary.URL, luego msg.URL, Ãºltimo fallback doi.org.
    const url =
      msg.resource?.primary?.URL ??
      msg.URL ??
      urlDoi(doi);

    const publicacion: Publicacion = {
      numero: scienti.numero,
      titulo,
      revista,
      editorial,
      anio,
      autores,
      doi,
      url,
    };

    crossrefCache.set(doi, publicacion);
    return publicacion;
  } catch {
    // Si Crossref falla por cualquier motivo, usamos los datos de Scienti como respaldo.
    const publicacion: Publicacion = {
      numero: scienti.numero,
      titulo: scienti.titulo,
      revista: scienti.revistaPais,
      editorial: null,
      anio: scienti.anio,
      autores: scienti.autores,
      doi,
      url: doi ? urlDoi(doi) : SCIENTI_URL,
    };

    crossrefCache.set(doi, publicacion);
    return publicacion;
  }
}

// ---------- endpoint --------------------------------------------------------

async function obtenerPublicacionesDeSeccion($: cheerio.CheerioAPI, headerTd: Element): Promise<Publicacion[]> {
  const filaEncabezado = $(headerTd).closest("tr");
  const filasSeccion = filaEncabezado.nextAll("tr");
  const publicacionesScienti: PublicacionScienti[] = [];
  const clavesVistas = new Set<string>();

  filasSeccion.each((_rowIndex: number, tr: Element) => {
    const fila = $(tr);
    if (fila.find("td.celdaEncabezado").length > 0) {
      return false;
    }

    const celdas = fila.children("td");
    if (celdas.length < 2) {
      return;
    }

    const celdaContenido = celdas.eq(1);
    if (!celdaContenido.hasClass("celdas1") && !celdaContenido.hasClass("celdas0")) {
      return;
    }

    const textoCompleto = celdaContenido.text().replace(/\s+/g, " ").trim();
    const numero = extraerNumero(textoCompleto);
    const titulo = extraerTituloGenerico(textoCompleto);
    if (!titulo) {
      return;
    }

    const anio = extraerAnio(textoCompleto);
    const autores = extraerAutores(textoCompleto);
    let doi: string | null = extraerDoiDesdeTexto(textoCompleto);

    if (!doi) {
      celdaContenido.find("a[href]").each((_i, anchor) => {
        if (doi) return;
        const href = $(anchor).attr("href") ?? "";
        doi = extraerDoi(href);
      });
    }

    const clave = `${normalizarClave(titulo)}|${normalizarClave(anio ?? "")}`;
    if (clavesVistas.has(clave)) {
      return;
    }

    clavesVistas.add(clave);
    publicacionesScienti.push({
      numero,
      titulo,
      revistaPais: textoCompleto.split(/\s*,\s*(?:Colombia|México|Brasil|Ecuador|Argentina|Perú|Chile|Venezuela|España|Estados Unidos|Canadá|Portugal|Uruguay|Paraguay|Bolivia|Costa Rica|Panamá|Guatemala)\s*,/i)[0] ?? "",
      anio,
      autores,
      doi,
    });
  });

  const CONCURRENCIA = 5;
  const publicaciones: Publicacion[] = [];
  for (let i = 0; i < publicacionesScienti.length; i += CONCURRENCIA) {
    const lote = publicacionesScienti.slice(i, i + CONCURRENCIA);
    const resultados = await Promise.all(lote.map(enriquecerConCrossref));
    publicaciones.push(...resultados);
  }

  return publicaciones;
}

function crearCatalogoVacio(): ScientiCatalogo {
  return {
    publicaciones: [],
    software: [],
    capitulosLibro: [],
    librosFormacion: [],
    librosDivulgacion: [],
  };
}

export async function obtenerSeccionesScienti(forzarRecarga = false): Promise<ScientiCatalogo> {
  const ahora = Date.now();

  // 1. Si tenemos datos en caché válidos y no se fuerza recarga, responder en < 1ms
  if (!forzarRecarga && catalogoCache && ahora - catalogoCache.timestamp < TTL_CATALOGO_MS) {
    return catalogoCache.datos;
  }

  // 2. Si ya hay una petición en proceso, compartir la misma promesa (deduplicación)
  if (promesaEnVuelo) {
    return await promesaEnVuelo;
  }

  // 3. Iniciar consulta a Scienti y Crossref
  promesaEnVuelo = (async () => {
    try {
      const response = await fetch(SCIENTI_URL);
      if (!response.ok) {
        console.error(`No se pudo consultar Scienti: ${response.status}`);
        if (catalogoCache) return catalogoCache.datos;
        return crearCatalogoVacio();
      }

      const buffer = await response.arrayBuffer();
      const html = new TextDecoder("iso-8859-1").decode(buffer);
      const $ = cheerio.load(html);

      const catalogo: ScientiCatalogo = crearCatalogoVacio();

      const headers = $("td.celdaEncabezado");
      for (const header of headers.toArray()) {
        const headerTd = $(header);
        const encabezado = normalizarTextoSeccion(headerTd.text());

        if (
          encabezado.includes("publicad") &&
          !encabezado.includes("capitulo") &&
          !encabezado.includes("libros de formacion") &&
          !encabezado.includes("libros de divulgacion") &&
          !encabezado.includes("libros publicados")
        ) {
          const publicacionesSeccion = await obtenerPublicacionesDeSeccion($, header);
          catalogo.publicaciones.push(...publicacionesSeccion);
        }

        if (encabezado.includes("softwar")) {
          catalogo.software = extraerItemsSeccion($, header);
        }

        if (encabezado.includes("capitulo") && encabezado.includes("libro")) {
          catalogo.capitulosLibro = extraerItemsSeccion($, header);
        }

        if (encabezado.includes("libros de formacion") || encabezado.includes("libros de formación")) {
          catalogo.librosFormacion = extraerItemsSeccion($, header);
        }

        if (encabezado.includes("libros de divulgacion") || encabezado.includes("libros de divulgación")) {
          catalogo.librosDivulgacion = extraerItemsSeccion($, header);
        }
      }

      // Guardar en la caché global en memoria
      catalogoCache = {
        timestamp: Date.now(),
        datos: catalogo,
      };

      return catalogo;
    } catch (error) {
      console.error("Error al consultar Scienti; se usará catálogo de respaldo.", error);
      if (catalogoCache) return catalogoCache.datos;
      return crearCatalogoVacio();
    } finally {
      promesaEnVuelo = null;
    }
  })();

  return await promesaEnVuelo;
}

export const prerender = false;

export async function GET({ url }: { url?: URL } = {}) {
  try {
    const forzarRecarga = url?.searchParams?.get("refresh") === "true";
    const { publicaciones } = await obtenerSeccionesScienti(forzarRecarga);
    return new Response(JSON.stringify({ publicaciones }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Fallo en GET de Scienti; devolviendo respuesta vacía.", error);
    return new Response(JSON.stringify({ publicaciones: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}


