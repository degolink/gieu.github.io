import * as cheerio from "cheerio";
import { SCIENTI_URL } from "../pages/api/publicaciones.json";
import respaldo from "../data/gruplac-respaldo.json";

// Integrantes del grupo según la tabla «Integrantes del grupo» de GrupLAC.
type Fila = { nombre: string; periodo: string }; // periodo: "2018/7 - Actual" | "2016/1 - 2016/12"

export type Integrante = {
  nombre: string;
  desde: string; // año de inicio
  hasta: string | null; // año de fin; null = activo
  inicio: string; // "2018/7", para ordenar
  fin: string | null;
};

export type Integrantes = { activos: Integrante[]; pasados: Integrante[] };

const TTL_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;

let cache: Integrantes | null = null;
let cacheTime = 0;
let cargaEnCurso: Promise<void> | null = null;

const comparar = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

// GrupLAC trae algunos nombres en MAYÚSCULAS; solo esos se pasan a formato título.
const formatearNombre = (nombre: string) =>
  nombre === nombre.toUpperCase()
    ? nombre.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
    : nombre;

function procesar(filas: Fila[]): Integrantes {
  const todos = filas.flatMap(({ nombre, periodo }) => {
    const [inicio, fin] = periodo.split(" - ").map((s) => s.trim());
    if (!nombre || !inicio || !fin) return [];
    const activo = fin === "Actual";
    return [{
      nombre: formatearNombre(nombre),
      desde: inicio.split("/")[0],
      hasta: activo ? null : fin.split("/")[0],
      inicio,
      fin: activo ? null : fin,
    }];
  });
  return {
    activos: todos.filter((m) => m.fin === null).sort((a, b) => comparar(a.inicio, b.inicio)),
    pasados: todos.filter((m) => m.fin !== null).sort((a, b) => comparar(b.fin!, a.fin!)),
  };
}

function extraerFilas(html: string): Fila[] {
  const $ = cheerio.load(html);
  const encabezado = $("td.celdaEncabezado").filter((_, td) => $(td).text().trim() === "Integrantes del grupo");
  // Fila 0: encabezado; fila 1: títulos de columna (Nombre, Vinculación, Horas, Inicio - Fin)
  return encabezado.closest("table").find("tr").slice(2).toArray().map((tr) => {
    const celdas = $(tr).find("td").toArray().map((td) => $(td).text().replace(/\s+/g, " ").trim());
    return { nombre: (celdas[0] ?? "").replace(/^\d+\.-\s*/, ""), periodo: celdas[3] ?? "" };
  });
}

async function refrescar() {
  try {
    const response = await fetch(SCIENTI_URL, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`GrupLAC respondió ${response.status}`);
    const html = new TextDecoder("iso-8859-1").decode(await response.arrayBuffer());
    const integrantes = procesar(extraerFilas(html));
    if (!integrantes.activos.length) throw new Error("GrupLAC no devolvió integrantes activos");
    cache = integrantes;
  } catch (error) {
    console.error("Error al consultar integrantes en GrupLAC; se usa el último dato disponible.", error);
  } finally {
    cacheTime = Date.now(); // también tras un fallo, para no reintentar en cada visita
  }
}

/**
 * Nunca espera a GrupLAC (la página pesa ~1 MB y es lenta): devuelve la caché o la copia
 * guardada en src/data/gruplac-respaldo.json y, si está vencida, refresca en segundo plano.
 */
export function obtenerIntegrantes(): Integrantes {
  if (Date.now() - cacheTime > TTL_MS && !cargaEnCurso) {
    cargaEnCurso = refrescar().finally(() => (cargaEnCurso = null));
  }
  return cache ?? (cache = procesar(respaldo));
}

/** Pasados agrupados por la década en que dejaron el grupo, más reciente primero. */
export function pasadosPorDecada(pasados: Integrante[]): [string, Integrante[]][] {
  const grupos = new Map<string, Integrante[]>();
  for (const m of pasados) {
    const decada = `${m.hasta!.slice(0, 3)}0`;
    grupos.set(decada, [...(grupos.get(decada) ?? []), m]);
  }
  return [...grupos].sort(([a], [b]) => comparar(b, a));
}

export const periodo = (m: Integrante) =>
  m.hasta === null ? `Desde ${m.desde}` : m.desde === m.hasta ? m.desde : `${m.desde} – ${m.hasta}`;
