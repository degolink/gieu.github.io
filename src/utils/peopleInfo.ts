//leaders photos
import camiloVieira from "../assets/img/optimized/leaders/Camilo Vieira.png"
import marianaArboleda from "../assets/img/optimized/leaders/Mariana Arboleda.webp"
import gabrielaDeLaRosa from "../assets/img/optimized/leaders/Gabriela de la Rosa.png"
import angiePadilla from "../assets/img/optimized/leaders/Angie Padilla.webp"
import roxanaQuintana from "../assets/img/optimized/leaders/Roxana Quintero.webp"
//memers photos
import andreaAngulo from "../assets/img/optimized/members/Andrea Angulo.webp"
import camilaDeLaHoz from "../assets/img/optimized/members/Camila de la Hoz.webp"
import carolinaFontalvo from "../assets/img/optimized/members/Carolina Fontalvo.webp"
import catalinaOrozco from "../assets/img/optimized/members/Catalina Orozco.webp"
import elianaMora from "../assets/img/optimized/members/Eliana Mora.webp"
import jesusMontilla from "../assets/img/optimized/members/Jesús Montilla.webp"
import joseMola from "../assets/img/optimized/members/Jose A. Mola.webp"
import karenVargas from "../assets/img/optimized/members/Karen Vargas.webp"
import lauraCardoso from "../assets/img/optimized/members/Laura Cardoso.webp"
import mariaGonzales from "../assets/img/optimized/members/María A. González M..webp"
import michellCarvajal from "../assets/img/optimized/members/Michell Carvajal.webp"
import saraHernandez from "../assets/img/optimized/members/Sara Hernández.webp"
import sarayPinerez from "../assets/img/optimized/members/Saray Piñerez.webp"
import williamPerez from "../assets/img/optimized/members/William Pérez.webp"
import vanessaNavarro from "../assets/img/optimized/GIEdMembers/Vanessa Navarro Angarita.png"
import monicaOrdonez from "../assets/img/optimized/GIEdMembers/Monica Patricia Ordonez Villa.png"
import jorgeValencia from "../assets/img/optimized/GIEdMembers/Jorge Alberto Valencia Cobo.png"
import elsaEscalante from "../assets/img/optimized/GIEdMembers/Elsa Lucia Escalante Barrios.png"
import carmenRicardo from "../assets/img/optimized/GIEdMembers/Carmen Tulia Ricardo Barreto.png"
import alejandroEspinal from "../assets/img/optimized/GIEdMembers/Alejandro Espinal Duque.png"
import wilmanPerezBenitez from "../assets/img/optimized/GIEdMembers/Wilman Enrique Perez Benitez.png"
import johnCano from "../assets/img/optimized/GIEdMembers/Jonh José Cano Barrios.png"
import elianaPenaloza from "../assets/img/optimized/GIEdMembers/Eliana Rocío Peñaloza Suarez.png"
import cinthiaAstorga from "../assets/img/optimized/GIEdMembers/Cinthia Astorga Acevedo.png"

export interface Person {
	name: string;
	role: string;
	description?: string;
	photo?: string;
}

// Fotos adicionales para integrantes que llegan dinámicamente desde GrupLAC.
// Las claves usan nombres normalizados (sin tildes y en minúsculas).
export const memberPhotos: Record<string, string> = {
	"vanessa navarro angarita": vanessaNavarro.src,
	"monica patricia ordonez villa": monicaOrdonez.src,
	"jorge alberto valencia cobo": jorgeValencia.src,
	"elsa lucia escalante barrios": elsaEscalante.src,
	"carmen tulia ricardo barreto": carmenRicardo.src,
	"alejandro espinal duque": alejandroEspinal.src,
	"wilman enrique perez benitez": wilmanPerezBenitez.src,
	"willian enrique perez benitez": wilmanPerezBenitez.src,
	"john jose cano barrios": johnCano.src,
	"jonh jose cano barrios": johnCano.src,
	"eliana rocio penaloza suarez": elianaPenaloza.src,
	"cinthia milena astorga acevedo": cinthiaAstorga.src,
	"cinthia astorga acevedo": cinthiaAstorga.src,
};

//Leaders information
export const leaders: Person[] = [
	{
		name: "Camilo Vieira",
		role: "Director de MyE",
		description: `Camilo Vieira es ingeniero de sistemas y cuenta con un doctorado en Computational Science and Engineering Education. Su trayectoria combina la investigación, la visualización de datos y la innovación educativa para mejorar los procesos de aprendizaje. Como líder, Camilo se distingue por su amor a la enseñanza y por su cercanía con estudiantes y colegas. Es una persona amable, colaboradora y de gran corazón.`,
		photo: camiloVieira.src	
	},
	{
		name: "Mariana Arboleda",
		role: "Líder de datos",
		description: `Mariana Arboleda es ingeniera de producción, magíster en ingeniería y doctoranda en educación. Su trayectoria combina el análisis de datos, la investigación educativa y la enseñanza, con especial interés en cómo las personas aprenden y enseñan ciencia de datos. Como líder, Mariana es atenta y amigable. Está siempre pendiente de sus actividades y guía a su equipo con compromiso, cercanía y una cálida sonrisa`,
		photo: marianaArboleda.src,
	},
	{
		name: "Gabriela de la Rosa",
		role: "Líder de evaluación C3",
		description: `Gabriela de la Rosa es politóloga y magíster en Educación. Actualmente se desempeña como Lead Evaluation Analyst, donde trabaja en el monitoreo y la evaluación de proyectos educativos. Su experiencia en investigación, análisis de datos, políticas públicas y cooperación internacional fortalece la evaluación rigurosa y el impacto de las iniciativas del equipo. Como líder, Gabriela se distingue por su amabilidad y por su disposición constante para aprender y compartir sus conocimientos con los demás.`,
		photo: gabrielaDeLaRosa.src
	},
	{
		name: "Angie Padilla",
		role: "Líder de evaluación C2",
		description: `Angie Padilla se desempeña como Analista Líder de Evaluación en proyectos educativos como Colombia Programa y Coding Hubs Manizales. Su experiencia combina la docencia universitaria, la investigación y el análisis de datos cuantitativos y cualitativos, aportando al seguimiento riguroso y al fortalecimiento de las iniciativas del equipo. Como líder, Angie se distingue por su creatividad, sensibilidad y capacidad innata para inspirar y guiar a los demás.`,
		photo: angiePadilla.src
	},
	{
		name: "Roxana Quintero",
		role: "Gerente de Proyecto 2024-2025",
		description: `Roxana es psicóloga, especialista en estadística aplicada y magíster en Educación, con énfasis en Cognición. Su experiencia en investigación educativa se centra en el aprendizaje de la programación, la carga cognitiva y las experiencias de estudiantes en entornos remotos. Como líder de proyectos, combina el análisis riguroso con una gran disciplina y constancia, tanto en el trabajo como en el deporte.`,
		photo: roxanaQuintana.src
	}

];

//Members information
export const members: Person[] = [ 
	{ 
		name: "Carolina Fontalvo", 
		role: "Analista de MyE",
		photo: carolinaFontalvo.src 
	}, 
	{ 
		name: "Eliana Mora", 
		role: "Analista de MyE",
		photo: elianaMora.src
	},
	{ 
		name: "Catalina Orozco", 
		role: "Analista de MyE",
		photo: catalinaOrozco.src
	},
	{ 
		name: "Saray Piñerez", 
		role: "Analista de MyE",
		photo: sarayPinerez.src
	},
	{ 
		name: "Karen Vargas", 
		role: "Analista de MyE",
		photo: karenVargas.src
	},
	{ 
		name: "Andrea Angulo", 
		role: "Asistente Administrativa",
		photo: andreaAngulo.src
	},
	{ 
		name: "William Pérez", 
		role: "Asistente de análisis y visualización",
		photo: williamPerez.src
	},
	{ 
		name: "Jesús Montilla", 
		role: "Asistente de análisis y visualización",
		photo: jesusMontilla.src
	},
	{ 
		name: "Camila de la Hoz", 
		role: "Auxiliar de MyE",
		photo: camilaDeLaHoz.src
	},
	{ 
		name: "Laura Cardoso", 
		role: "Auxiliar de MyE",
		photo: lauraCardoso.src
	},
	{ 
		name: "Sara Hernández", 
		role: "Auxiliar de MyE",
		photo: saraHernandez.src
	},
	{ 
		name: "Michell Carvajal", 
		role: "Auxiliar de análisis y visualización",
		photo: michellCarvajal.src
	},
	{ 
		name: "María A. González M.", 
		role: "Asesora de género",
		photo: mariaGonzales.src
	},
	{ 
		name: "Jose A. Mola", 
		role: "Asesor de evaluación de impacto",
		photo: joseMola.src
	},
	
];
