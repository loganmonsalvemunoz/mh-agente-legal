// Protocolo de captura de datos (obligatorio): nombre, telefono, correo, ciudad, resumen.
// Un handler generico por campo, reutilizado siempre igual sin importar el area.
import { esCorreoValido, esTelefonoValido, esTextoNoVacio } from '../validators.js';
import {
  mensajeCapturaTelefono,
  mensajeCapturaCorreo,
  mensajeCapturaCiudad,
  mensajeCapturaResumen,
  mensajeTelefonoInvalido,
  mensajeCorreoInvalido,
  mensajeConfirmacionCaptura,
  mensajeDespuesDeCompletar,
} from '../messages.js';
import { getArea } from '../../config/areas.js';
import { textoMenu } from '../menu.js';
import * as db from '../../db.js';

export function handleCaptureNombre(conversation, text) {
  if (!esTextoNoVacio(text)) return ['¿Cuál es tu nombre completo?'];
  db.updateConversation(conversation.contact_id, {
    context: { ...conversation.context, nombreCompleto: text.trim() },
    step: db.STEP.CAPTURE_TELEFONO,
  });
  return [mensajeCapturaTelefono()];
}

export function handleCaptureTelefono(conversation, text) {
  if (!esTelefonoValido(text)) return [mensajeTelefonoInvalido()];
  db.updateConversation(conversation.contact_id, {
    context: { ...conversation.context, telefono: text.trim() },
    step: db.STEP.CAPTURE_CORREO,
  });
  return [mensajeCapturaCorreo()];
}

export function handleCaptureCorreo(conversation, text) {
  if (!esCorreoValido(text)) return [mensajeCorreoInvalido()];
  db.updateConversation(conversation.contact_id, {
    context: { ...conversation.context, correo: text.trim() },
    step: db.STEP.CAPTURE_CIUDAD,
  });
  return [mensajeCapturaCiudad()];
}

export function handleCaptureCiudad(conversation, text) {
  if (!esTextoNoVacio(text)) return ['¿En qué ciudad te encuentras?'];
  db.updateConversation(conversation.contact_id, {
    context: { ...conversation.context, ciudad: text.trim() },
    step: db.STEP.CAPTURE_RESUMEN,
  });
  return [mensajeCapturaResumen()];
}

export function handleCaptureResumen(conversation, text) {
  if (!esTextoNoVacio(text, 3)) return ['Cuéntanos brevemente tu caso en un par de líneas.'];

  const ctx = { ...conversation.context, resumenCaso: text.trim() };
  const area = getArea(conversation.area);
  const escalated = !!ctx.escalate;

  const lead = db.createLead({
    contactId: conversation.contact_id,
    channel: conversation.channel,
    area: conversation.area,
    ethicsPassed: !!ctx.ethicsPassed,
    ethicsNotes: ctx.ethicsNotes || null,
    areaAnswers: ctx.answers || null,
    costoInformado: area ? (area.tarifa.tipo === 'fija' ? String(area.tarifa.valor) : 'variable') : null,
    nombreCompleto: ctx.nombreCompleto,
    telefono: ctx.telefono,
    correo: ctx.correo,
    ciudad: ctx.ciudad,
    resumenCaso: ctx.resumenCaso,
    escalated,
    escalateReason: ctx.escalateReason || null,
  });

  db.updateConversation(conversation.contact_id, {
    needsHuman: escalated,
    escalateReason: ctx.escalateReason || null,
  });
  db.resetConversation(conversation.contact_id);

  return [mensajeConfirmacionCaptura(lead), mensajeDespuesDeCompletar(), textoMenu()];
}
