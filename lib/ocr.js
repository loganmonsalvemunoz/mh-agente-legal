// Verificacion automatica de comprobantes de pago via OCR (tesseract.js, gratuito, sin
// compilacion nativa). Objetivo: reducir fraude sin depender de revision humana (panel admin
// apagado por decision del negocio) — lee el texto de la captura y confirma que el monto
// coincide con el total del pedido, y si el codigo del pedido tambien aparece (cuando el
// cliente lo puso como referencia de la transferencia), suma confianza a la verificacion.
//
// Limite conocido: el OCR de capturas de apps bancarias no es 100% infalible (formatos muy
// distintos entre bancos, calidad de la foto, etc.) — por eso NUNCA se rechaza en el primer
// intento fallido, se le pide al cliente reenviar y solo tras varios intentos se escala a un
// asesor humano por WhatsApp (ver MAX_INTENTOS_VERIFICACION en whatsapp.js).
import { createWorker } from 'tesseract.js';

const NUMERO_PATTERN = /\d{1,3}(?:[.,]\d{3})+|\d{4,}/g;
const MONTO_MINIMO_VALIDO = 1000; // descarta ruido (fechas, horas, ultimos digitos de cuenta)

export async function leerTextoDeImagen(buffer) {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(buffer);
    return data.text || '';
  } finally {
    await worker.terminate();
  }
}

export function extraerMontosCandidatos(texto) {
  const matches = texto.match(NUMERO_PATTERN) || [];
  return matches
    .map((m) => parseInt(m.replace(/[.,]/g, ''), 10))
    .filter((n) => Number.isFinite(n) && n >= MONTO_MINIMO_VALIDO);
}

export function contieneCodigoPedido(texto, orderCode) {
  const normalizado = (texto || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const codigoNormalizado = (orderCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return codigoNormalizado.length > 0 && normalizado.includes(codigoNormalizado);
}

// Verifica un comprobante contra un pedido. Devuelve montoCoincide=true si el total del
// pedido aparece tal cual entre los numeros detectados en la imagen — esa es la senal fuerte
// que dispara la aprobacion automatica.
export async function verificarComprobante(buffer, order) {
  let texto = '';
  try {
    texto = await leerTextoDeImagen(buffer);
  } catch (err) {
    console.error('[OCR] Error leyendo la imagen:', err);
    return { texto: '', montos: [], montoCoincide: false, codigoEncontrado: false, error: true };
  }
  const montos = extraerMontosCandidatos(texto);
  const montoCoincide = order.total != null && montos.includes(Number(order.total));
  const codigoEncontrado = contieneCodigoPedido(texto, order.order_code);
  return { texto, montos, montoCoincide, codigoEncontrado, error: false };
}
