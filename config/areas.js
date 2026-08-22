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
      '¿Hace cuánto terminó tu trabajo, o está por terminar?',
      '¿Firmaste un contrato por escrito?',
    ],
    notaTema: 'Vamos a mirar con calma qué derechos tienes según tu situación laboral.',
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  familia: {
    nombreMenu: 'Derecho de familia',
    temas: 'Divorcios, custodia, alimentos, visitas, sucesiones, unión marital de hecho.',
    preguntas: [
      'Cuéntame, ¿tu caso es de divorcio, custodia de hijos, cuota de alimentos, visitas, una herencia o unión libre?',
      '¿Ya hay algo de esto en un juzgado, o todavía no?',
    ],
    notaTema: null,
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  civil: {
    nombreMenu: 'Derecho civil',
    temas: 'Incumplimientos contractuales, deudas, responsabilidad civil, restituciones.',
    preguntas: [
      '¿Tu caso es porque alguien no cumplió un contrato, por una deuda, un daño que te causaron, o para recuperar un bien?',
      '¿Tienes algún contrato o documento firmado sobre esto?',
    ],
    notaTema: null,
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  penal: {
    nombreMenu: 'Derecho penal',
    temas: 'Denuncias, representación de víctimas, indiciados, acusados, audiencias y acompañamiento judicial.',
    preguntas: [
      'Para entender bien tu caso: ¿eres la víctima, o a ti te están investigando o acusando?',
      '¿Ya pusiste (o te pusieron) una denuncia formal?',
    ],
    notaTema: 'Como estos casos son delicados y cada uno es distinto, en cuanto revise bien tu información el equipo jurídico te dice cuánto valdría tu asesoría.',
    tarifa: { tipo: 'variable' },
  },
  transito: {
    nombreMenu: 'Tránsito',
    temas: 'Fotomultas, comparendos, accidentes de tránsito, recursos y nulidades.',
    preguntas: [
      '¿Tu caso es por una fotomulta, un comparendo, o un accidente de tránsito?',
      '¿Tienes a la mano el número de la infracción o algún documento del accidente?',
    ],
    notaTema: null,
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  pensiones: {
    nombreMenu: 'Pensiones y seguridad social',
    temas: 'Reconocimiento de pensión, reliquidaciones, invalidez y sobrevivientes.',
    preguntas: [
      '¿Estás tramitando tu pensión, quieres que te la recalculen, o es por invalidez o por ser beneficiario de alguien que falleció?',
    ],
    notaTema: 'Vamos a revisar tu historia laboral para ver si ya cumples los requisitos.',
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  administrativo: {
    nombreMenu: 'Derecho administrativo',
    temas: 'Derechos de petición, recursos, actuaciones ante entidades públicas y demandas.',
    preguntas: [
      '¿Tu caso es sobre un derecho de petición, un recurso, algún trámite con una entidad del Estado, o una demanda?',
    ],
    notaTema: null,
    tarifa: { tipo: 'fija', valor: 80000 },
  },
  disciplinario: {
    nombreMenu: 'Derecho disciplinario',
    temas: 'Representación judicial, descargos, acompañamiento en audiencias, alegatos.',
    preguntas: [
      '¿Ya te llegó un pliego de cargos o te citaron a descargos?',
    ],
    notaTema: 'Como estos casos son delicados y cada uno es distinto, en cuanto revise bien tu información el equipo jurídico te dice cuánto valdría tu asesoría.',
    tarifa: { tipo: 'variable' },
  },
  tutela: {
    nombreMenu: 'Acción de tutela',
    temas: 'Afectación de derechos fundamentales.',
    preguntas: [
      'Cuéntame, ¿qué derecho sientes que te están vulnerando: la salud, la educación, el mínimo para vivir, un debido proceso, una respuesta que te deben, o tu seguridad social?',
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
  return 'Ahí reviso tu caso con calma y te doy mi concepto sobre qué puedes hacer. Si después necesitas que te redactemos algún documento o te representemos, eso ya se cotiza aparte.';
}
