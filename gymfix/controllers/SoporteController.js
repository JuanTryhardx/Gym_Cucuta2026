// ============================================================
// controllers/SoporteController.js
// ============================================================
import { Auth }        from '../services/auth.js'
import { showToast, buildNavbar, formatDate } from '../services/ui.js'
import { TicketModel } from '../models/TicketModel.js'

const PRIORIDAD_COLORS = { alta:'#f87171', media:'#fbbf24', baja:'#4ade80' }

export const SoporteController = {

  async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('soporte.html')
    window.enviarTicket = () => this.enviar()
    window.toggleFaq    = (el) => el.classList.toggle('open')
    await this.renderTickets()
  },

  async renderTickets() {
    const el = document.getElementById('listaTickets')
    try {
      const data = await TicketModel.getAll()
      if (!data.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:8px 0">No has enviado tickets aún.</p>'; return }
      el.innerHTML = data.map(t => `
        <div class="ticket-item">
          <div class="ticket-prioridad" style="background:${PRIORIDAD_COLORS[t.prioridad]||'#94a3b8'}"></div>
          <div class="ticket-info">
            <div class="ticket-asunto">${t.asunto}</div>
            <div class="ticket-meta">📂 ${t.categoria} · 📅 ${formatDate(t.fecha)}</div>
          </div>
          <span class="ticket-estado">⏳ Pendiente</span>
        </div>`).join('')
    } catch(e) {
      this._renderLocal()
    }
  },

  _renderLocal() {
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
  },

  async enviar() {
    const asunto      = document.getElementById('s_asunto').value.trim()
    const descripcion = document.getElementById('s_descripcion').value.trim()
    if (!asunto || !descripcion) { showToast('⚠️ Completa asunto y descripción', '#fbbf24'); return }
    const ticket = {
      asunto, descripcion,
      categoria: document.getElementById('s_categoria').value,
      prioridad:  document.getElementById('s_prioridad').value,
      fecha: new Date().toISOString(),
      estado: 'pendiente'
    }
    try {
      await TicketModel.insert(ticket)
      await this.renderTickets()
    } catch(e) {
      const tickets = JSON.parse(localStorage.getItem('gym_tickets')||'[]')
      tickets.push({ id: Date.now(), ...ticket })
      localStorage.setItem('gym_tickets', JSON.stringify(tickets))
      this._renderLocal()
    }
    document.getElementById('s_asunto').value = ''
    document.getElementById('s_descripcion').value = ''
    showToast('✅ Ticket enviado correctamente')
  }
}
