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
//
// Personalidad: el asistente no tiene nombre propio — se presenta como "el asistente virtual de MH Grupo Empresarial": un asesor cercano, informal
// y campechano, no un sistema técnico. Lo dice en el saludo inicial (mensajeBienvenidaCursos
// / textoBienvenida en menu.js) y mantiene ese tono relajado en el resto de la conversación, sin
// repetir la presentación en cada mensaje (como haría cualquier asesor real).

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
// Canal de WhatsApp de cursos (whatsapp.js): SOLO pedidos de cursos — demo. El triage
// jurídico completo, formatos e inmobiliaria viven en el widget web y (cuando haya número)
// en el segundo bot de WhatsApp general — ver lib/conversationEngine.js. Cualquier mensaje
// que no sea sobre un pedido se redirige a la página o a la página de cursos según lo que
// pida el cliente (mensajeRedirigirAWeb / mensajeCursos).
// ─────────────────────────────────────────────────────────────────────────────

export function mensajeAckPedido(order) {
  return (
    `¡Hola${order.customer_name ? ' ' + order.customer_name.split(' ')[0] : ''}! 👋 Ya te guardé el pedido *${order.order_code}*.\n\n` +
    `Ahora mándame la foto o captura del comprobante de pago aquí mismo y yo te lo reviso al toque. ` +
    `Ojo: para que la verificación salga bien a la primera, que la captura se vea completa y clara (monto y fecha visibles). 🔒`
  );
}

export function mensajeComprobanteRecibido(order) {
  return (
    `Listo, ya me llegó tu comprobante del pedido *${order.order_code}*. ✅\n\n` +
    `Dame un segundo que lo estoy revisando...`
  );
}

export function mensajeAprobado(order) {
  const items = order.items.map((codigo) => getModulo(codigo)).filter(Boolean);
  const enlaces = items.map((m) => `• *${m.nombre}*\n  ${m.driveUrl}`).join('\n\n');

  return (
    `¡Todo en orden${order.customer_name ? ', ' + order.customer_name.split(' ')[0] : ''}! Ya confirmé tu pago del pedido *${order.order_code}* y aquí tienes tu material. ✅\n\n` +
    `${enlaces}\n\n` +
    `Si te queda alguna duda con el contenido, me escribes por aquí mismo. ¡Que lo disfrutes! 🙌`
  );
}

export function mensajeRechazado(order, motivo) {
  return (
    `Hola${order.customer_name ? ' ' + order.customer_name.split(' ')[0] : ''}, revisé el comprobante del pedido *${order.order_code}* y no lo pude validar` +
    `${motivo ? ` (${motivo})` : ''}.\n\n` +
    `¿Me lo puedes enviar de nuevo, o me cuentas si tuviste algún problema con el pago? Quedo pendiente. 💬`
  );
}

// El monto (o a veces el codigo del pedido) no coincidio con lo que se ve en la imagen —
// se le pide reenviar antes de escalar a un asesor humano (ver MAX_INTENTOS_VERIFICACION en
// whatsapp.js). Nunca se acusa de fraude directamente: puede ser simplemente una foto borrosa
// o recortada.
export function mensajeMontoNoCoincide(order) {
  const totalTexto = order.total != null ? `$${Number(order.total).toLocaleString('es-CO')}` : 'el valor del pedido';
  return (
    `Mmm, revisé tu comprobante del pedido *${order.order_code}* pero no logré confirmar que el monto coincida con ${totalTexto}. 🤔\n\n` +
    `¿Me mandas otra vez la captura completa (que se vea el monto clarito)? A veces el recorte de la foto tapa esa parte.`
  );
}

// Tras varios intentos sin poder validar el comprobante automáticamente, se pasa el caso a un
// asesor humano por WhatsApp en vez de seguir pidiendo reintentos indefinidamente — sin
// depender del panel admin (apagado por decisión del negocio).
export function mensajeEscaladoVerificacionPedido(order) {
  const enlace = enlaceWhatsApp(
    WHATSAPP_ASESOR,
    `Hola, tengo un problema para validar mi comprobante del pedido ${order.order_code}.`
  );
  return (
    `Tranquilo${order.customer_name ? ', ' + order.customer_name.split(' ')[0] : ''}, no te preocupes — ya van varios intentos y prefiero que uno de nuestros asesores lo revise contigo directamente. 🤝\n\n` +
    `Escríbele por aquí y le cuentas tu caso con el pedido *${order.order_code}*: ${enlace}`
  );
}

export function mensajeImagenSinPedido() {
  return (
    'Me llegó tu imagen, pero no veo un pedido activo asociado a este chat. ' +
    'Si ya hiciste tu pedido en la página de pago, pásame el código y te ayudo.'
  );
}

// Este número de WhatsApp solo gestiona pedidos de cursos (demo). Cualquier otra consulta
// (asesoría jurídica, inmobiliaria, preguntas generales) se redirige al chat de la página web,
// que sí tiene el flujo completo — nunca se intenta responder aquí.
export function mensajeRedirigirAWeb() {
  return (
    `Por aquí solo te ayudo con pedidos de nuestros cursos (comprobantes y entrega del material). ` +
    `Para asesoría jurídica, inmobiliaria o cualquier otra consulta, mejor escríbenos por el chat de nuestra página: mhgrupoempresarial.com 💬`
  );
}

export function mensajeBienvenidaCursos() {
  return (
    `¡Hola! 👋 Soy el asistente de MH Grupo Empresarial. Por este número solo manejo compras del curso ` +
    `"Cursos para Dummies: Ley 820" — mándame tu pedido desde la página de pago y el comprobante aquí mismo, yo te lo reviso. ` +
    `Para cualquier otra consulta, mejor entra al chat de nuestra página: mhgrupoempresarial.com 💬`
  );
}
