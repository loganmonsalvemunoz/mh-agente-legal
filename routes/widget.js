import express from 'express';
import crypto from 'node:crypto';

import { procesarMensaje } from '../lib/conversationEngine.js';
import { textoBienvenida } from '../lib/menu.js';

const router = express.Router();

// Rate limit basico por IP: a diferencia del canal de WhatsApp (protegido implicitamente
// por requerir conocer un numero), este endpoint queda expuesto a cualquiera en internet.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const hits = new Map(); // ip -> { count, resetAt }

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Demasiados mensajes, espera un momento.' });
  }
  entry.count += 1;
  next();
}

router.post('/start', rateLimit, (req, res) => {
  const contactId = `web:${crypto.randomUUID()}`;
  res.json({ contactId, replies: [textoBienvenida()] });
});

router.post('/message', rateLimit, (req, res) => {
  const { contactId, text } = req.body || {};
  // El contactId debe venir del propio /start de este canal — nunca aceptar un jid de
  // WhatsApp real desde un endpoint publico sin autenticacion.
  if (typeof contactId !== 'string' || !contactId.startsWith('web:')) {
    return res.status(400).json({ error: 'contactId inválido' });
  }
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text inválido' });
  }
  const replies = procesarMensaje(contactId, text.trim(), 'web');
  res.json({ replies });
});

export default router;
