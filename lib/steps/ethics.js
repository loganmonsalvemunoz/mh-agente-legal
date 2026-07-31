// Protocolo ético obligatorio (Ley 1123 de 2007) — se ejecuta ANTES de ofrecer cualquier
// asesoría, sin importar el área jurídica. Reutilizado por las 9 áreas + tutela.
import { parseSiNo } from '../validators.js';
import {
  mensajeProtocoloEtico,
  mensajeEticaConfirmarPazYSalvo,
  mensajeCierreEtico,
  mensajeIntroArea,
} from '../messages.js';
import { getArea } from '../../config/areas.js';
import * as db from '../../db.js';

export function iniciarProtocoloEtico(conversation) {
  db.updateConversation(conversation.contact_id, { step: db.STEP.ETHICS_ASK });
  return [mensajeProtocoloEtico()];
}

export function handleEthicsAsk(conversation, text) {
  const respuesta = parseSiNo(text);
  if (respuesta === null) {
    return ['No entendí tu respuesta. ' + mensajeProtocoloEtico()];
  }
  if (respuesta === true) {
    db.updateConversation(conversation.contact_id, { step: db.STEP.ETHICS_NO_LAWYER_CONFIRM });
    return [mensajeEticaConfirmarPazYSalvo()];
  }
  return iniciarPreguntasDeArea(conversation, { ethicsPassed: true, ethicsNotes: 'No tiene abogado apoderado' });
}

export function handleEthicsNoLawyerConfirm(conversation, text) {
  const respuesta = parseSiNo(text);
  if (respuesta === null) {
    return ['No entendí tu respuesta. ' + mensajeEticaConfirmarPazYSalvo()];
  }
  if (respuesta === true) {
    return iniciarPreguntasDeArea(conversation, {
      ethicsPassed: true,
      ethicsNotes: 'Tiene terminación de poder / paz y salvo con abogado anterior',
    });
  }
  db.createLead({
    contactId: conversation.contact_id,
    channel: conversation.channel,
    area: conversation.area,
    ethicsPassed: false,
    ethicsNotes: 'Cuenta con abogado apoderado activo, sin terminación de poder ni paz y salvo',
  });
  db.updateConversation(conversation.contact_id, { step: db.STEP.CLOSED_ETHICS });
  return [mensajeCierreEtico()];
}

function iniciarPreguntasDeArea(conversation, ethicsInfo) {
  const area = getArea(conversation.area);
  db.updateConversation(conversation.contact_id, {
    step: db.STEP.AREA_QUESTIONS,
    context: { ...conversation.context, questionIndex: 0, answers: [], ...ethicsInfo },
  });
  return [mensajeIntroArea(area), area.preguntas[0]];
}
