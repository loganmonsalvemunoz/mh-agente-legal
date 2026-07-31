import express from 'express';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as db from '../db.js';
import { getConnectionInfo, enviarTexto } from '../whatsapp.js';
import { mensajeAprobado, mensajeRechazado } from '../lib/messages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

const router = express.Router();

function requireAuth(req, res, next) {
  if (req.session?.authenticated) return next();
  return res.status(401).json({ error: 'No autenticado' });
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const validUser = username === process.env.ADMIN_USER;
  const validPass =
    validUser &&
    process.env.ADMIN_PASSWORD_HASH &&
    bcrypt.compareSync(password || '', process.env.ADMIN_PASSWORD_HASH);

  if (!validUser || !validPass) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  req.session.authenticated = true;
  req.session.username = username;
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/session', (req, res) => {
  res.json({ authenticated: !!req.session?.authenticated, username: req.session?.username || null });
});

router.get('/whatsapp/status', requireAuth, (req, res) => {
  res.json(getConnectionInfo());
});

router.get('/leads', requireAuth, (req, res) => {
  const { area, status, channel } = req.query;
  res.json(db.listLeads({ area, status, channel }));
});

router.post('/leads/:id/status', requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!['nuevo', 'contactado', 'cerrado'].includes(status)) {
    return res.status(400).json({ error: 'status inválido' });
  }
  res.json(db.setLeadStatus(Number(req.params.id), status));
});

router.get('/conversations', requireAuth, (req, res) => {
  const { channel } = req.query;
  res.json(db.listConversations({ channel }));
});

router.get('/conversations/escalated', requireAuth, (req, res) => {
  res.json(db.listEscalatedConversations());
});

router.post('/conversations/:contactId/resolve', requireAuth, (req, res) => {
  res.json(db.resolveConversation(req.params.contactId));
});

// Pedidos de cursos (canal WhatsApp — ver whatsapp.js, único flujo que ese canal maneja).
router.get('/orders', requireAuth, (req, res) => {
  const { status } = req.query;
  res.json(db.listOrders(status ? { status } : {}));
});

router.get('/uploads/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename); // evita path traversal
  const filepath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filepath)) return res.status(404).end();
  res.sendFile(filepath);
});

router.post('/orders/:id/approve', requireAuth, async (req, res) => {
  const order = db.getOrderById(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  try {
    await enviarTexto(order.whatsapp_jid, mensajeAprobado(order));
    const updated = db.setOrderStatus(order.id, db.ORDER_STATUS.DELIVERED, req.session.username);
    res.json(updated);
  } catch (err) {
    console.error('[admin] Error aprobando pedido:', err);
    res.status(500).json({ error: 'No se pudo enviar el mensaje de WhatsApp. Verifica la conexión.' });
  }
});

router.post('/orders/:id/reject', requireAuth, async (req, res) => {
  const order = db.getOrderById(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
  const { motivo } = req.body || {};

  try {
    await enviarTexto(order.whatsapp_jid, mensajeRechazado(order, motivo));
    const updated = db.setOrderStatus(order.id, db.ORDER_STATUS.REJECTED, req.session.username);
    res.json(updated);
  } catch (err) {
    console.error('[admin] Error rechazando pedido:', err);
    res.status(500).json({ error: 'No se pudo enviar el mensaje de WhatsApp. Verifica la conexión.' });
  }
});

export default router;
