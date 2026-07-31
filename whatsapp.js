import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// IMPORTANTE — alcance de este canal (decisión del negocio, demo):
// El bot de WhatsApp de este proyecto SOLO gestiona pedidos de cursos (recibir el mensaje de
// pedido de pagina_cursos.html/pasarela_pago.html, recibir el comprobante, y tras aprobacion
// manual del equipo, enviar el enlace del modulo comprado). NO usa lib/conversationEngine.js —
// ese motor de triage juridico completo vive unicamente en el widget web (routes/widget.js).
// Cualquier mensaje que no sea sobre un pedido se redirige al chat de la pagina, nunca se
// intenta responder aqui.
import { pareceMensajeDePedido, parsearPedido } from './lib/parser.js';
import { esSaludo } from './lib/faq.js';
import * as db from './db.js';
import {
  mensajeAckPedido,
  mensajeComprobanteRecibido,
  mensajeImagenSinPedido,
  mensajeRedirigirAWeb,
  mensajeBienvenidaCursos,
} from './lib/messages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const logger = pino({ level: process.env.LOG_LEVEL || 'warn' });

let sockInstance = null;
let latestQrDataUrl = null;
// disconnected | qr | open | disabled — "disabled" es el estado cuando WHATSAPP_ENABLED=false:
// el canal de pedidos por WhatsApp esta apagado a proposito (solo queda el widget web activo).
let connectionState = process.env.WHATSAPP_ENABLED === 'false' ? 'disabled' : 'disconnected';

export async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, 'auth_info_baileys')
  );
  // Fija la version mas reciente del protocolo WhatsApp Web: sin esto, Baileys usa una
  // version desactualizada que WhatsApp rechaza de inmediato (loop de conexion cerrada).
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({ auth: state, logger, version });
  sockInstance = sock;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      connectionState = 'qr';
      latestQrDataUrl = await qrcode.toDataURL(qr);
      const port = process.env.PORT || 3100;
      console.log(
        `\n[WhatsApp] Escanea el codigo QR desde el panel admin: http://localhost:${port}/admin\n`
      );
    }

    if (connection === 'close') {
      connectionState = 'disconnected';
      const statusCode =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode
          : undefined;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('[WhatsApp] Conexion cerrada. Reconectar:', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp().catch(console.error);
      } else {
        console.log(
          '[WhatsApp] Sesion cerrada (logout) desde el telefono. Generando un nuevo QR automaticamente...'
        );
        regenerarSesion();
      }
    } else if (connection === 'open') {
      connectionState = 'open';
      latestQrDataUrl = null;
      console.log('[WhatsApp] Conexion establecida.');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      if (m.key.fromMe) continue;
      try {
        await handleIncomingMessage(sock, m);
      } catch (err) {
        console.error('[WhatsApp] Error procesando mensaje:', err);
      }
    }
  });

  return sock;
}

// Cuando el usuario cierra la sesion desde el telefono (Dispositivos vinculados > Cerrar
// sesion), Baileys ya no puede reconectar con las credenciales viejas. Borramos la sesion
// guardada y arrancamos una conexion nueva para que el panel admin muestre un QR fresco sin
// necesidad de reiniciar el proceso a mano.
async function regenerarSesion() {
  connectionState = 'disconnected';
  latestQrDataUrl = null;
  sockInstance = null;
  try {
    await fs.promises.rm(path.join(__dirname, 'auth_info_baileys'), { recursive: true, force: true });
  } catch (err) {
    console.error('[WhatsApp] No se pudo borrar la sesion anterior:', err);
  }
  setTimeout(() => {
    connectToWhatsApp().catch(console.error);
  }, 2000);
}

export function getSock() {
  if (!sockInstance) throw new Error('WhatsApp no esta conectado todavia');
  return sockInstance;
}

export function getConnectionInfo() {
  return { state: connectionState, qrDataUrl: latestQrDataUrl };
}

export async function enviarTexto(jid, texto) {
  await getSock().sendMessage(jid, { text: texto });
  db.logMessage(jid, 'out', 'text', db.maskText(texto));
}

async function handleIncomingMessage(sock, m) {
  const jid = m.key.remoteJid;
  if (!jid || jid.endsWith('@g.us') || jid === 'status@broadcast') return;

  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
  const hasImage = !!m.message?.imageMessage;

  if (hasImage) {
    await handleImageMessage(sock, m, jid);
    return;
  }

  if (!text) return;

  db.logMessage(jid, 'in', 'text', db.maskText(text));

  if (pareceMensajeDePedido(text)) {
    const parsed = parsearPedido(text);
    if (!parsed) {
      await enviarTexto(jid, mensajeRedirigirAWeb());
      return;
    }
    const order = db.createOrder({
      orderCode: parsed.orderCode,
      whatsappJid: jid,
      items: parsed.items,
      total: parsed.total,
      paymentMethod: parsed.paymentMethod,
      customerName: parsed.customerName,
      customerCedula: parsed.customerCedula,
      customerPhone: parsed.customerPhone,
      customerEmail: parsed.customerEmail,
    });
    await enviarTexto(jid, mensajeAckPedido(order));
    return;
  }

  if (esSaludo(text)) {
    await enviarTexto(jid, mensajeBienvenidaCursos());
    return;
  }

  // Cualquier otro mensaje: este canal solo gestiona cursos — se redirige al chat de la
  // pagina web (widget), que sí tiene el flujo completo de asesoría/inmobiliaria/FAQ.
  await enviarTexto(jid, mensajeRedirigirAWeb());
}

async function handleImageMessage(sock, m, jid) {
  const order = db.getLatestOpenOrderForJid(jid);
  db.logMessage(
    jid,
    'in',
    'image',
    order ? `comprobante pedido ${order.order_code}` : 'imagen sin pedido asociado'
  );

  if (!order) {
    await enviarTexto(jid, mensajeImagenSinPedido());
    return;
  }

  const buffer = await downloadMediaMessage(
    m,
    'buffer',
    {},
    { logger, reuploadRequest: sock.updateMediaMessage }
  );
  const filename = `${order.order_code}_${Date.now()}.jpg`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);

  db.setOrderProof(order.id, filename);
  await enviarTexto(jid, mensajeComprobanteRecibido(order));
}
