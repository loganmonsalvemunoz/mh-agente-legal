const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const loginView = $('#login-view');
const dashboardView = $('#dashboard-view');
let pollTimer = null;

const AREAS_LABEL = {
  laboral: 'Derecho laboral', familia: 'Derecho de familia', civil: 'Derecho civil',
  penal: 'Derecho penal', transito: 'Tránsito', pensiones: 'Pensiones y seguridad social',
  administrativo: 'Derecho administrativo', disciplinario: 'Derecho disciplinario',
  tutela: 'Acción de tutela', general: 'General',
};

async function api(path, options = {}) {
  const res = await fetch('/api/admin' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) {
    showLogin();
    throw new Error('No autenticado');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error de servidor');
  return data;
}

function showToast(msg, isError = false) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.style.background = isError ? '#c0392b' : '#222222';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

function showLogin() {
  loginView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
  if (pollTimer) clearInterval(pollTimer);
}

function showDashboard() {
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  populateFiltroArea();
  refreshAll();
  pollTimer = setInterval(refreshAll, 8000);
}

function populateFiltroArea() {
  const select = $('#filtro-area');
  if (select.dataset.filled) return;
  Object.entries(AREAS_LABEL).forEach(([key, label]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = label;
    select.appendChild(opt);
  });
  select.dataset.filled = '1';
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const errorEl = $('#login-error');
  errorEl.classList.add('hidden');
  try {
    await api('/login', {
      method: 'POST',
      body: JSON.stringify({ username: form.get('username'), password: form.get('password') }),
    });
    showDashboard();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

$('#logout-btn').addEventListener('click', async () => {
  await api('/logout', { method: 'POST' });
  showLogin();
});

$$('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach((b) => b.classList.remove('active'));
    $$('.tab-panel').forEach((p) => p.classList.add('hidden'));
    btn.classList.add('active');
    $('#tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

['filtro-area', 'filtro-status', 'filtro-canal'].forEach((id) => {
  $('#' + id).addEventListener('change', refreshLeads);
});

async function refreshAll() {
  await Promise.all([
    refreshWhatsappStatus(),
    refreshWhatsappStatusGeneral(),
    refreshOrders(),
    refreshEscalados(),
    refreshLeads(),
    refreshConversaciones(),
  ]);
}

function formatCOP(v) {
  if (v === null || v === undefined) return 'N/D';
  return '$' + Number(v).toLocaleString('es-CO');
}

function orderStatusLabel(status) {
  return {
    pending_proof: 'Esperando comprobante',
    pending_review: 'Pendiente de revisión',
    delivered: 'Entregado',
    rejected: 'Rechazado',
  }[status] || status;
}

async function refreshOrders() {
  try {
    const pendientes = await api('/orders?status=pending_review');
    renderOrdersRevision(pendientes);

    const todos = await api('/orders');
    renderOrdersHistorial(todos);
  } catch (err) { /* manejado */ }
}

function renderOrdersRevision(orders) {
  $('#count-pedidos').textContent = orders.length || '';
  $('#empty-revision').classList.toggle('hidden', orders.length > 0);
  $('#orders-revision').innerHTML = orders
    .map((o) => `
    <div class="order-card">
      <h3>${o.order_code}</h3>
      <p class="meta">${o.customer_name || 'Sin nombre'} · ${o.customer_phone || ''}</p>
      <p class="meta">${o.items.join(', ')}</p>
      <p class="meta"><strong>${formatCOP(o.total)}</strong> · ${o.payment_method || ''}</p>
      ${o.proof_image_path ? `<img class="proof-img" src="/api/admin/uploads/${o.proof_image_path}" alt="Comprobante" onclick="window.open(this.src)" />` : '<p class="meta">Sin comprobante adjunto</p>'}
      <div class="order-actions">
        <button class="btn-approve" onclick="aprobarPedido(${o.id})">Aprobar y entregar</button>
        <button class="btn-reject" onclick="rechazarPedido(${o.id})">Rechazar</button>
      </div>
    </div>`)
    .join('');
}

function renderOrdersHistorial(orders) {
  $('#orders-historial').innerHTML = orders
    .map((o) => `
    <tr>
      <td>${o.order_code}</td>
      <td>${o.customer_name || '—'}</td>
      <td>${o.items.join(', ')}</td>
      <td>${formatCOP(o.total)}</td>
      <td><span class="status-tag status-${o.status}">${orderStatusLabel(o.status)}</span></td>
      <td>${new Date(o.created_at + 'Z').toLocaleString('es-CO')}</td>
    </tr>`)
    .join('');
}

window.aprobarPedido = async (id) => {
  if (!confirm('¿Confirmas que el comprobante es válido y quieres entregar el material?')) return;
  try {
    await api(`/orders/${id}/approve`, { method: 'POST' });
    showToast('Pedido aprobado y material enviado.');
    refreshOrders();
  } catch (err) {
    showToast(err.message, true);
  }
};

window.rechazarPedido = async (id) => {
  const motivo = prompt('Motivo del rechazo (opcional):') || '';
  try {
    await api(`/orders/${id}/reject`, { method: 'POST', body: JSON.stringify({ motivo }) });
    showToast('Pedido rechazado, se notificó al cliente.');
    refreshOrders();
  } catch (err) {
    showToast(err.message, true);
  }
};

async function refreshWhatsappStatus() {
  try {
    const status = await api('/whatsapp/status');
    const pill = $('#wa-status-pill');
    const qrCard = $('#qr-card');
    if (status.state === 'open') {
      pill.textContent = 'Bot de pedidos: conectado';
      pill.className = 'pill pill-ok';
      qrCard.classList.add('hidden');
    } else if (status.state === 'qr') {
      pill.textContent = 'Bot de pedidos: escanea el QR';
      pill.className = 'pill pill-warn';
      qrCard.classList.remove('hidden');
      $('#qr-image').src = status.qrDataUrl;
    } else if (status.state === 'disabled') {
      pill.textContent = 'Bot de pedidos: deshabilitado';
      pill.className = 'pill pill-neutral';
      qrCard.classList.add('hidden');
    } else {
      pill.textContent = 'Bot de pedidos: desconectado';
      pill.className = 'pill pill-bad';
      qrCard.classList.add('hidden');
    }
  } catch (err) { /* manejado por api() */ }
}

async function refreshWhatsappStatusGeneral() {
  try {
    const status = await api('/whatsapp-general/status');
    const pill = $('#wa-status-pill-general');
    const qrCard = $('#qr-card-general');
    if (status.state === 'open') {
      pill.textContent = 'Bot general: conectado';
      pill.className = 'pill pill-ok';
      qrCard.classList.add('hidden');
    } else if (status.state === 'qr') {
      pill.textContent = 'Bot general: escanea el QR';
      pill.className = 'pill pill-warn';
      qrCard.classList.remove('hidden');
      $('#qr-image-general').src = status.qrDataUrl;
    } else {
      pill.textContent = 'Bot general: sin número configurado';
      pill.className = 'pill pill-neutral';
      qrCard.classList.add('hidden');
    }
  } catch (err) { /* manejado por api() */ }
}

function areaLabel(area) {
  return AREAS_LABEL[area] || area || '—';
}

async function refreshEscalados() {
  try {
    const escalados = await api('/conversations/escalated');
    $('#count-escalados').textContent = escalados.length || '';
    $('#empty-escalados').classList.toggle('hidden', escalados.length > 0);
    $('#lista-escalados').innerHTML = escalados
      .map((c) => `
      <div class="list-item">
        <div>
          <strong>${c.contact_id.replace('@s.whatsapp.net', '').replace('web:', 'Web: ')}</strong>
          <div class="preview">${areaLabel(c.area)} · ${c.escalate_reason || 'Escalado'} · ${c.channel}</div>
        </div>
        <button class="btn-ghost" onclick="resolverConversacion('${c.contact_id}')">Marcar atendido</button>
      </div>`)
      .join('');
  } catch (err) { /* manejado */ }
}

async function refreshLeads() {
  try {
    const area = $('#filtro-area').value;
    const status = $('#filtro-status').value;
    const channel = $('#filtro-canal').value;
    const params = new URLSearchParams();
    if (area) params.set('area', area);
    if (status) params.set('status', status);
    if (channel) params.set('channel', channel);
    const leads = await api('/leads?' + params.toString());
    $('#tabla-leads').innerHTML = leads
      .map((l) => `
      <tr>
        <td>${l.nombre_completo || '—'}</td>
        <td>${areaLabel(l.area)}</td>
        <td>${l.channel}</td>
        <td>${l.telefono || '—'}</td>
        <td>${l.correo || '—'}</td>
        <td>${l.ciudad || '—'}</td>
        <td>${l.resumen_caso || '—'}</td>
        <td>
          <select class="status-select" onchange="cambiarEstadoLead(${l.id}, this.value)">
            <option value="nuevo" ${l.status === 'nuevo' ? 'selected' : ''}>Nuevo</option>
            <option value="contactado" ${l.status === 'contactado' ? 'selected' : ''}>Contactado</option>
            <option value="cerrado" ${l.status === 'cerrado' ? 'selected' : ''}>Cerrado</option>
          </select>
        </td>
        <td>${new Date(l.created_at + 'Z').toLocaleString('es-CO')}</td>
      </tr>`)
      .join('');
  } catch (err) { /* manejado */ }
}

async function refreshConversaciones() {
  try {
    const conversaciones = await api('/conversations');
    $('#tabla-conversaciones').innerHTML = conversaciones
      .map((c) => `
      <tr>
        <td>${c.contact_id.replace('@s.whatsapp.net', '').replace('web:', 'Web: ')}</td>
        <td>${c.channel}</td>
        <td>${c.step}</td>
        <td>${areaLabel(c.area)}</td>
        <td>${new Date(c.last_message_at + 'Z').toLocaleString('es-CO')}</td>
      </tr>`)
      .join('');
  } catch (err) { /* manejado */ }
}

window.cambiarEstadoLead = async (id, status) => {
  try {
    await api(`/leads/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
    showToast('Estado actualizado.');
  } catch (err) {
    showToast(err.message, true);
  }
};

window.resolverConversacion = async (contactId) => {
  try {
    await api(`/conversations/${encodeURIComponent(contactId)}/resolve`, { method: 'POST' });
    showToast('Marcado como atendido.');
    refreshEscalados();
  } catch (err) {
    showToast(err.message, true);
  }
};

(async function init() {
  try {
    const session = await api('/session');
    if (session.authenticated) showDashboard();
    else showLogin();
  } catch {
    showLogin();
  }
})();
