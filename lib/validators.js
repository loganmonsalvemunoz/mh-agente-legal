export function parseNumeroOpcion(text, min, max) {
  const match = (text || '').trim().match(/^(\d{1,2})\b/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return n >= min && n <= max ? n : null;
}

export function parseSiNo(text) {
  const normalized = (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
  if (['si', 'sí', 's', 'yes', 'claro', 'correcto'].includes(normalized)) return true;
  if (['no', 'n', 'nop', 'negativo'].includes(normalized)) return false;
  return null;
}

export function esCorreoValido(text) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((text || '').trim());
}

export function esTelefonoValido(text) {
  const digits = (text || '').replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 13;
}

export function esTextoNoVacio(text, minLen = 2) {
  return (text || '').trim().length >= minLen;
}
