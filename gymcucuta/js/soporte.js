checkAuth();
document.getElementById('navbar-container').innerHTML = buildNavbar('soporte.html');

const PRIORIDAD_COLORS = { alta: '#f87171', media: '#fbbf24', baja: '#4ade80' };

function renderTickets() {
  const tickets = JSON.parse(localStorage.getItem('gym_tickets') || '[]');
  const el = document.getElementById('listaTickets');
  if (!tickets.length) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:8px 0">No has enviado tickets aún.</p>';
    return;
  }
  el.innerHTML = tickets.slice().reverse().map(t => `
    <div class="ticket-item">
      <div class="ticket-prioridad" style="background:${PRIORIDAD_COLORS[t.prioridad]||'#94a3b8'}"></div>
      <div class="ticket-info">
        <div class="ticket-asunto">${t.asunto}</div>
        <div class="ticket-meta">📂 ${t.categoria} · 📅 ${formatDate(t.fecha)}</div>
      </div>
      <span class="ticket-estado">⏳ Pendiente</span>
    </div>`).join('');
}

function enviarTicket() {
  const asunto = document.getElementById('s_asunto').value.trim();
  const descripcion = document.getElementById('s_descripcion').value.trim();
  if (!asunto || !descripcion) { showToast('⚠️ Completa asunto y descripción', '#fbbf24'); return; }

  const tickets = JSON.parse(localStorage.getItem('gym_tickets') || '[]');
  tickets.push({
    id: Date.now(),
    asunto,
    categoria: document.getElementById('s_categoria').value,
    prioridad: document.getElementById('s_prioridad').value,
    descripcion,
    fecha: new Date().toISOString()
  });
  localStorage.setItem('gym_tickets', JSON.stringify(tickets));

  document.getElementById('s_asunto').value = '';
  document.getElementById('s_descripcion').value = '';
  renderTickets();
  showToast('✅ Ticket enviado correctamente');
}

function toggleFaq(el) {
  el.classList.toggle('open');
}

renderTickets();
