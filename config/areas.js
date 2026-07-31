// Catalogo de areas juridicas: preguntas de "Escuchar", nota de tema, y tarifa.
// Los 10 flujos por area (+ tutela) se modelan como datos, no como funciones repetidas —
// un unico handler generico (lib/steps/areaFlow.js) recorre "preguntas" segun un indice
// guardado en el contexto de la conversacion.
//
// Alcance de esta version (decisiones confirmadas con el negocio):
// - "Empresas" queda fuera del demo (no aparecia en las 11 opciones del guion aprobado).
// - "Tutela" se agrega como opcion 12 explicita del menu (no estaba en las 11 originales).
export const AREAS = {
  laboral: {
    nombreMenu: 'Derecho laboral',
    temas: 'Despidos, liquidaciones, salarios, prestaciones, acoso laboral, estabilidad laboral reforzada.',
    preguntas: [
      '¿Hace cuánto terminó (o está por terminar) la relación laboral?',
      '¿Tienes contrato escrito?',
    ],
    notaTema: 'Analizaremos tus derechos bajo el Código Sustantivo del Trabajo.',
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  familia: {
    nombreMenu: 'Derecho de familia',
    temas: 'Divorcios, custodia, alimentos, visitas, sucesiones, unión marital de hecho.',
    preguntas: [
      '¿De qué trata tu caso: divorcio, custodia, alimentos, visitas, sucesión o unión marital de hecho?',
      '¿Hay algún proceso judicial ya iniciado sobre este tema?',
    ],
    notaTema: null,
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  civil: {
    nombreMenu: 'Derecho civil',
    temas: 'Incumplimientos contractuales, deudas, responsabilidad civil, restituciones.',
    preguntas: [
      '¿Tu caso es sobre un incumplimiento de contrato, una deuda, responsabilidad civil o una restitución?',
      '¿Existe algún documento o contrato firmado relacionado?',
    ],
    notaTema: null,
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  penal: {
    nombreMenu: 'Derecho penal',
    temas: 'Denuncias, representación de víctimas, indiciados, acusados, audiencias y acompañamiento judicial.',
    preguntas: [
      '¿Eres víctima, indiciado o acusado en este caso?',
      '¿Ya existe una denuncia o proceso penal formalmente iniciado?',
    ],
    notaTema: 'Dado que son casos de alta sensibilidad y complejidad técnica, tras analizar tu información, el equipo jurídico te comunicará el valor de la asesoría.',
    tarifa: { tipo: 'variable' },
  },
  transito: {
    nombreMenu: 'Tránsito',
    temas: 'Fotomultas, comparendos, accidentes de tránsito, recursos y nulidades.',
    preguntas: [
      '¿Tu caso es sobre una fotomulta, un comparendo o un accidente de tránsito?',
      '¿Tienes el número o copia de la infracción/accidente?',
    ],
    notaTema: null,
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  pensiones: {
    nombreMenu: 'Pensiones y seguridad social',
    temas: 'Reconocimiento de pensión, reliquidaciones, invalidez y sobrevivientes.',
    preguntas: [
      '¿Tu caso es sobre reconocimiento de pensión, reliquidación, invalidez o sobrevivientes?',
    ],
    notaTema: 'Revisaremos tu historial bajo Ley 100 de 1993. Necesitamos ver tu historia laboral para validar requisitos.',
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  administrativo: {
    nombreMenu: 'Derecho administrativo',
    temas: 'Derechos de petición, recursos, actuaciones ante entidades públicas y demandas.',
    preguntas: [
      '¿Tu caso es sobre un derecho de petición, un recurso, una actuación ante una entidad pública o una demanda?',
    ],
    notaTema: null,
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  disciplinario: {
    nombreMenu: 'Derecho disciplinario',
    temas: 'Representación judicial, descargos, acompañamiento en audiencias, alegatos.',
    preguntas: [
      '¿Ya recibiste un pliego de cargos o citación a descargos?',
    ],
    notaTema: 'Dado que son casos de alta sensibilidad y complejidad técnica, tras analizar tu información, el equipo jurídico te comunicará el valor de la asesoría.',
    tarifa: { tipo: 'variable' },
  },
  tutela: {
    nombreMenu: 'Acción de tutela',
    temas: 'Afectación de derechos fundamentales.',
    preguntas: [
      '¿Qué derecho fundamental sientes que se está afectando: vida, salud, educación, mínimo vital, debido proceso, petición o seguridad social?',
    ],
    notaTema: null,
    tarifa: { tipo: 'fija', valor: 80000 },
    esCasoEspecial: true,
  },
};

// Palabras clave en texto libre que fuerzan escalamiento directo (sin calcular tarifa):
// proceso judicial activo, terminos por vencer, necesidad de representacion, revision
// documental extensa — determinístico, no IA, per el brief del negocio.
export const SENALES_URGENCIA = [
  'demanda', 'audiencia', 'notificacion', 'notificación', 'termino', 'término',
  'vence', 'vencer', 'embargo', 'captura', 'orden de captura',
];

export function getArea(codigo) {
  return AREAS[codigo] || null;
}

export function formatoAlcanceTarifa(area) {
  if (area.tarifa.tipo === 'variable') {
    return area.notaTema;
  }
  return 'Concepto verbal orientador (análisis de tu información). No incluye trámites, documentos ni representación judicial. Cualquier trámite adicional (redacción, representación, etc.) se cotiza por separado.';
}
