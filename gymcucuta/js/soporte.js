import { checkAuth, buildNavbar, showToast, formatDate, supabase } from './app.js'

checkAuth()
document.getElementById('navbar-container').innerHTML = buildNavbar('soporte.html')

const PRIORIDAD_COLORS = { alta:'#f87171', media:'#fbbf24', baja:'#4ade80' }

async function renderTickets() {
  const { data, error } = await supabase.from('tickets').select('*').order('fecha',{ascending:false})
  if (error) { renderTicketsLocal(); return }
  const el = document.getElementById('listaTickets')
  if (!data || !data.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:8px 0">No has enviado tickets aún.</p>'; return }
  el.innerHTML = data.map(t => `
    <div class="ticket-item">
      <div class="ticket-prioridad" style="background:${PRIORIDAD_COLORS[t.prioridad]||'#94a3b8'}"></div>
      <div class="ticket-info">
        <div class="ticket-asunto">${t.asunto}</div>
        <div class="ticket-meta">📂 ${t.categoria} · 📅 ${formatDate(t.fecha)}</div>
      </div>
      <span class="ticket-estado">⏳ Pendiente</span>
    </div>`).join('')
}

window.enviarTicket = async function () {
  const asunto      = document.getElementById('s_asunto').value.trim()
  const descripcion = document.getElementById('s_descripcion').value.trim()
  if (!asunto || !descripcion) { showToast('⚠️ Completa asunto y descripción', '#fbbf24'); return }

  const ticket = {
    asunto, descripcion,
    categoria: document.getElementById('s_categoria').value,
    prioridad:  document.getElementById('s_prioridad').value,
    fecha:     new Date().toISOString(),
    estado:    'pendiente'
  }

  const { error } = await supabase.from('tickets').insert([ticket])
  if (error) {
    const tickets = JSON.parse(localStorage.getItem('gym_tickets')||'[]')
    tickets.push({ id: Date.now(), ...ticket })
    localStorage.setItem('gym_tickets', JSON.stringify(tickets))
    renderTicketsLocal()
  } else {
    renderTickets()
  }
  document.getElementById('s_asunto').value = ''
  document.getElementById('s_descripcion').value = ''
  showToast('✅ Ticket enviado correctamente')
}

function renderTicketsLocal() {
  const tickets = JSON.parse(localStorage.getItem('gym_tickets')||'[]')
  const el = document.getElementById('listaTickets')
  if (!tickets.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:8px 0">No has enviado tickets aún.</p>'; return }
  el.innerHTML = tickets.slice().reverse().map(t => `
    <div class="ticket-item">
      <div class="ticket-prioridad" style="background:${PRIORIDAD_COLORS[t.prioridad]||'#94a3b8'}"></div>
      <div class="ticket-info">
        <div class="ticket-asunto">${t.asunto}</div>
        <div class="ticket-meta">📂 ${t.categoria} · 📅 ${formatDate(t.fecha)}</div>
      </div>
      <span class="ticket-estado">⏳ Pendiente</span>
    </div>`).join('')
}

window.toggleFaq = function (el) { el.classList.toggle('open') }

renderTickets()
