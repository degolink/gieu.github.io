import { leaders, members, type Person } from "./peopleInfo";
import marianaArboleda from "../assets/img/optimized/leaders/Mariana Arboleda.webp";

export type EquipoProyecto = { leaders: Person[]; members: Person[] };

// Equipo de cada proyecto, por el título EXACTO que tiene en la hoja de proyectos.
// Si el título cambia en la hoja, hay que actualizarlo aquí o la sección de equipo desaparece.
export const projectTeams: Record<string, EquipoProyecto> = {
	"Colombia Programa": { leaders, members },
	"Ciencia de datos con perspectiva global": {
		leaders: [],
		members: [{ name: "Mariana Arboleda", role: "Instructora", photo: marianaArboleda.src }],
	},
};
