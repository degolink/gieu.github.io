export interface Proyecto {
  titulo: string;
  descripcion: string;
  tecnologias: string[];
  estado: string;
  año: string;
  imagen_url: string;
  color_principal: string;
  color_secundario: string;
  url_vermas?: string;
}

// Dirección de la página de detalle: "Programación para niños" -> "programacion-para-ninos"
export const slugProyecto = (titulo: string) =>
  titulo.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface Investigacion {
  titulo: string;
  descripcion: string;
  estado: string;
  año_inicio: string;
  año_fin: string;
  categoria: string;
  tecnologias: string[];
  color_borde: string;
  color_boton: string;
  url_detalles?: string;
}

export interface MiembroEquipo {
  nombre: string;
  apellido: string;
  cargo: string;
  nivel: string; // 'lider', 'investigador', 'estudiante'
  titulo_academico: string;
  especialidad: string;
  descripcion: string;
  areas_expertise: string[];
  programa_estudio?: string; // Solo para estudiantes
  imagen_url?: string;
  email?: string;
  perfil_academico?: string; // Google Scholar, ResearchGate, etc.
  color_gradiente: string;
}

export async function obtenerProyectos(): Promise<Proyecto[]> {
  try {
    // URL de Google Sheets publicado como CSV
    // Reemplaza 'TU_SHEET_ID' con el ID de tu hoja de cálculo
    // y 'TU_GID' con el GID de la hoja específica
    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT4XuxAP6ZkIOmG2YueX0jPDTo6FaZfaTDnTzgx-XLJ1VRf2uBoEoBgOi6tociPvjPOvIVNOBo0eKqu/pub?output=csv';
    
    const response = await fetch(SHEET_URL);
    
    if (!response.ok) {
      throw new Error(`Error al obtener datos: ${response.status}`);
    }
    
    const csvText = await response.text();
    return parsearCSVProyectos(csvText);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    // Retornar datos de respaldo en caso de error
    return obtenerProyectosRespaldo();
  }
}

export async function obtenerInvestigaciones(): Promise<Investigacion[]> {
  try {
    // URL de Google Sheets para investigaciones (tendrás que configurar una nueva hoja)
    // Por ahora usa la misma URL como ejemplo, pero deberías crear una hoja separada
    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbFzRT89Wzm3IWVq8FAg2JribA19ZJy4K_12weEx-8Wcec4mrZty38zOvz8gr03tWntjrdJdthinNY/pub?output=csv';
    
    const response = await fetch(SHEET_URL);
    
    if (!response.ok) {
      throw new Error(`Error al obtener investigaciones: ${response.status}`);
    }
    
    const csvText = await response.text();
    return parsearCSVInvestigaciones(csvText);
  } catch (error) {
    console.error('Error al obtener investigaciones:', error);
    // Retornar datos de respaldo en caso de error
    return obtenerInvestigacionesRespaldo();
  }
}

export async function obtenerEquipo(): Promise<MiembroEquipo[]> {
  try {
    // URL de Google Sheets para el equipo
    // Deberás reemplazar esta URL con la de tu hoja de equipo
    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vThJywK7bgJXL1v9SCmERq9EH-HPVkUadu1MT1UWtgLcO9iM6yxXRymB1zDu-zF9jT_K104MkQW1Cof/pub?output=csv';
    
    const response = await fetch(SHEET_URL);
    
    if (!response.ok) {
      throw new Error(`Error al obtener equipo: ${response.status}`);
    }
    
    const csvText = await response.text();
    return parsearCSVEquipo(csvText);
  } catch (error) {
    console.error('Error al obtener equipo:', error);
    // Retornar datos de respaldo en caso de error
    return obtenerEquipoRespaldo();
  }
}

function parsearCSVProyectos(csvText: string): Proyecto[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  
  const proyectos: Proyecto[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    
    const values = parsearLineaCSV(line);
    
    if (values.length >= headers.length) {
      const proyecto: Proyecto = {
        titulo: values[0] || '',
        descripcion: values[1] || '',
        tecnologias: values[2] ? values[2].split(',').map(tech => tech.trim()) : [],
        estado: values[3] || '',
        año: values[4] || '',
        imagen_url: values[5] || '',
        color_principal: values[6] || 'cod_gray-600',
        color_secundario: values[7] || 'cod_gray-700',
        url_vermas: values[8] || undefined,
      };
      
      proyectos.push(proyecto);
    }
  }
  
  return proyectos;
}

function parsearCSVInvestigaciones(csvText: string): Investigacion[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  
  const investigaciones: Investigacion[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    
    const values = parsearLineaCSV(line);
    
    if (values.length >= 8) {
      const investigacion: Investigacion = {
        titulo: values[0] || '',
        descripcion: values[1] || '',
        estado: values[2] || '',
        año_inicio: values[3] || '',
        año_fin: values[4] || '',
        categoria: values[5] || '',
        tecnologias: values[6] ? values[6].split(',').map(tech => tech.trim()) : [],
        color_borde: values[7] || 'daisy_bush-600',
        color_boton: values[8] || 'daisy_bush-600',
        url_detalles: values[9] || undefined,
      };
      
      investigaciones.push(investigacion);
    }
  }
  
  return investigaciones;
}

function parsearCSVEquipo(csvText: string): MiembroEquipo[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  
  const miembros: MiembroEquipo[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    
    const values = parsearLineaCSV(line);
    
    if (values.length >= 10) {
      const miembro: MiembroEquipo = {
        nombre: values[0] || '',
        apellido: values[1] || '',
        cargo: values[2] || '',
        nivel: values[3] || 'investigador',
        titulo_academico: values[4] || '',
        especialidad: values[5] || '',
        descripcion: values[6] || '',
        areas_expertise: values[7] ? values[7].split(',').map(area => area.trim()) : [],
        programa_estudio: values[8] || undefined,
        imagen_url: values[9] || undefined,
        email: values[10] || undefined,
        perfil_academico: values[11] || undefined,
        color_gradiente: values[12] || 'from-Shiraz-400 to-daisy_bush-400',
      };
      
      miembros.push(miembro);
    }
  }
  
  return miembros;
}

function parsearLineaCSV(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result.map(value => value.replace(/"/g, ''));
}

// Datos de respaldo en caso de que falle la conexión
function obtenerProyectosRespaldo(): Proyecto[] {
  return [
    {
      titulo: "Laboratorio Virtual de Química",
      descripcion: "Plataforma interactiva que permite a estudiantes realizar experimentos químicos virtuales de forma segura y accesible.",
      tecnologias: ["React", "WebGL", "Educación"],
      estado: "En desarrollo",
      año: "2023",
      imagen_url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop",
      color_principal: "Shiraz-600",
      color_secundario: "Shiraz-700",
      url_vermas: "https://ejemplo.com/laboratorio-quimica"
    },
    {
      titulo: "App de Matemáticas Interactivas",
      descripcion: "Aplicación móvil que gamifica el aprendizaje de matemáticas para estudiantes de primaria y secundaria.",
      tecnologias: ["Flutter", "Firebase", "Gamificación"],
      estado: "Finalizado",
      año: "2022",
      imagen_url: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop",
      color_principal: "daisy_bush-600",
      color_secundario: "daisy_bush-700",
      url_vermas: "https://ejemplo.com/app-matematicas"
    },
    {
      titulo: "Plataforma de Robótica Educativa",
      descripcion: "Sistema integral para enseñar programación y robótica a través de simuladores y kits educativos.",
      tecnologias: ["Python", "Arduino", "IoT"],
      estado: "En desarrollo",
      año: "2024",
      imagen_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
      color_principal: "cod_gray-600",
      color_secundario: "cod_gray-700",
      url_vermas: "https://ejemplo.com/robotica-educativa"
    }
  ];
}

function obtenerInvestigacionesRespaldo(): Investigacion[] {
  return [
    {
      titulo: "Impacto de la Realidad Virtual en el Aprendizaje de Química",
      descripcion: "Estudio longitudinal sobre el uso de entornos virtuales inmersivos para la enseñanza de conceptos químicos complejos en estudiantes de educación secundaria y superior.",
      estado: "En progreso",
      año_inicio: "2023",
      año_fin: "2025",
      categoria: "Realidad Virtual",
      tecnologias: ["Realidad Virtual", "Química", "Educación Superior"],
      color_borde: "daisy_bush-600",
      color_boton: "daisy_bush-600",
      url_detalles: "https://ejemplo.com/investigacion-vr-quimica"
    },
    {
      titulo: "Gamificación y Motivación en Matemáticas",
      descripcion: "Investigación sobre el efecto de elementos de gamificación en la motivación y rendimiento académico de estudiantes en matemáticas de educación básica.",
      estado: "Finalizado",
      año_inicio: "2022",
      año_fin: "2023",
      categoria: "Gamificación",
      tecnologias: ["Gamificación", "Matemáticas", "Motivación"],
      color_borde: "Shiraz-600",
      color_boton: "Shiraz-600",
      url_detalles: "https://ejemplo.com/investigacion-gamificacion-matematicas"
    },
    {
      titulo: "Inteligencia Artificial en Evaluación Educativa",
      descripcion: "Desarrollo de sistemas de evaluación adaptativos basados en IA que personalizan las pruebas según el nivel de conocimiento y estilo de aprendizaje del estudiante.",
      estado: "En progreso",
      año_inicio: "2024",
      año_fin: "2026",
      categoria: "Inteligencia Artificial",
      tecnologias: ["Inteligencia Artificial", "Evaluación", "Personalización"],
      color_borde: "cod_gray-600",
      color_boton: "cod_gray-600",
      url_detalles: "https://ejemplo.com/investigacion-ia-evaluacion"
    }
  ];
}

function obtenerEquipoRespaldo(): MiembroEquipo[] {
  return [
    // Líderes del grupo
    {
      nombre: "María Elena",
      apellido: "Rodríguez",
      cargo: "Directora del Grupo",
      nivel: "lider",
      titulo_academico: "Doctora en Educación",
      especialidad: "Tecnología Educativa",
      descripcion: "Especialista en tecnología educativa y metodologías de enseñanza STEM con más de 15 años de experiencia",
      areas_expertise: ["Educación STEM", "Tecnología Educativa", "Metodologías Activas"],
      imagen_url: "",
      email: "maria.rodriguez@uninorte.edu.co",
      perfil_academico: "https://scholar.google.com/citations?user=ejemplo",
      color_gradiente: "from-Shiraz-400 to-daisy_bush-400"
    },
    {
      nombre: "Carlos Alberto",
      apellido: "Mendoza",
      cargo: "Coordinador Académico",
      nivel: "lider",
      titulo_academico: "Doctor en Ciencias de la Computación",
      especialidad: "Pedagogía Digital",
      descripcion: "Experto en pedagogía digital y desarrollo de competencias matemáticas",
      areas_expertise: ["Pedagogía Digital", "Matemáticas", "Programación Educativa"],
      imagen_url: "",
      email: "carlos.mendoza@uninorte.edu.co",
      perfil_academico: "https://www.researchgate.net/profile/ejemplo",
      color_gradiente: "from-daisy_bush-400 to-Shiraz-400"
    },
    {
      nombre: "Ana Sofía",
      apellido: "Herrera",
      cargo: "Coordinadora de Investigación",
      nivel: "lider",
      titulo_academico: "Doctora en Psicología Educativa",
      especialidad: "Inclusión Educativa",
      descripcion: "Especialista en inclusión educativa y equidad en STEM",
      areas_expertise: ["Inclusión Educativa", "Equidad STEM", "Psicología Educativa"],
      imagen_url: "",
      email: "ana.herrera@uninorte.edu.co",
      perfil_academico: "https://scholar.google.com/citations?user=ejemplo2",
      color_gradiente: "from-Shiraz-400 to-daisy_bush-400"
    },
    // Investigadores
    {
      nombre: "Miguel",
      apellido: "Castro",
      cargo: "Investigador",
      nivel: "investigador",
      titulo_academico: "Magister en Educación",
      especialidad: "Tecnologías Emergentes",
      descripcion: "Especialista en integración de tecnologías emergentes en el aula",
      areas_expertise: ["Realidad Virtual", "Inteligencia Artificial", "EdTech"],
      imagen_url: "",
      email: "miguel.castro@uninorte.edu.co",
      color_gradiente: "from-daisy_bush-400 to-Shiraz-400"
    },
    {
      nombre: "Andrea",
      apellido: "Infante",
      cargo: "Investigadora",
      nivel: "investigador",
      titulo_academico: "Doctora en Ciencias",
      especialidad: "Análisis de Datos",
      descripcion: "Experta en análisis de datos educativos y learning analytics",
      areas_expertise: ["Learning Analytics", "Data Science", "Estadística Educativa"],
      imagen_url: "",
      email: "andrea.infante@uninorte.edu.co",
      color_gradiente: "from-Shiraz-400 to-daisy_bush-400"
    },
    {
      nombre: "Ricardo",
      apellido: "Bermúdez",
      cargo: "Investigador",
      nivel: "investigador",
      titulo_academico: "Ingeniero de Software",
      especialidad: "Desarrollo Educativo",
      descripcion: "Desarrollador de plataformas educativas y herramientas digitales",
      areas_expertise: ["Desarrollo Web", "Apps Educativas", "UX/UI"],
      imagen_url: "",
      email: "ricardo.bermudez@uninorte.edu.co",
      color_gradiente: "from-daisy_bush-400 to-Shiraz-400"
    },
    {
      nombre: "Laura",
      apellido: "Sánchez",
      cargo: "Investigadora",
      nivel: "investigador",
      titulo_academico: "Psicóloga Educativa",
      especialidad: "Cognición y Aprendizaje",
      descripcion: "Especialista en procesos cognitivos y estrategias de aprendizaje",
      areas_expertise: ["Neuroeducación", "Metacognición", "Evaluación"],
      imagen_url: "",
      email: "laura.sanchez@uninorte.edu.co",
      color_gradiente: "from-Shiraz-400 to-daisy_bush-400"
    },
    // Estudiantes
    {
      nombre: "Estudiante",
      apellido: "Pregrado 1",
      cargo: "Asistente de Investigación",
      nivel: "estudiante",
      titulo_academico: "Estudiante",
      especialidad: "Ingeniería de Sistemas",
      descripcion: "Estudiante de pregrado apoyando proyectos de desarrollo",
      areas_expertise: ["Programación", "Bases de Datos"],
      programa_estudio: "Pregrado - Ingeniería de Sistemas",
      imagen_url: "",
      color_gradiente: "from-cod_gray-400 to-cod_gray-500"
    },
    {
      nombre: "Estudiante",
      apellido: "Maestría 1",
      cargo: "Investigador Junior",
      nivel: "estudiante",
      titulo_academico: "Estudiante de Maestría",
      especialidad: "Educación con énfasis en TIC",
      descripcion: "Estudiante de maestría investigando gamificación en matemáticas",
      areas_expertise: ["Gamificación", "Diseño Instruccional"],
      programa_estudio: "Maestría en Educación",
      imagen_url: "",
      color_gradiente: "from-cod_gray-400 to-cod_gray-500"
    }
  ];
}
