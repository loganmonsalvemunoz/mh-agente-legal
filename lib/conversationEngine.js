// Motor de conversacion: unico punto de entrada procesarMensaje(contactId, text, channel).
// Transporte-agnostico — tanto whatsapp.js (Baileys) como routes/widget.js (canal web)
// llaman a esta misma funcion; ninguno de los dos conoce la logica de negocio.
import * as db from '../db.js';
import { textoBienvenida, textoMenu, textoSubMenuAreas, parseOpcionMenu, parseOpcionArea } from './menu.js';
import { buscarRespuestaFaq, esSaludo } from './faq.js';
import {
  mensajeOpcionInvalida,
  mensajeCierreEtico,
  mensajeEscalamiento,
  mensajeInmobiliaria,
} from './messages.js';
import { iniciarProtocoloEtico, handleEthicsAsk, handleEthicsNoLawyerConfirm } from './steps/ethics.js';
import { handleAreaQuestions } from './steps/areaFlow.js';
import {
  handleCaptureNombre,
  handleCaptureTelefono,
  handleCaptureCorreo,
  handleCaptureCiudad,
  handleCaptureResumen,
} from './steps/capture.js';

const COMANDOS_MENU = ['menu', 'menú'];
const COMANDOS_REINICIAR = ['reiniciar', 'cancelar', 'salir'];

function normalizar(text) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

export function procesarMensaje(contactId, text, channel = 'whatsapp') {
  db.logMessage(contactId, 'in', 'text', db.maskText(text));
  const conversation = db.getOrCreateConversation(contactId, channel);
  db.updateConversation(contactId, { preview: db.maskText(text) });

  const normalized = normalizar(text);

  // Comandos globales — funcionan desde cualquier estado, antes que cualquier logica de paso.
  if (COMANDOS_MENU.includes(normalized)) {
    db.resetConversation(contactId);
    return [textoBienvenida()];
  }
  if (COMANDOS_REINICIAR.includes(normalized)) {
    db.resetConversation(contactId);
    return ['Listo, reiniciamos la conversación.', textoBienvenida()];
  }

  const replies = despachar(conversation, text, normalized);
  replies.forEach((r) => db.logMessage(contactId, 'out', 'text', db.maskText(r)));
  return replies;
}

function despachar(conversation, text, normalized) {
  switch (conversation.step) {
    case 'MENU':
      return handleMenu(conversation, text, normalized);
    case 'AGENDAR_ELEGIR_AREA':
      return handleAgendarElegirArea(conversation, text);
    case 'ETHICS_ASK':
      return handleEthicsAsk(conversation, text);
    case 'ETHICS_NO_LAWYER_CONFIRM':
      return handleEthicsNoLawyerConfirm(conversation, text);
    case 'AREA_QUESTIONS':
      return handleAreaQuestions(conversation, text);
    case 'CAPTURE_NOMBRE':
      return handleCaptureNombre(conversation, text);
    case 'CAPTURE_TELEFONO':
      return handleCaptureTelefono(conversation, text);
    case 'CAPTURE_CORREO':
      return handleCaptureCorreo(conversation, text);
    case 'CAPTURE_CIUDAD':
      return handleCaptureCiudad(conversation, text);
    case 'CAPTURE_RESUMEN':
      return handleCaptureResumen(conversation, text);
    case 'CLOSED_ETHICS':
      db.resetConversation(conversation.contact_id);
      return [mensajeCierreEtico(), textoMenu()];
    default:
      db.resetConversation(conversation.contact_id);
      return [textoBienvenida()];
  }
}

function handleMenu(conversation, text, normalized) {
  const opcion = parseOpcionMenu(text);

  if (opcion) {
    if (opcion.tipo === 'agendar') {
      db.updateConversation(conversation.contact_id, { step: 'AGENDAR_ELEGIR_AREA' });
      return ['¿Sobre qué área jurídica necesitas la asesoría?', textoSubMenuAreas()];
    }
    if (opcion.tipo === 'inmobiliaria') {
      return [mensajeInmobiliaria(), textoMenu()];
    }
    if (opcion.tipo === 'asesor') {
      db.updateConversation(conversation.contact_id, {
        needsHuman: true,
        escalateReason: 'Solicitud directa de hablar con un asesor',
      });
      db.createLead({
        contactId: conversation.contact_id,
        channel: conversation.channel,
        area: 'general',
        ethicsPassed: true,
        ethicsNotes: 'No aplica — escalamiento directo',
        escalated: true,
        escalateReason: 'Solicitud directa de hablar con un asesor',
      });
      return [mensajeEscalamiento(conversation.channel)];
    }
    if (opcion.tipo === 'area') {
      db.updateConversation(conversation.contact_id, { area: opcion.area });
      return iniciarProtocoloEtico({ ...conversation, area: opcion.area });
    }
  }

  const faq = buscarRespuestaFaq(text);
  if (faq) return [faq, textoMenu()];

  if (esSaludo(text)) return [textoBienvenida()];

  return [mensajeOpcionInvalida(), textoMenu()];
}

function handleAgendarElegirArea(conversation, text) {
  const opcion = parseOpcionArea(text);
  if (!opcion) {
    return [mensajeOpcionInvalida(), textoSubMenuAreas()];
  }
  db.updateConversation(conversation.contact_id, { area: opcion.area });
  return iniciarProtocoloEtico({ ...conversation, area: opcion.area });
}
