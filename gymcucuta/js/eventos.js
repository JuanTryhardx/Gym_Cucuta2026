checkAuth();
document.getElementById('navbar-container').innerHTML = buildNavbar('eventos.html');

const TIPO_COLORS = { clase: '#38bdf8', evento: '#c084fc', evaluacion: '#4ade80', mantenimiento: '#fbbf24', otro: '#f87171' };
const TIPO_ICONS = { clase: '🏋️', evento: '🎉', evaluacion: '📋', mantenimiento: '🔧', otro: '📌' };

let currentDate = new Date();
let selectedDay = null;

function renderCalendario() {
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  document.getElementById('calTitle').textContent =
    new Date(y, m, 1).toLocaleString('es', { month: 'long', year: 'numeric' });

  const eventos = DB.getEventos();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();
  const today = new Date();

  let html = '';
  // prev month days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><span class="cal-day-num">${daysInPrev - i}</span></div>`;
  }
  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvents = eventos.filter(e => e.fecha === dateStr);
    const isToday = today.getFullYear()===y && today.getMonth()===m && today.getDate()===d;
    const isSelected = selectedDay === dateStr;
    const dots = dayEvents.map(e => `<div class="cal-dot ${e.tipo||'otro'}"></div>`).join('');
    html += `<div class="cal-day${isToday?' today':''}${isSelected?' selected':''}" onclick="selectDay('${dateStr}')">
      <span class="cal-day-num">${d}</span>
      <div class="cal-dots">${dots}</div>
    </div>`;
  }
  // next month fill
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day other-month"><span class="cal-day-num">${i}</span></div>`;
  }
  document.getElementById('calGrid').innerHTML = html;
}

function selectDay(dateStr) {
  selectedDay = dateStr;
  renderCalendario();
  renderDayEvents(dateStr);
}

function renderDayEvents(dateStr) {
  const eventos = DB.getEventos().filter(e => e.fecha === dateStr);
  const d = new Date(dateStr + 'T00:00:00');
  const label = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const el = document.getElementById('diaEventos');
  el.innerHTML = `<div class="card-title">📌 ${label}</div>`;
  if (!eventos.length) {
    el.innerHTML += '<p style="color:var(--text-muted);font-size:0.85rem">No hay eventos este día.</p>';
    return;
  }
  el.innerHTML += eventos.map(e => `
    <div class="ev-item">
      <div class="ev-tipo-dot" style="background:${TIPO_COLORS[e.tipo]||'#94a3b8'}"></div>
      <div>
        <div class="ev-info-title">${TIPO_ICONS[e.tipo]||'📌'} ${e.titulo}</div>
        <div class="ev-info-meta">⏰ ${e.hora} · ${e.descripcion||''}</div>
      </div>
      <button class="ev-del-btn" onclick="eliminarEvento(${e.id})">🗑️</button>
    </div>`).join('');
}

function renderListaEventos() {
  const eventos = DB.getEventos().sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const el = document.getElementById('listaEventos');
  if (!eventos.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No hay eventos creados.</p>'; return; }
  el.innerHTML = eventos.map(e => {
    const d = new Date(e.fecha + 'T00:00:00');
    const dateLabel = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    return `
    <div class="ev-item">
      <div class="ev-tipo-dot" style="background:${TIPO_COLORS[e.tipo]||'#94a3b8'}"></div>
      <div style="flex:1">
        <div class="ev-info-title">${e.titulo}</div>
        <div class="ev-info-meta">📅 ${dateLabel} · ⏰ ${e.hora}</div>
      </div>
      <button class="ev-del-btn" onclick="eliminarEvento(${e.id})">🗑️</button>
    </div>`;
  }).join('');
}

function changeMonth(dir) {
  currentDate.setMonth(currentDate.getMonth() + dir);
  renderCalendario();
}

function openEvento() {
  document.getElementById('ev_fecha').value = selectedDay || new Date().toISOString().split('T')[0];
  document.getElementById('ev_hora').value = '08:00';
  document.getElementById('eventoModal').style.display = 'flex';
}
function closeEvento() { document.getElementById('eventoModal').style.display = 'none'; }

function guardarEvento() {
  const titulo = document.getElementById('ev_titulo').value.trim();
  const fecha = document.getElementById('ev_fecha').value;
  const hora = document.getElementById('ev_hora').value;
  if (!titulo || !fecha) { showToast('⚠️ Completa título y fecha', '#fbbf24'); return; }
  const eventos = DB.getEventos();
  eventos.push({
    id: Date.now(),
    titulo, fecha, hora,
    tipo: document.getElementById('ev_tipo').value,
    descripcion: document.getElementById('ev_desc').value
  });
  DB.setEventos(eventos);
  closeEvento();
  document.getElementById('ev_titulo').value = '';
  document.getElementById('ev_desc').value = '';
  renderCalendario();
  renderListaEventos();
  if (selectedDay === fecha) renderDayEvents(fecha);
  showToast('✅ Evento guardado');
}

function eliminarEvento(id) {
  if (!confirm('¿Eliminar este evento?')) return;
  DB.setEventos(DB.getEventos().filter(e => e.id !== id));
  renderCalendario();
  renderListaEventos();
  if (selectedDay) renderDayEvents(selectedDay);
  showToast('🗑️ Evento eliminado', '#f87171');
}

renderCalendario();
renderListaEventos();
