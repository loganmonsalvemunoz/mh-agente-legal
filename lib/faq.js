// Respuestas automaticas a preguntas frecuentes fuera del flujo principal — coincidencia
// por palabras clave, sin LLM (mismo patron que mh-automatizacion/lib/faq.js).
import { MENU_OPTIONS } from './menu.js';
import { SEDES, CORREO_CONTACTO, OTROS_SERVICIOS } from '../config/contacto.js';

// Los numeros de opcion se calculan del menu real, nunca se escriben a mano — si el menu
// cambia de orden, estas respuestas siguen apuntando al numero correcto automaticamente.
const numeroDe = (tipo) => MENU_OPTIONS.find((o) => o.tipo === tipo)?.numero;

const FAQS = [
  {
    keywords: ['necesito abogado para una tutela', 'tutela necesito abogado'],
    respuesta: 'No siempre. Podemos darte un concepto o formato; si el caso es complejo, escalamos a abogado.',
  },
  {
    keywords: ['como agendo', 'cómo agendo', 'agendar cita', 'agendar una cita'],
    respuesta: `Escribe "${numeroDe('agendar')}" para agendar una asesoría — te pediré el área jurídica y tus datos de contacto, y un asesor te contactará para coordinar horario.`,
  },
  {
    keywords: ['atienden virtualmente', 'es virtual', 'atencion virtual', 'atención virtual'],
    respuesta: 'Sí, la orientación inicial y la asesoría se pueden dar de forma virtual.',
  },
  {
    keywords: ['que documentos', 'qué documentos', 'documentos debo llevar'],
    respuesta: 'Depende de tu caso — cuéntame qué necesitas (elige el área en el menú) y te digo qué documentos te sirven.',
  },
  {
    keywords: ['cuanto tarda', 'cuánto tarda', 'cuanto demora', 'cuánto demora'],
    respuesta: 'El tiempo depende de cada proceso y entidad — en la asesoría inicial te damos una orientación más precisa según tu caso.',
  },
  {
    keywords: ['pagos electronicos', 'pagos electrónicos', 'aceptan pagos'],
    respuesta: 'Sí, aceptamos pagos electrónicos. Te damos el detalle al confirmar tu asesoría.',
  },
  {
    keywords: ['sabados', 'sábados', 'fin de semana'],
    respuesta: 'Sí, atendemos los sábados de 8:00 a.m. a 12:00 m. de forma virtual.',
  },
  {
    keywords: ['revisar mis documentos', 'revisan documentos'],
    respuesta: 'Sí, en la asesoría inicial analizamos tu información y documentos relacionados con el caso.',
  },
  {
    keywords: ['ya tengo una demanda', 'demanda en curso', 'proceso en curso'],
    respuesta: `Si ya tienes un proceso judicial en curso, lo mejor es escalar directamente con un abogado — escribe "${numeroDe('asesor')}" para hablar con un asesor.`,
  },
  {
    keywords: ['que incluye la asesoria', 'qué incluye la asesoría', 'que incluye la asesoría'],
    respuesta: 'En la asesoría reviso tu caso con calma y te doy mi concepto sobre qué hacer. No incluye redactar documentos ni representarte en un proceso — eso se cotiza aparte si llegas a necesitarlo.',
  },
  {
    keywords: ['horario', 'atencion', 'atención', 'hora de atencion', 'hora de atención'],
    respuesta: 'Nuestro horario es lunes a viernes 8:00 a.m.-12:00 m. y 1:00 p.m.-5:00 p.m., y sábados 8:00 a.m.-12:00 m. (virtual).',
  },
  {
    keywords: ['sedes', 'oficinas', 'donde estan', 'dónde están', 'donde quedan', 'dónde quedan', 'ciudades'],
    respuesta:
      'Tenemos sede en ' +
      SEDES.map((s) => `${s.ciudad} (${s.direccion}, tel. ${s.telefono})`).join('; ') +
      '.',
  },
  {
    keywords: ['correo', 'email', 'e-mail'],
    respuesta: `Nuestro correo de contacto es ${CORREO_CONTACTO}.`,
  },
  {
    keywords: ['otros servicios', 'que mas hacen', 'qué más hacen', 'contaduria', 'contaduría', 'psicologia', 'psicología', 'investigacion privada', 'investigación privada'],
    respuesta: `Además de las áreas jurídicas, en MH Grupo Empresarial también manejamos ${OTROS_SERVICIOS}. Escribe "${numeroDe('asesor')}" si quieres que un asesor te oriente sobre alguno de estos servicios.`,
  },
  {
    keywords: ['fotomulta', 'fotomultas', 'comparendo'],
    respuesta: `Manejamos asesoría sobre fotomultas y comparendos dentro de Tránsito (opción ${MENU_OPTIONS.find((o) => o.area === 'transito').numero}).`,
  },
];

function normalizar(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export function buscarRespuestaFaq(text) {
  const normalized = normalizar(text);
  if (!normalized) return null;
  for (const faq of FAQS) {
    if (faq.keywords.some((kw) => normalized.includes(normalizar(kw)))) return faq.respuesta;
  }
  return null;
}

const SALUDOS = ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'buen dia', 'saludos'];

export function esSaludo(text) {
  const normalized = normalizar(text);
  return SALUDOS.some((s) => normalized === s || normalized.startsWith(s + ' ') || normalized.startsWith(s + ','));
}
