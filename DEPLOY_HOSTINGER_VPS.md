# Despliegue en un VPS de Hostinger + embeber el botón flotante en WordPress

Guía completa para llevar `mh-agente-legal` de localhost a internet, y de ahí embeberlo en
mhgrupoempresarial.com como el botón de chat flotante. Sigue el mismo patrón que
`mh-automatizacion/DEPLOY_HOSTINGER_VPS.md` — si ya tienes ese VPS funcionando, **no necesitas
contratar otro**, este proyecto puede vivir en el mismo servidor (pasos 3 en adelante).

## 0. Si todavía no tienes ningún VPS

Sigue primero `mh-automatizacion/DEPLOY_HOSTINGER_VPS.md` pasos 0-2 (contratar el VPS KVM 1 en
hPanel, hardening básico, instalar Node.js 22+). No lo repito aquí para no duplicar — una vez
tengas SSH funcionando y Node instalado, sigue desde el paso 1 de abajo.

## 1. Subir el proyecto al VPS

Desde tu máquina Windows, con el proyecto local (borra `node_modules`, `data/` y
`auth_info_baileys/` antes de subir, igual que con el otro bot):

```powershell
Remove-Item -Recurse -Force "D:\Escritorio\AGENCIA\mh-agente-legal\node_modules"
Remove-Item -Recurse -Force "D:\Escritorio\AGENCIA\mh-agente-legal\data" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "D:\Escritorio\AGENCIA\mh-agente-legal\auth_info_baileys" -ErrorAction SilentlyContinue

scp -r "D:\Escritorio\AGENCIA\mh-agente-legal" mh@TU_IP_DEL_VPS:/home/mh/
```

## 2. Configurar el entorno de producción

En el VPS:

```bash
cd /home/mh/mh-agente-legal
npm install --omit=dev

cp .env.example .env
nano .env
```

Completa con valores **nuevos** (no reutilices los de tu `.env` local):

```
PORT=3100
NODE_ENV=production
ADMIN_ENABLED=true
SESSION_SECRET=<nuevo, genera con el comando de abajo>
ADMIN_USER=admin
ADMIN_PASSWORD_HASH=<nuevo, genera con el comando de abajo>
WIDGET_ALLOWED_ORIGIN=https://mhgrupoempresarial.com
LOG_LEVEL=warn
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # para SESSION_SECRET
npm run hash-password -- "una-clave-nueva-y-fuerte"                         # para ADMIN_PASSWORD_HASH
```

`WIDGET_ALLOWED_ORIGIN` es el que de verdad importa aquí: el widget solo va a aceptar peticiones
desde ese dominio exacto (y no desde cualquier otro sitio) una vez esté embebido.

## 3. Mantener el proceso vivo con PM2

Si ya tienes PM2 instalado (por `mh-automatizacion`), sáltate la instalación:

```bash
sudo npm install -g pm2   # solo si no lo tienes ya

pm2 start server.js --name mh-legal --time
pm2 save   # si ya habías corrido "pm2 startup systemd" antes, no hace falta repetirlo
```

```bash
pm2 status              # deberías ver mh-bot (si existe) y mh-legal corriendo aparte
pm2 logs mh-legal        # logs en vivo de este proyecto en particular
```

## 4. Nginx: subdominio propio + HTTPS

```bash
sudo nano /etc/nginx/sites-available/mh-legal
```

```nginx
server {
    listen 80;
    server_name agente.mhgrupoempresarial.com;

    location / {
        proxy_pass http://localhost:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mh-legal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**DNS**: en hPanel → tu dominio → DNS/Zona DNS → agrega un registro **A** con nombre `agente`
apuntando a la misma IP del VPS (puedes tener varios subdominios apuntando a la misma IP sin
problema — Nginx los distingue por `server_name`).

**SSL gratis**:

```bash
sudo certbot --nginx -d agente.mhgrupoempresarial.com
```

## 5. Primer arranque real

1. Abre `https://agente.mhgrupoempresarial.com/admin` — inicia sesión y confirma que todo
   carga bien (si lo dejaste con `ADMIN_ENABLED=false` en local, aquí en producción ya lo
   pusimos en `true` en el paso 2).
2. Si vas a usar WhatsApp además del widget, escanea el QR desde el número dedicado.
3. Prueba el widget directo en `https://agente.mhgrupoempresarial.com/widget/widget.js` (debe
   descargar el archivo, no dar error).

## 6. Embeber el botón flotante en WordPress

Esta es la parte que responde tu pregunta — una vez el paso 5 funciona, en WordPress:

**Opción A — bloque HTML de Elementor** (si editas la página con Elementor):
1. Edita la página donde quieres que aparezca el botón (puede ser cualquier página, el botón es
   flotante y queda visible en toda la página donde lo pongas — normalmente se pone en el footer
   o en una plantilla que se repita en todo el sitio).
2. Arrastra el widget **"HTML"** de Elementor a cualquier parte de la página.
3. Pega:
   ```html
   <script src="https://agente.mhgrupoempresarial.com/widget/widget.js" defer></script>
   ```
4. Publica.

**Opción B — snippet global (recomendado, aparece en TODO el sitio, no solo una página)**:
1. Instala el plugin gratuito **"Insert Headers and Footers"** (o "WPCode") desde
   Plugins → Añadir nuevo.
2. Ve a su configuración → pega el mismo `<script>` de arriba en la sección **Footer**.
3. Guarda. El botón flotante ahora aparece en todas las páginas del sitio, no solo donde lo
   pegaste con Elementor.

**Opción C — directamente en el tema** (si tienes acceso al editor de temas / `functions.php`):
```php
add_action('wp_footer', function () {
    echo '<script src="https://agente.mhgrupoempresarial.com/widget/widget.js" defer></script>';
});
```

Con cualquiera de las tres, no hace falta backend nuevo en el hosting compartido de WordPress —
el `<script>` es liviano y todo el trabajo real lo hace el VPS.

## 7. Verificación final

- Abre mhgrupoempresarial.com en una pestaña de incógnito (sin caché) y confirma que el botón
  naranja aparece abajo a la derecha.
- Haz clic, escribe un mensaje de prueba, confirma que responde.
- Revisa `https://agente.mhgrupoempresarial.com/admin` → pestaña "Conversaciones" → debe
  aparecer tu conversación de prueba con canal `web`.
- Borra esa conversación/lead de prueba desde la base de datos si no quieres que quede mezclada
  con leads reales (o simplemente ignórala, no afecta nada).

## Actualizar el widget más adelante

```bash
# repite el scp del paso 1 (borra antes node_modules/data/auth_info_baileys local)
cd /home/mh/mh-agente-legal
npm install --omit=dev
pm2 restart mh-legal
```

El `<script>` en WordPress **no cambia nunca** — apunta siempre a la misma URL, así que cualquier
actualización del bot se refleja sola en la web sin tocar WordPress de nuevo.
