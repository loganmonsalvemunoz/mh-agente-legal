// Catalogo del curso "Cursos para Dummies: Ley 820", igual al de mh-automatizacion (misma
// fuente de verdad conceptual — si cambia el catalogo real, actualiza ambos proyectos).
// driveUrl es un placeholder: reemplaza cada uno por el enlace real de Google Drive
// (permiso "Cualquier persona con el enlace puede ver") antes de operar en produccion.
export const MODULOS = {
  'MH-L820-M1': {
    nombre: 'Módulo 1: Generalidades del contrato',
    precio: 85700,
    driveUrl: 'https://drive.google.com/PENDIENTE-MODULO-1',
  },
  'MH-L820-M2': {
    nombre: 'Módulo 2: Obligaciones, derechos y condiciones',
    precio: 85700,
    driveUrl: 'https://drive.google.com/PENDIENTE-MODULO-2',
  },
  'MH-L820-M3': {
    nombre: 'Módulo 3: Subarrendamiento, cesión de contrato y canon',
    precio: 85700,
    driveUrl: 'https://drive.google.com/PENDIENTE-MODULO-3',
  },
  'MH-L820-M4': {
    nombre: 'Módulo 4: Depósitos en los contratos',
    precio: 85700,
    driveUrl: 'https://drive.google.com/PENDIENTE-MODULO-4',
  },
  'MH-L820-M5': {
    nombre: 'Módulo 5: Reparaciones y daños en los inmuebles',
    precio: 85700,
    driveUrl: 'https://drive.google.com/PENDIENTE-MODULO-5',
  },
  'MH-L820-M6': {
    nombre: 'Módulo 6: Formas de terminar el contrato',
    precio: 85700,
    driveUrl: 'https://drive.google.com/PENDIENTE-MODULO-6',
  },
  'MH-L820-M7': {
    nombre: 'Módulo 7: Prohibiciones del arrendador',
    precio: 85700,
    driveUrl: 'https://drive.google.com/PENDIENTE-MODULO-7',
  },
  'MH-L820-COMPLETO': {
    nombre: 'Paquete completo (7 módulos)',
    precio: 479920,
    driveUrl: 'https://drive.google.com/PENDIENTE-PAQUETE-COMPLETO',
  },
};

export function getModulo(codigo) {
  return MODULOS[codigo] || null;
}

export function formatCOP(valor) {
  if (valor === null || valor === undefined) return 'N/D';
  return '$' + Number(valor).toLocaleString('es-CO');
}
