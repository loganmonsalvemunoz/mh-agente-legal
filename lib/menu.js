import { AREAS } from '../config/areas.js';
import { parseNumeroOpcion } from './validators.js';
import { NOMBRE_ASISTENTE } from './messages.js';

// El menu principal se presenta como texto numerado clasico (estilo EPS SURA) — decision
// confirmada con el usuario, sin listas/botones interactivos de WhatsApp.
//
// Los numeros se derivan automaticamente del orden de esta lista (indice + 1), nunca se
// escriben a mano por entrada — asi se evita cualquier desajuste al agregar/quitar opciones
// (la lista y el sub-menu de areas siempre quedan en sincronia).
const MENU_ITEMS_BASE = [
  { texto: 'Agendar asesoría', tipo: 'agendar' },
  { texto: 'Adquirir cursos (Cursos para Dummies)', tipo: 'cursos' },
  { texto: AREAS.laboral.nombreMenu, tipo: 'area', area: 'laboral' },
  { texto: AREAS.familia.nombreMenu, tipo: 'area', area: 'familia' },
  { texto: AREAS.civil.nombreMenu, tipo: 'area', area: 'civil' },
  { texto: AREAS.penal.nombreMenu, tipo: 'area', area: 'penal' },
  { texto: AREAS.transito.nombreMenu, tipo: 'area', area: 'transito' },
  { texto: AREAS.pensiones.nombreMenu, tipo: 'area', area: 'pensiones' },
  { texto: AREAS.administrativo.nombreMenu, tipo: 'area', area: 'administrativo' },
  { texto: AREAS.disciplinario.nombreMenu, tipo: 'area', area: 'disciplinario' },
  { texto: AREAS.tutela.nombreMenu, tipo: 'area', area: 'tutela' },
  { texto: 'Inmobiliaria', tipo: 'inmobiliaria' },
  { texto: 'Hablar con un asesor', tipo: 'asesor' },
];

export const MENU_OPTIONS = MENU_ITEMS_BASE.map((item, index) => ({ ...item, numero: index + 1 }));
const MENU_MIN = 1;
const MENU_MAX = MENU_OPTIONS.length;

export function textoMenu() {
  return MENU_OPTIONS.map((o) => `${o.numero}. ${o.texto}`).join('\n');
}

export function textoBienvenida() {
  return (
    `¡Hola! 👋 Soy ${NOMBRE_ASISTENTE}, el asistente virtual de MH Grupo Empresarial. Con gusto te ayudo ` +
    'con asesorías legales, cursos, temas de inmobiliaria, agendar una cita o simplemente orientarte. ' +
    '¿En qué te puedo colaborar hoy?\n\n' +
    textoMenu()
  );
}

export function parseOpcionMenu(text) {
  const numero = parseNumeroOpcion(text, MENU_MIN, MENU_MAX);
  if (numero === null) return null;
  return MENU_OPTIONS.find((o) => o.numero === numero) || null;
}

// Sub-menu de areas para "Agendar asesoría" (opción 1) — el usuario elige primero el area
// antes de entrar al mismo flujo (Escuchar -> Validar Ética -> Informar Costo -> Capturar Datos).
// Se renumera desde el 1 (no reutiliza los numeros del menu principal) — es un listado nuevo
// que el usuario ve en ese momento, así que debe empezar en 1 como cualquier otro menú.
const AREA_SUBMENU_OPTIONS = MENU_OPTIONS.filter((o) => o.tipo === 'area').map((item, index) => ({
  ...item,
  numeroSubMenu: index + 1,
}));

export function textoSubMenuAreas() {
  return AREA_SUBMENU_OPTIONS.map((o) => `${o.numeroSubMenu}. ${o.texto}`).join('\n');
}

export function parseOpcionArea(text) {
  const numero = parseNumeroOpcion(text, 1, AREA_SUBMENU_OPTIONS.length);
  if (numero === null) return null;
  return AREA_SUBMENU_OPTIONS.find((o) => o.numeroSubMenu === numero) || null;
}
