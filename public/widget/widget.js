(function () {
  if (window.__mhLegalWidgetLoaded) return;
  window.__mhLegalWidgetLoaded = true;

  // Detecta la URL base del propio script (mismo host que sirve /api/widget/*), asi el
  // <script> se puede embeber en WordPress con una sola linea, sin configurar nada mas.
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var API_BASE = new URL('.', currentScript.src).origin;
  var STORAGE_KEY = 'mh_legal_widget_contact_id';

  var COLORS = { naranja: '#E8812D', gris: '#626361', grisClaro: '#E6E3E1', negro: '#222222', blanco: '#FFFFFF' };

  // Carga la tipografia de marca (Poppins) — no asume que el sitio host (WordPress) ya la
  // tenga cargada, el widget debe verse igual en cualquier pagina donde se embeba.
  if (!document.querySelector('link[data-mh-lw-font]')) {
    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.dataset.mhLwFont = '1';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(fontLink);
  }

  var style = document.createElement('style');
  style.textContent = [
    // Botón flotante: entra con un pequeño "pop" al cargar la página, y late suavemente
    // (anillo de pulso) hasta que el visitante lo abre por primera vez — invita al clic sin
    // ser invasivo. Al abrir/cerrar, el icono gira de burbuja de chat a "cerrar".
    '@keyframes mh-lw-pop-in{0%{transform:scale(0) rotate(-8deg);opacity:0;}',
    '60%{transform:scale(1.08) rotate(4deg);opacity:1;}100%{transform:scale(1) rotate(0);}}',
    '@keyframes mh-lw-pulse-ring{0%{box-shadow:0 6px 20px rgba(0,0,0,.25),0 0 0 0 rgba(232,129,45,.55);}',
    '70%{box-shadow:0 6px 20px rgba(0,0,0,.25),0 0 0 14px rgba(232,129,45,0);}',
    '100%{box-shadow:0 6px 20px rgba(0,0,0,.25),0 0 0 0 rgba(232,129,45,0);}}',
    '.mh-lw-btn{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;',
    'background:' + COLORS.naranja + ';box-shadow:0 6px 20px rgba(0,0,0,.25);border:none;cursor:pointer;',
    'z-index:999999;display:flex;align-items:center;justify-content:center;',
    'transition:transform .2s cubic-bezier(.34,1.56,.64,1);',
    'animation:mh-lw-pop-in .5s cubic-bezier(.34,1.56,.64,1) .2s both;}',
    '.mh-lw-btn.pulse{animation:mh-lw-pop-in .5s cubic-bezier(.34,1.56,.64,1) .2s both,',
    'mh-lw-pulse-ring 2.4s ease-out 1s infinite;}',
    '.mh-lw-btn:hover{transform:scale(1.08);}',
    '.mh-lw-btn:active{transform:scale(.94);}',
    '.mh-lw-btn svg{width:26px;height:26px;fill:#fff;transition:transform .25s cubic-bezier(.34,1.56,.64,1);}',
    '.mh-lw-btn.open svg{transform:rotate(90deg);}',

    // Panel: se abre con una pequeña expansión desde la esquina, no un aparecer instantáneo.
    '.mh-lw-panel{position:fixed;bottom:96px;right:24px;width:340px;max-width:92vw;height:460px;',
    'max-height:75vh;background:' + COLORS.blanco + ';border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.3);',
    'display:flex;flex-direction:column;overflow:hidden;z-index:999999;font-family:Poppins,Arial,sans-serif;',
    'transform-origin:bottom right;opacity:0;transform:scale(.85) translateY(12px);',
    'pointer-events:none;transition:opacity .2s ease,transform .2s cubic-bezier(.34,1.56,.64,1);}',
    '.mh-lw-panel.open{opacity:1;transform:scale(1) translateY(0);pointer-events:auto;}',
    '.mh-lw-header{background:' + COLORS.negro + ';color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px;}',
    '.mh-lw-header img{height:26px;width:auto;display:block;background:#fff;border-radius:4px;padding:2px 4px;}',
    '.mh-lw-header .sub{display:block;font-size:.7rem;font-weight:400;color:' + COLORS.grisClaro + ';margin-top:1px;}',
    '.mh-lw-messages{flex:1;overflow-y:auto;padding:12px;background:' + COLORS.grisClaro + ';display:flex;flex-direction:column;gap:8px;}',

    // Mensajes: entran con un fundido + deslizamiento sutil hacia arriba, como una app de
    // chat real — no aparecen de golpe.
    '@keyframes mh-lw-msg-in{from{opacity:0;transform:translateY(8px) scale(.97);}',
    'to{opacity:1;transform:translateY(0) scale(1);}}',
    '.mh-lw-msg{max-width:80%;padding:8px 12px;border-radius:12px;font-size:.85rem;line-height:1.4;',
    'white-space:pre-wrap;word-break:break-word;animation:mh-lw-msg-in .28s cubic-bezier(.2,.7,.3,1) both;}',
    '.mh-lw-msg.bot{background:#fff;color:' + COLORS.negro + ';align-self:flex-start;border-bottom-left-radius:2px;}',
    '.mh-lw-msg.user{background:' + COLORS.naranja + ';color:#fff;align-self:flex-end;border-bottom-right-radius:2px;}',
    '.mh-lw-msg a{color:' + COLORS.naranja + ';font-weight:600;}',
    '.mh-lw-msg.user a{color:#fff;text-decoration:underline;}',

    // Indicador de "escribiendo...": tres puntos que rebotan, como cualquier chat real —
    // da la sensación de que alguien está de verdad respondiendo, no que es instantáneo.
    '.mh-lw-typing{display:flex;gap:4px;padding:12px 14px;}',
    '.mh-lw-typing span{width:6px;height:6px;border-radius:50%;background:' + COLORS.gris + ';',
    'opacity:.5;animation:mh-lw-typing-bounce 1.1s infinite ease-in-out;}',
    '.mh-lw-typing span:nth-child(2){animation-delay:.15s;}',
    '.mh-lw-typing span:nth-child(3){animation-delay:.3s;}',
    '@keyframes mh-lw-typing-bounce{0%,60%,100%{transform:translateY(0);opacity:.5;}',
    '30%{transform:translateY(-4px);opacity:1;}}',

    '.mh-lw-inputbar{display:flex;border-top:1px solid ' + COLORS.grisClaro + ';padding:8px;gap:8px;}',
    '.mh-lw-inputbar input{flex:1;border:1.5px solid ' + COLORS.grisClaro + ';border-radius:20px;padding:8px 14px;',
    'font-size:.85rem;font-family:inherit;outline:none;transition:border-color .15s ease;}',
    '.mh-lw-inputbar input:focus{border-color:' + COLORS.naranja + ';}',
    '.mh-lw-inputbar button{background:' + COLORS.naranja + ';color:#fff;border:none;border-radius:50%;',
    'width:36px;height:36px;cursor:pointer;flex-shrink:0;transition:transform .15s cubic-bezier(.34,1.56,.64,1);}',
    '.mh-lw-inputbar button:hover{transform:scale(1.1);}',
    '.mh-lw-inputbar button:active{transform:scale(.9);}',
  ].join('');
  document.head.appendChild(style);

  var ICON_CHAT = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24"><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6z"/></svg>';

  var btn = document.createElement('button');
  btn.className = 'mh-lw-btn pulse';
  btn.setAttribute('aria-label', 'Abrir chat de MH Grupo Empresarial');
  btn.innerHTML = ICON_CHAT;

  var panel = document.createElement('div');
  panel.className = 'mh-lw-panel';
  panel.innerHTML =
    '<div class="mh-lw-header">' +
    '<img src="' + API_BASE + '/assets/logo.png" alt="MH Grupo Empresarial" />' +
    '<span><span class="sub">Eme · tu asesor virtual</span></span>' +
    '</div>' +
    '<div class="mh-lw-messages"></div>' +
    '<div class="mh-lw-inputbar">' +
    '<input type="text" placeholder="Escribe tu mensaje..." />' +
    '<button aria-label="Enviar">&#10148;</button>' +
    '</div>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var messagesEl = panel.querySelector('.mh-lw-messages');
  var inputEl = panel.querySelector('input');
  var sendBtn = panel.querySelector('.mh-lw-inputbar button');

  var contactId = localStorage.getItem(STORAGE_KEY) || null;
  var started = false;

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Los mensajes del bot pueden traer enlaces (curso, WhatsApp) que deben quedar
  // clicables — WhatsApp los detecta solo, aqui hay que hacerlo a mano de forma segura
  // (escapa el texto primero, recien despues convierte URLs en <a>).
  function linkify(escapedText) {
    return escapedText.replace(/(https?:\/\/[^\s]+)/g, function (url) {
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
    });
  }

  function addMessage(text, from) {
    var el = document.createElement('div');
    el.className = 'mh-lw-msg ' + from;
    el.innerHTML = linkify(escapeHtml(text));
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addBotReplies(replies) {
    replies.forEach(function (r) { addMessage(r, 'bot'); });
  }

  var typingEl = null;
  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'mh-lw-msg bot';
    typingEl.innerHTML = '<div class="mh-lw-typing"><span></span><span></span><span></span></div>';
    typingEl.style.padding = '0';
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    if (typingEl) { typingEl.remove(); typingEl = null; }
  }

  // Espera minima antes de mostrar la respuesta: aunque el servidor responda al instante,
  // una respuesta 100% inmediata se siente robotica — este pequeño respiro con el indicador
  // de "escribiendo..." hace que el asistente se sienta mas natural y amable.
  function conRespiro(promesa) {
    var espera = new Promise(function (resolve) { setTimeout(resolve, 500); });
    return Promise.all([promesa, espera]).then(function (r) { return r[0]; });
  }

  function apiPost(path, body) {
    return fetch(API_BASE + '/api/widget' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    }).then(function (res) {
      if (!res.ok) throw new Error('Error de red');
      return res.json();
    });
  }

  function ensureStarted() {
    if (started) return Promise.resolve();
    started = true;
    if (contactId) {
      addMessage('¡Hola de nuevo! 😊 Soy Eme otra vez. Escribe "menú" si quieres ver las opciones.', 'bot');
      return Promise.resolve();
    }
    showTyping();
    return conRespiro(apiPost('/start')).then(function (data) {
      hideTyping();
      contactId = data.contactId;
      localStorage.setItem(STORAGE_KEY, contactId);
      addBotReplies(data.replies);
    }).catch(function () {
      hideTyping();
      addMessage('Uy, no pudimos conectarnos. ¿Puedes intentarlo de nuevo en un momento? 🙏', 'bot');
    });
  }

  function sendMessage() {
    var text = inputEl.value.trim();
    if (!text || !contactId) return;
    addMessage(text, 'user');
    inputEl.value = '';
    showTyping();
    conRespiro(apiPost('/message', { contactId: contactId, text: text }))
      .then(function (data) { hideTyping(); addBotReplies(data.replies); })
      .catch(function () {
        hideTyping();
        addMessage('No pudimos enviar tu mensaje. ¿Lo intentamos de nuevo? 🙏', 'bot');
      });
  }

  btn.addEventListener('click', function () {
    var isOpen = panel.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.innerHTML = isOpen ? ICON_CLOSE : ICON_CHAT;
    btn.setAttribute('aria-label', isOpen ? 'Cerrar chat' : 'Abrir chat de MH Grupo Empresarial');
    if (isOpen) {
      btn.classList.remove('pulse'); // ya nos vio y le dio clic — dejamos de llamar la atención
      ensureStarted();
      inputEl.focus();
    }
  });
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
  });
})();
