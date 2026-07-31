// Handler generico de "Escuchar" para las 9 areas + tutela: recorre config/areas.js
// preguntas[] segun un indice guardado en el contexto — evita 10 funciones casi identicas.
import { getArea, SENALES_URGENCIA } from '../../config/areas.js';
import { mensajeCosto, mensajeCapturaNombre, mensajeEscalamientoUrgencia } from '../messages.js';
import * as db from '../../db.js';

function detectarUrgencia(text) {
  const normalized = (text || '').toLowerCase();
  return SENALES_URGENCIA.find((s) => normalized.includes(s)) || null;
}

export function handleAreaQuestions(conversation, text) {
  const area = getArea(conversation.area);
  const { questionIndex, answers } = conversation.context;
  const nuevasRespuestas = [...answers, text];
  const urgencia = detectarUrgencia(text);

  const siguienteIndex = questionIndex + 1;
  const hayMasPreguntas = siguienteIndex < area.preguntas.length;

  if (urgencia) {
    db.updateConversation(conversation.contact_id, {
      context: { ...conversation.context, answers: nuevasRespuestas, escalate: true, escalateReason: `señal: ${urgencia}` },
      step: db.STEP.CAPTURE_NOMBRE,
      needsHuman: true,
      escalateReason: `señal detectada en área ${conversation.area}: ${urgencia}`,
    });
    return [mensajeEscalamientoUrgencia(), mensajeCapturaNombre()];
  }

  if (hayMasPreguntas) {
    db.updateConversation(conversation.contact_id, {
      context: { ...conversation.context, answers: nuevasRespuestas, questionIndex: siguienteIndex },
    });
    return [area.preguntas[siguienteIndex]];
  }

  db.updateConversation(conversation.contact_id, {
    context: { ...conversation.context, answers: nuevasRespuestas },
    step: db.STEP.CAPTURE_NOMBRE,
  });
  return [mensajeCosto(area), mensajeCapturaNombre()];
}
