import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Segundo bot de WhatsApp — INDEPENDIENTE del bot de cursos (whatsapp.js). Usa el mismo motor
// conversacional que el widget web (lib/conversationEngine.js): triage juridico completo,
// areas, etica, cursos, inmobiliaria, escalamiento — con el mismo formato de texto (menu
// numerado estilo WhatsApp) que ya usa el widget, no una version distinta.
//
// Necesita su PROPIO numero de WhatsApp (no puede compartir el numero del bot de cursos — un
// numero de WhatsApp solo puede estar vinculado a una sesion Baileys a la vez) y su propia
// carpeta de sesion (auth_info_baileys_general, separada de la del bot de cursos).
//
// Apagado por defecto (WHATSAPP_GENERAL_ENABLED != 'true') hasta que haya un numero disponible
// para vincular. Activacion (cuando llegue el momento): pon WHATSAPP_GENERAL_ENABLED=true y
// ADMIN_ENABLED=true, reinicia el servidor, entra a /admin y escanea el QR con el nuevo numero
// (WhatsApp Business App > Dispositivos vinculados > Vincular un dispositivo).
import { procesarMensaje } from './lib/conversationEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = pino({ level: process.env.LOG_LEVEL || 'warn' });

let sockInstance = null;
let latestQrDataUrl = null;
let connectionState = 'disconnected';

export async function connectWhatsappGeneral() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, 'auth_info_baileys_general')
  );
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
        `\n[WhatsApp General] Escanea el codigo QR desde el panel admin: http://localhost:${port}/admin\n`
      );
    }

    if (connection === 'close') {
      connectionState = 'disconnected';
      const statusCode =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode
          : undefined;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('[WhatsApp General] Conexion cerrada. Reconectar:', shouldReconnect);
      if (shouldReconnect) {
        connectWhatsappGeneral().catch(console.error);
      } else {
        console.log(
          '[WhatsApp General] Sesion cerrada (logout) desde el telefono. Generando un nuevo QR automaticamente...'
        );
        regenerarSesion();
      }
    } else if (connection === 'open') {
      connectionState = 'open';
      latestQrDataUrl = null;
      console.log('[WhatsApp General] Conexion establecida.');
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
        console.error('[WhatsApp General] Error procesando mensaje:', err);
      }
    }
  });

  return sock;
}

async function regenerarSesion() {
  connectionState = 'disconnected';
  latestQrDataUrl = null;
  sockInstance = null;
  try {
    await fs.promises.rm(path.join(__dirname, 'auth_info_baileys_general'), { recursive: true, force: true });
  } catch (err) {
    console.error('[WhatsApp General] No se pudo borrar la sesion anterior:', err);
  }
  setTimeout(() => {
    connectWhatsappGeneral().catch(console.error);
  }, 2000);
}

export function getConnectionInfoGeneral() {
  return { state: connectionState, qrDataUrl: latestQrDataUrl };
}

async function handleIncomingMessage(sock, m) {
  const jid = m.key.remoteJid;
  if (!jid || jid.endsWith('@g.us') || jid === 'status@broadcast') return;

  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
  if (!text) return;

  const replies = procesarMensaje(jid, text, 'whatsapp-general');
  for (const reply of replies) {
    await sock.sendMessage(jid, { text: reply });
  }
}
