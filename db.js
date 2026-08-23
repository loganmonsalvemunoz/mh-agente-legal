import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Modulo nativo node:sqlite (Node 22.5+/24) en vez de better-sqlite3: evita depender de
// compilacion nativa (node-gyp/Visual Studio Build Tools) en Windows — mismo criterio que
// mh-automatizacion/db.js.
const db = new DatabaseSync(path.join(dataDir, 'mh-legal.db'));
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS conversations (
  contact_id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  step TEXT NOT NULL DEFAULT 'MENU',
  area TEXT,
  context_json TEXT NOT NULL DEFAULT '{}',
  needs_human INTEGER NOT NULL DEFAULT 0,
  escalate_reason TEXT,
  last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_message_preview TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  area TEXT NOT NULL,
  ethics_passed INTEGER NOT NULL DEFAULT 0,
  ethics_notes TEXT,
  area_answers_json TEXT,
  costo_informado TEXT,
  nombre_completo TEXT,
  telefono TEXT,
  correo TEXT,
  ciudad TEXT,
  resumen_caso TEXT,
  escalated INTEGER NOT NULL DEFAULT 0,
  escalate_reason TEXT,
  status TEXT NOT NULL DEFAULT 'nuevo',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS message_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  kind TEXT NOT NULL,
  preview TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pedidos de cursos por WhatsApp (canal separado del widget web: el bot de WhatsApp de este
-- proyecto solo gestiona compras de cursos, no el triage juridico — ver whatsapp.js).
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL,
  whatsapp_jid TEXT NOT NULL,
  items_json TEXT NOT NULL,
  total INTEGER,
  payment_method TEXT,
  customer_name TEXT,
  customer_cedula TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  proof_image_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending_proof',
  reviewed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_contact ON leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_area ON leads(area);
CREATE INDEX IF NOT EXISTS idx_conversations_step ON conversations(step);
CREATE INDEX IF NOT EXISTS idx_orders_jid ON orders(whatsapp_jid);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
`);

// Migracion ligera: agrega la columna de intentos de verificacion OCR a bases de datos creadas
// antes de esta funcionalidad. SQLite no soporta "ADD COLUMN IF NOT EXISTS" — se ignora el
// error si la columna ya existe (mismo patron que cualquier migracion aditiva simple).
try {
  db.exec('ALTER TABLE orders ADD COLUMN verification_attempts INTEGER NOT NULL DEFAULT 0');
} catch {
  // La columna ya existe — no hay nada que hacer.
}

export const ORDER_STATUS = {
  PENDING_PROOF: 'pending_proof',
  PENDING_REVIEW: 'pending_review',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
};

function deserializeOrder(row) {
  return row ? { ...row, items: JSON.parse(row.items_json) } : null;
}

export function createOrder({ orderCode, whatsappJid, items, total, paymentMethod, customerName, customerCedula, customerPhone, customerEmail }) {
  const stmt = db.prepare(`
    INSERT INTO orders (order_code, whatsapp_jid, items_json, total, payment_method, customer_name, customer_cedula, customer_phone, customer_email, status)
    VALUES (@orderCode, @whatsappJid, @items, @total, @paymentMethod, @customerName, @customerCedula, @customerPhone, @customerEmail, @status)
    ON CONFLICT(order_code) DO UPDATE SET
      whatsapp_jid=excluded.whatsapp_jid,
      items_json=excluded.items_json,
      total=excluded.total,
      payment_method=excluded.payment_method,
      customer_name=excluded.customer_name,
      customer_cedula=excluded.customer_cedula,
      customer_phone=excluded.customer_phone,
      customer_email=excluded.customer_email,
      updated_at=datetime('now')
  `);
  stmt.run({
    orderCode,
    whatsappJid,
    items: JSON.stringify(items),
    total: total ?? null,
    paymentMethod: paymentMethod ?? null,
    customerName: customerName ?? null,
    customerCedula: customerCedula ?? null,
    customerPhone: customerPhone ?? null,
    customerEmail: customerEmail ?? null,
    status: ORDER_STATUS.PENDING_PROOF,
  });
  return getOrderByCode(orderCode);
}

export function getOrderByCode(orderCode) {
  return deserializeOrder(db.prepare('SELECT * FROM orders WHERE order_code = ?').get(orderCode));
}

export function getOrderById(id) {
  return deserializeOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
}

export function getLatestOpenOrderForJid(jid) {
  return deserializeOrder(
    db
      .prepare(
        `SELECT * FROM orders WHERE whatsapp_jid = ? AND status IN ('pending_proof','pending_review')
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(jid)
  );
}

export function listOrders({ status } = {}) {
  const rows = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  return rows.map(deserializeOrder);
}

export function setOrderProof(id, proofPath) {
  db.prepare(
    `UPDATE orders SET proof_image_path = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(proofPath, ORDER_STATUS.PENDING_REVIEW, id);
  return getOrderById(id);
}

export function setOrderStatus(id, status, reviewedBy = null) {
  db.prepare(
    `UPDATE orders SET status = ?, reviewed_by = COALESCE(?, reviewed_by), updated_at = datetime('now') WHERE id = ?`
  ).run(status, reviewedBy, id);
  return getOrderById(id);
}

// Cuenta cuantas veces el cliente ha enviado un comprobante que el OCR no logro validar para
// este pedido — tras varias veces (ver MAX_INTENTOS_VERIFICACION en whatsapp.js) se escala a
// un asesor humano en vez de seguir pidiendo reintentos indefinidamente.
export function incrementOrderVerificationAttempts(id) {
  db.prepare(
    `UPDATE orders SET verification_attempts = verification_attempts + 1, updated_at = datetime('now') WHERE id = ?`
  ).run(id);
  return getOrderById(id).verification_attempts;
}

export const STEP = {
  MENU: 'MENU',
  AGENDAR_ELEGIR_AREA: 'AGENDAR_ELEGIR_AREA',
  ETHICS_ASK: 'ETHICS_ASK',
  ETHICS_NO_LAWYER_CONFIRM: 'ETHICS_NO_LAWYER_CONFIRM',
  AREA_QUESTIONS: 'AREA_QUESTIONS',
  CAPTURE_NOMBRE: 'CAPTURE_NOMBRE',
  CAPTURE_TELEFONO: 'CAPTURE_TELEFONO',
  CAPTURE_CORREO: 'CAPTURE_CORREO',
  CAPTURE_CIUDAD: 'CAPTURE_CIUDAD',
  CAPTURE_RESUMEN: 'CAPTURE_RESUMEN',
  DONE: 'DONE',
  CLOSED_ETHICS: 'CLOSED_ETHICS',
};

function deserializeConversation(row) {
  if (!row) return null;
  return { ...row, context: JSON.parse(row.context_json) };
}

export function getConversation(contactId) {
  const row = db.prepare('SELECT * FROM conversations WHERE contact_id = ?').get(contactId);
  return deserializeConversation(row);
}

export function getOrCreateConversation(contactId, channel) {
  const existing = getConversation(contactId);
  if (existing) return existing;
  db.prepare(
    `INSERT INTO conversations (contact_id, channel, step, context_json) VALUES (?, ?, 'MENU', '{}')`
  ).run(contactId, channel);
  return getConversation(contactId);
}

export function updateConversation(contactId, { step, area, context, needsHuman, escalateReason, preview }) {
  const current = getConversation(contactId);
  const nextContext = context !== undefined ? context : current.context;
  db.prepare(
    `UPDATE conversations SET
       step = COALESCE(?, step),
       area = ?,
       context_json = ?,
       needs_human = COALESCE(?, needs_human),
       escalate_reason = COALESCE(?, escalate_reason),
       last_message_at = datetime('now'),
       last_message_preview = COALESCE(?, last_message_preview)
     WHERE contact_id = ?`
  ).run(
    step ?? null,
    area !== undefined ? area : current.area,
    JSON.stringify(nextContext),
    needsHuman === undefined ? null : (needsHuman ? 1 : 0),
    escalateReason ?? null,
    preview ?? null,
    contactId
  );
  return getConversation(contactId);
}

// Reinicia el flujo (step/area/contexto) sin tocar needs_human/escalate_reason — un caso
// escalado debe seguir visible para el equipo aunque el usuario ya haya vuelto al menú.
// Para limpiar la bandera de escalado, usa resolveConversation().
export function resetConversation(contactId) {
  db.prepare(
    `UPDATE conversations SET step = 'MENU', area = NULL, context_json = '{}' WHERE contact_id = ?`
  ).run(contactId);
  return getConversation(contactId);
}

export function resolveConversation(contactId) {
  db.prepare(`UPDATE conversations SET needs_human = 0, escalate_reason = NULL WHERE contact_id = ?`).run(contactId);
  return getConversation(contactId);
}

export function listConversations({ channel } = {}) {
  const rows = channel
    ? db.prepare('SELECT * FROM conversations WHERE channel = ? ORDER BY last_message_at DESC').all(channel)
    : db.prepare('SELECT * FROM conversations ORDER BY last_message_at DESC').all();
  return rows.map(deserializeConversation);
}

export function listEscalatedConversations() {
  return db
    .prepare(`SELECT * FROM conversations WHERE needs_human = 1 ORDER BY last_message_at DESC`)
    .all()
    .map(deserializeConversation);
}

export function createLead({
  contactId,
  channel,
  area,
  ethicsPassed,
  ethicsNotes,
  areaAnswers,
  costoInformado,
  nombreCompleto,
  telefono,
  correo,
  ciudad,
  resumenCaso,
  escalated,
  escalateReason,
}) {
  const stmt = db.prepare(`
    INSERT INTO leads (
      contact_id, channel, area, ethics_passed, ethics_notes, area_answers_json,
      costo_informado, nombre_completo, telefono, correo, ciudad, resumen_caso,
      escalated, escalate_reason
    ) VALUES (
      @contactId, @channel, @area, @ethicsPassed, @ethicsNotes, @areaAnswers,
      @costoInformado, @nombreCompleto, @telefono, @correo, @ciudad, @resumenCaso,
      @escalated, @escalateReason
    )
  `);
  const info = stmt.run({
    contactId,
    channel,
    area: area ?? null,
    ethicsPassed: ethicsPassed ? 1 : 0,
    ethicsNotes: ethicsNotes ?? null,
    areaAnswers: areaAnswers ? JSON.stringify(areaAnswers) : null,
    costoInformado: costoInformado ?? null,
    nombreCompleto: nombreCompleto ?? null,
    telefono: telefono ?? null,
    correo: correo ?? null,
    ciudad: ciudad ?? null,
    resumenCaso: resumenCaso ?? null,
    escalated: escalated ? 1 : 0,
    escalateReason: escalateReason ?? null,
  });
  return getLeadById(Number(info.lastInsertRowid));
}

export function getLeadById(id) {
  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  return row ? { ...row, area_answers: row.area_answers_json ? JSON.parse(row.area_answers_json) : null } : null;
}

export function listLeads({ area, status, channel } = {}) {
  let sql = 'SELECT * FROM leads WHERE 1=1';
  const params = [];
  if (area) {
    sql += ' AND area = ?';
    params.push(area);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (channel) {
    sql += ' AND channel = ?';
    params.push(channel);
  }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params).map((row) => ({
    ...row,
    area_answers: row.area_answers_json ? JSON.parse(row.area_answers_json) : null,
  }));
}

export function setLeadStatus(id, status) {
  db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, id);
  return getLeadById(id);
}

export function logMessage(contactId, direction, kind, preview) {
  db.prepare(
    `INSERT INTO message_log (contact_id, direction, kind, preview) VALUES (?, ?, ?, ?)`
  ).run(contactId, direction, kind, preview);
}

// Trunca mensajes en logs para no dejar PII completa en disco (Ley 1581 de 2012) — aplica
// con mas razon aqui: se captura correo/telefono/resumen del caso, dato mas sensible que
// "curso comprado" en el proyecto hermano.
export function maskText(text, max = 40) {
  if (!text) return '';
  const trimmed = text.replace(/\s+/g, ' ').slice(0, max);
  return trimmed.length < text.length ? trimmed + '…' : trimmed;
}

export default db;
