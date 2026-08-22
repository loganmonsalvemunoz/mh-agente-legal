import { formatoAlcanceTarifa } from '../config/areas.js';
import { HORARIO_TEXTO } from '../config/horarios.js';
import { getModulo } from '../config/modulos.js';
import {
  URL_CURSOS,
  WHATSAPP_ASESOR,
  WHATSAPP_INMOBILIARIA,
  enlaceWhatsApp,
  INMOBILIARIA_DESCRIPCION,
} from '../config/contacto.js';

// Tono: lenguaje claro y sencillo, evita tecnicismos (o los explica con ejemplos
// cotidianos), nunca garantiza resultados, nunca inventa normas o plazos, tono
// respetuoso/empático/profesional, siempre orienta sobre el siguiente paso.
// (Principios del Manual Maestro de MH Grupo Empresarial.)

export function mensajeOpcionInvalida() {
  return '¡Uy, no te entendí bien! 😊 Dime el número de la opción que te interesa y seguimos.';
}

export function mensajeProtocoloEtico() {
  return 'Antes de entrar en materia, cuéntame algo importante: ¿ya tienes un abogado llevando tu caso ahorita mismo?';
}

export function mensajeEticaConfirmarPazYSalvo() {
  return (
    'Entiendo. Por un tema de ética profesional, no podemos meternos en un caso que ya está en manos de otro colega, ' +
    'a menos que las cosas con él ya hayan quedado cerradas — por ejemplo, que haya renunciado o que ya le hayas pagado todo lo que le debías. ' +
    '¿Ya estás en ese punto con tu abogado anterior?'
  );
}

export function mensajeCierreEtico() {
  return (
    'Listo, te entiendo. Mientras sigas trabajando con ese abogado, lo correcto es que él siga acompañándote en esto — ' +
    'no quiero pasar por encima de su trabajo. Apenas ese tema quede resuelto, escríbeme de nuevo y con gusto seguimos. ' +
    'Si quieres ver las opciones otra vez, solo escribe "menú".'
  );
}

export function mensajeIntroArea(area) {
  return `¡Perfecto! Con gusto te oriento en ${area.nombreMenu.toLowerCase()}. Cuéntame un poco más sobre tu caso. 😊`;
}

export function mensajeCosto(area) {
  const alcance = formatoAlcanceTarifa(area);
  if (area.tarifa.tipo === 'fija') {
    return (
      `Esa asesoría tiene un valor de $${area.tarifa.valor.toLocaleString('es-CO')}. ${alcance}\n\n` +
      'Para agendarla, cuéntame algunos datos tuyos.'
    );
  }
  return `${alcance}\n\nCuéntame algunos datos tuyos y ya con eso el equipo jurídico te dice cuánto valdría en tu caso.`;
}

export function mensajeCapturaNombre() {
  return '¡Genial! Empecemos con tus datos. 📝 ¿Cuál es tu nombre completo?';
}

export function mensajeCapturaTelefono() {
  return '¡Gracias! ¿Cuál es tu número de teléfono (WhatsApp)?';
}

export function mensajeCapturaCorreo() {
  return 'Perfecto. ¿Y tu correo electrónico?';
}

export function mensajeCapturaCiudad() {
  return '¡Ya casi terminamos! ¿En qué ciudad te encuentras?';
}

export function mensajeCapturaResumen() {
  return 'Por último, cuéntame en pocas palabras un resumen de tu caso. Tranquilo(a), con lo esencial basta. 😊';
}

export function mensajeTelefonoInvalido() {
  return 'Mmm, ese número no me cuadra del todo. 🤔 ¿Puedes escribirlo de nuevo, solo con dígitos?';
}

export function mensajeCorreoInvalido() {
  return 'Ese correo no parece completo. 🤔 ¿Me lo escribes de nuevo, porfa?';
}

export function mensajeConfirmacionCaptura(lead) {
  return (
    `¡Listo, ${lead.nombre_completo.split(' ')[0]}! 🙌 Registramos tu solicitud con mucho gusto. ` +
    'Un asesor de MH Grupo Empresarial te contactará para coordinar horario y confirmar los siguientes pasos.\n\n' +
    'Escribe "menú" si necesitas algo más — aquí estaré. 😊'
  );
}

export function mensajeEscalamiento(channel) {
  const enlace = enlaceWhatsApp(WHATSAPP_ASESOR, 'Hola, vengo del asistente virtual y quisiera hablar con un asesor.');
  if (channel === 'web') {
    return (
      '¡Con mucho gusto! 🤝 Para que un asesor te atienda personalmente, continúa la conversación por WhatsApp aquí:\n' +
      `${enlace}\n\n` +
      `Nuestro horario de atención es: ${HORARIO_TEXTO}`
    );
  }
  return (
    '¡Con mucho gusto! 🤝 Uno de nuestros asesores va a continuar contigo directamente por este mismo chat. ' +
    `Si prefieres, este es el enlace directo: ${enlace}\n\n` +
    `Horario de atención: ${HORARIO_TEXTO}`
  );
}

export function mensajeEscalamientoUrgencia() {
  return (
    'Entiendo, y gracias por contármelo. Por lo que me cuentas, esto ya necesita que un abogado lo mire directamente — ' +
    'parece que hay plazos corriendo y no quiero que se te pase nada importante. Déjame tomar tus datos para que el ' +
    'equipo jurídico te contacte cuanto antes — estás en buenas manos. 🤝'
  );
}

export function mensajeDespuesDeCompletar() {
  return '¿Te ayudo con algo más? 😊 Aquí tienes el menú de nuevo:';
}

export function mensajeCursos() {
  return (
    `¡Excelente elección! 🎓 El curso "Cursos para Dummies: Ley 820" lo encuentras aquí, ` +
    `con pago en línea: ${URL_CURSOS}\n\nSi tienes dudas antes de comprar, pregúntame con confianza.`
  );
}

export function mensajeInmobiliaria() {
  const enlace = enlaceWhatsApp(WHATSAPP_INMOBILIARIA, 'Hola, vengo del asistente virtual y quisiera información inmobiliaria.');
  return (
    `¡Claro que sí! 🏡 Nuestra línea inmobiliaria maneja ${INMOBILIARIA_DESCRIPCION}. ` +
    `Escríbenos directo por WhatsApp y con gusto te muestran el catálogo de propiedades: ${enlace}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Canal de WhatsApp (whatsapp.js): SOLO pedidos de cursos — demo. El triage
// jurídico completo, formatos e inmobiliaria viven únicamente en el widget web
// (routes/widget.js + lib/conversationEngine.js). Cualquier mensaje de WhatsApp
// que no sea sobre un pedido se redirige al chat de la página (mensajeRedirigirAWeb).
// ─────────────────────────────────────────────────────────────────────────────

export function mensajeAckPedido(order) {
  return (
    `¡Hola${order.customer_name ? ' ' + order.customer_name.split(' ')[0] : ''}! 👋 Ya registramos tu pedido *${order.order_code}*.\n\n` +
    `Para confirmar tu compra, envíanos ahora la foto o captura del comprobante de pago en este mismo chat. ` +
    `En cuanto la verifiquemos te compartimos el acceso al curso. 🔒`
  );
}

export function mensajeComprobanteRecibido(order) {
  return (
    `Recibimos tu comprobante para el pedido *${order.order_code}*. ✅\n\n` +
    `Nuestro equipo lo va a verificar y te escribimos apenas quede confirmado. Normalmente esto toma poco tiempo — gracias por tu paciencia.`
  );
}

export function mensajeAprobado(order) {
  const items = order.items.map((codigo) => getModulo(codigo)).filter(Boolean);
  const enlaces = items.map((m) => `• *${m.nombre}*\n  ${m.driveUrl}`).join('\n\n');

  return (
    `¡Listo${order.customer_name ? ' ' + order.customer_name.split(' ')[0] : ''}! Verificamos tu pago del pedido *${order.order_code}* y ya puedes acceder a tu material. ✅\n\n` +
    `${enlaces}\n\n` +
    `Cualquier duda con el contenido, escríbenos por este mismo chat. Gracias por confiar en MH Grupo Empresarial.`
  );
}

export function mensajeRechazado(order, motivo) {
  return (
    `Hola${order.customer_name ? ' ' + order.customer_name.split(' ')[0] : ''}, revisamos el comprobante del pedido *${order.order_code}* y no logramos validarlo` +
    `${motivo ? ` (${motivo})` : ''}.\n\n` +
    `Por favor envíanos de nuevo una foto clara del comprobante, o cuéntanos si tuviste algún inconveniente con el pago. Quedamos atentos. 💬`
  );
}

export function mensajeImagenSinPedido() {
  return (
    'Recibimos tu imagen, pero no encontramos un pedido activo asociado a este chat. ' +
    'Si ya generaste tu pedido en la página de pago, cuéntanos el código para ayudarte.'
  );
}

// Este número de WhatsApp solo gestiona pedidos de cursos (demo). Cualquier otra consulta
// (asesoría jurídica, inmobiliaria, preguntas generales) se redirige al chat de la página web,
// que sí tiene el flujo completo — nunca se intenta responder aquí.
export function mensajeRedirigirAWeb() {
  return (
    'Por este canal de WhatsApp solo gestionamos pedidos de nuestros cursos (comprobantes de ' +
    'pago y entrega de material). Para asesoría jurídica, información de inmobiliaria o ' +
    'cualquier otra consulta, escríbenos por el chat de nuestra página web: mhgrupoempresarial.com 💬'
  );
}

export function mensajeBienvenidaCursos() {
  return (
    '¡Hola! 👋 Este canal atiende compras del curso "Cursos para Dummies: Ley 820" — envíanos ' +
    'tu pedido desde la página de pago y el comprobante aquí mismo. Para cualquier otra consulta, ' +
    'usa el chat de nuestra página web: mhgrupoempresarial.com 💬'
  );
}
