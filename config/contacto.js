// Datos reales investigados en mhgrupoempresarial.com (julio 2026). Si algo cambia en el
// sitio, actualiza aquí — todo el resto del bot referencia estas constantes, no números o
// URLs sueltos por el código.
// La página real también vende formatos, pero el bot solo ofrece los cursos por ahora
// (decisión explícita del negocio) — no cambies este alcance sin que te lo pidan.
export const URL_CURSOS = 'https://mhgrupoempresarial.com/cursos';

export const WHATSAPP_ASESOR = '573137681398'; // sede Medellín, mismo número del bot
export const WHATSAPP_INMOBILIARIA = '573505043863'; // línea dedicada de inmobiliaria

export function enlaceWhatsApp(numero, mensaje) {
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
  return `https://wa.me/${numero}${texto}`;
}

export const SEDES = [
  { ciudad: 'Medellín', direccion: 'Calle 32 E #76-103, Oficina 401, Laureles', telefono: '313 768 1398 / (604) 473 0188' },
  { ciudad: 'Cartagena', direccion: 'Carrera Ebro 44D #30-68', telefono: '315 849 3605' },
  { ciudad: 'Pasto', direccion: 'Carrera 28A N° 17-15, Edificio Antonella', telefono: '300 646 6062' },
];

export const CORREO_CONTACTO = 'comunicaciones@mhgrupoempresarial.com';

export const INMOBILIARIA_DESCRIPCION =
  'venta de apartaestudios, apartamentos, casas campestres y fincas en Bello, La Ceja, El Peñol y Rionegro';

export const OTROS_SERVICIOS =
  'contaduría, asesoría tributaria, criminalística, investigación privada, psicología y capacitaciones empresariales';
