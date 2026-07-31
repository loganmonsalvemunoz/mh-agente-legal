import './env.js';
import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import adminRouter from './routes/admin.js';
import widgetRouter from './routes/widget.js';
import { connectToWhatsApp } from './whatsapp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3100;

const isProd = process.env.NODE_ENV === 'production';
// Interruptor para apagar el panel admin (y la conexion de WhatsApp, que solo sirve a
// traves del panel) sin tocar nada mas. El widget web es independiente de ambos — sigue
// funcionando igual con esto en false. Vuelve a poner ADMIN_ENABLED=true (o borrar la
// variable) para reactivarlo.
const adminEnabled = process.env.ADMIN_ENABLED !== 'false';
// Independiente del panel: apaga el canal de pedidos por WhatsApp sin tocar el widget web
// ni el panel admin (que sigue sirviendo para revisar leads/conversaciones del widget).
const whatsappEnabled = process.env.WHATSAPP_ENABLED !== 'false';

// Estas credenciales solo las necesita el panel admin — si esta apagado, el widget no
// depende de ellas para nada.
if (adminEnabled && (!process.env.SESSION_SECRET || !process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD_HASH)) {
  console.error(
    '[server] Faltan variables de entorno obligatorias para el panel admin. Copia .env.example a .env y complétalo (usa "npm run hash-password -- tu-clave" para ADMIN_PASSWORD_HASH). O pon ADMIN_ENABLED=false si no lo necesitas por ahora.'
  );
  process.exit(1);
}

const app = express();
if (isProd) app.set('trust proxy', 1);

// Candado de acceso para despliegues de prueba privados: si estas dos variables estan
// definidas, TODO el sitio (widget incluido) exige usuario/clave HTTP antes de servir nada.
// Pensado para probar en un subdominio real sin exponerlo al público — no se activa en
// local a menos que las definas a propósito.
const stagingUser = process.env.STAGING_BASIC_AUTH_USER;
const stagingPass = process.env.STAGING_BASIC_AUTH_PASS;
if (stagingUser && stagingPass) {
  console.log('[server] Acceso restringido con usuario/clave (despliegue de prueba privado).');
  app.use((req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      const [user, pass] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
      if (user === stagingUser && pass === stagingPass) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Acceso restringido"');
    res.status(401).send('Acceso restringido.');
  });
}

app.use(express.json());

// CORS solo para el canal publico del widget — restringido a un origen explicito, nunca '*'.
const allowedOrigin = process.env.WIDGET_ALLOWED_ORIGIN || '';
app.use('/api/widget', (req, res, next) => {
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

if (adminEnabled) {
  app.use(
    '/api/admin',
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, maxAge: 8 * 60 * 60 * 1000, secure: isProd },
    })
  );
  app.use('/api/admin', adminRouter);
  app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
} else {
  app.use(['/admin', '/api/admin'], (req, res) => {
    res.status(503).send('Panel admin deshabilitado temporalmente.');
  });
}

app.use('/api/widget', widgetRouter);
app.use('/widget', express.static(path.join(__dirname, 'public', 'widget')));
// Logo oficial: publico y sin CORS (las etiquetas <img> no lo necesitan), asi el widget
// tambien lo puede cargar cuando esta embebido en un origen distinto (WordPress).
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
if (!isProd) {
  // Pagina de prueba local que simula el sitio de WordPress embebiendo el widget —
  // mismo origen que la API, asi no hace falta tocar CORS solo para probar en local.
  app.use('/test', express.static(path.join(__dirname, 'public', 'test')));
}

app.get('/', (req, res) => res.redirect(adminEnabled ? '/admin' : '/widget/widget.js'));

app.listen(PORT, () => {
  if (adminEnabled) {
    console.log(`[server] Panel admin en http://localhost:${PORT}/admin`);
  } else {
    console.log('[server] Panel admin DESHABILITADO (ADMIN_ENABLED=false). El widget sigue funcionando normalmente.');
  }
  console.log(`[server] Widget embebible en http://localhost:${PORT}/widget/widget.js`);
});

// El canal de WhatsApp (pedidos de cursos) es independiente del widget web — por ahora
// solo queda activo el widget (WHATSAPP_ENABLED=false). Para reactivarlo, esa variable a
// "true" (o bórrala) y reinicia.
if (whatsappEnabled && adminEnabled) {
  connectToWhatsApp().catch((err) => {
    console.error('[server] Error conectando WhatsApp:', err);
  });
} else if (!whatsappEnabled) {
  console.log('[server] Canal de WhatsApp deshabilitado (WHATSAPP_ENABLED=false). Solo el widget web está activo.');
} else {
  console.log('[server] Conexión de WhatsApp en pausa (panel admin deshabilitado).');
}
