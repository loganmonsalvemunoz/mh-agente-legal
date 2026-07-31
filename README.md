# MH Agente Legal — triage e intake jurídico (demo)

Chatbot de triage e intake jurídico para MH Grupo Empresarial, inspirado en el estilo de menú
numerado de EPS SURA: protocolo ético obligatorio (Ley 1123 de 2007), flujos guiados por área
jurídica, tarifas fijas/variables, captura de datos de contacto y escalamiento a un abogado
humano. **Es un demo** — sin pagos ni calendario real todavía.

Proyecto **separado** de [`mh-automatizacion`](../mh-automatizacion) (que solo vende el curso de
Ley 820) — no lo toca ni depende de él, aunque reutiliza sus mismas convenciones técnicas.

## Arquitectura

Un motor de conversación (`lib/conversationEngine.js`) transporte-agnóstico, alimentado por dos
canales:

- **WhatsApp** (`whatsapp.js`, Baileys) — mismo número +57 313 768 1398 que ya usa el equipo
  (decisión del negocio; asume el riesgo de bloqueo de Baileys sobre ese número).
- **Widget web** (`routes/widget.js` + `public/widget/widget.js`) — botón flotante embebible en
  WordPress con un chat completo, sin depender de que el visitante tenga WhatsApp a mano.

Ambos canales llaman a `procesarMensaje(contactId, text, channel)` — ni Baileys ni el widget
conocen la lógica de negocio, solo saben enviar/recibir por su transporte.

Ver el diagrama y las decisiones completas en el plan original:
`C:\Users\MH Grupo Empresarial\.claude\plans\d-descargas-guamaestraintegraldeentrena-dapper-bumblebee.md`

## Instalación y arranque en localhost

Requiere Node.js 22.5+ (usa el módulo nativo `node:sqlite`).

```bash
cd mh-agente-legal
npm install

cp .env.example .env          # PowerShell: Copy-Item .env.example .env
npm run hash-password -- "tu-clave-segura"   # copia el ADMIN_PASSWORD_HASH resultante en .env
```

Completa en `.env`: `SESSION_SECRET` (aleatorio largo), `ADMIN_USER`, `ADMIN_PASSWORD_HASH`.

```bash
npm start
```

- Panel admin: `http://localhost:3100/admin` — ahí aparece el QR de WhatsApp la primera vez.
- Widget embebible: `http://localhost:3100/widget/widget.js`
- Página de prueba del widget (solo en `NODE_ENV` distinto de producción):
  `http://localhost:3100/test/`

## Embeber el widget en WordPress (Hostinger)

1. Despliega este proyecto en un VPS (mismo patrón que
   [`mh-automatizacion/DEPLOY_HOSTINGER_VPS.md`](../mh-automatizacion/DEPLOY_HOSTINGER_VPS.md):
   Node + PM2 + Nginx + Certbot), en un subdominio propio, ej. `agente.mhgrupoempresarial.com`.
2. En `.env` de producción, define `WIDGET_ALLOWED_ORIGIN=https://mhgrupoempresarial.com` (y
   `www.` si aplica) — el endpoint público del widget solo acepta peticiones desde ese origen.
3. En WordPress (Elementor → widget "HTML", o un plugin de inserción de código en el
   header/footer), agrega:
   ```html
   <script src="https://agente.mhgrupoempresarial.com/widget/widget.js" defer></script>
   ```
   Eso es todo — el botón flotante aparece solo, sin backend nuevo en el hosting compartido de
   WordPress.

## Catálogos pendientes de completar

- `config/formatos.js`: los `downloadUrl` son placeholders — reemplázalos cuando existan los
  formatos reales.
- Decide si conservar el mismo número de WhatsApp o migrar a uno dedicado si el volumen crece.

## Panel admin

Tres vistas: **casos escalados** (prioritaria), **leads capturados** (filtrable por área,
estado, canal), y **conversaciones** (incluye las abandonadas a medio flujo, visibles por su
`step` actual para que el equipo haga seguimiento manual).

## Seguridad y datos personales

Se captura nombre, teléfono, correo, ciudad y resumen del caso — mismo criterio de Ley 1581 de
2012 que `mh-automatizacion`: el panel exige login, y `message_log` trunca los mensajes (no guarda
el texto completo con PII). El endpoint público del widget tiene rate limiting básico (20
mensajes/minuto por IP) porque, a diferencia de WhatsApp, cualquiera en internet puede llamarlo.
