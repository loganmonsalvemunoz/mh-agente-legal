// Parser del mensaje pre-armado que genera pasarela_pago.html al confirmar la compra de un
// curso — mismo formato y expresiones regulares que mh-automatizacion/lib/parser.js (los dos
// proyectos deben interpretar el mismo mensaje de pedido igual).
//
// Formato esperado (canonico):
//
//   Nuevo pedido MH Grupo Empresarial
//   Pedido: MH-A1B2C3-0001
//   Producto(s): MH-L820-M1, MH-L820-M3
//   Total: $171.400
//   Método de pago: Bancolombia - Cuenta de ahorros
//   Nombre: Juan Pérez
//   Cédula: 1020304050
//   Celular: 3001234567
//   Correo: juan@email.com

const FIELD_PATTERNS = {
  orderCode: /pedido:\s*([A-Z0-9-]+)/i,
  items: /producto\(?s?\)?:\s*([^\n]+)/i,
  total: /total:\s*\$?\s*([\d.,]+)/i,
  paymentMethod: /m[eé]todo de pago:\s*([^\n]+)/i,
  customerName: /nombre:\s*([^\n]+)/i,
  customerCedula: /c[eé]dula:\s*([^\n]+)/i,
  customerPhone: /celular:\s*([^\n]+)/i,
  customerEmail: /correo:\s*([^\n]+)/i,
};

const ORDER_CODE_HINT = /pedido:/i;

export function pareceMensajeDePedido(text) {
  return ORDER_CODE_HINT.test(text || '');
}

export function parsearPedido(text) {
  if (!text) return null;
  const clean = text.replace(/\*/g, '');

  const orderCodeMatch = clean.match(FIELD_PATTERNS.orderCode);
  if (!orderCodeMatch) return null;

  const get = (key) => {
    const m = clean.match(FIELD_PATTERNS[key]);
    return m ? m[1].trim() : null;
  };

  const itemsRaw = get('items');
  const items = itemsRaw
    ? itemsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const totalRaw = get('total');
  const total = totalRaw ? parseInt(totalRaw.replace(/[.,]/g, ''), 10) : null;

  return {
    orderCode: orderCodeMatch[1].trim(),
    items,
    total,
    paymentMethod: get('paymentMethod'),
    customerName: get('customerName'),
    customerCedula: get('customerCedula'),
    customerPhone: get('customerPhone'),
    customerEmail: get('customerEmail'),
  };
}
