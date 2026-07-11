import { Auth }        from '../services/auth.js'
import { showToast, buildNavbar, formatDate, showLoader, hideLoader, swalSuccess, swalError } from '../services/ui.js'
import { TicketModel } from '../models/TicketModel.js'

const PRIORIDAD_COLORS = { alta:'#f87171', media:'#fbbf24', baja:'#4ade80' }

export const SoporteController = {

  async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('soporte.html')
    window.enviarTicket = () => this.enviar()
    window.toggleFaq    = (el) => el.classList.toggle('open')
    showLoader('Cargando tickets...')
    await this.renderTickets()
    hideLoader()
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
            <div class="ticket-meta">${t.categoria} · ${formatDate(t.fecha)}</div>
          </div>
          <span class="ticket-estado">Pendiente</span>
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
          <div class="ticket-meta">${t.categoria} · ${formatDate(t.fecha)}</div>
        </div>
        <span class="ticket-estado">Pendiente</span>
      </div>`).join('')
  },

  async enviar() {
    // 1. Capturamos los valores de tu formulario
    const asunto      = document.getElementById('s_asunto').value.trim()
    const descripcion = document.getElementById('s_descripcion').value.trim()
    const categoria   = document.getElementById('s_categoria').value
    const prioridad   = document.getElementById('s_prioridad').value

    // Validación rápida
    if (!asunto || !descripcion) { 
      showToast('Completa asunto y descripción', '#fbbf24')
      return 
    }

    // Unimos la categoría en la descripción para mantener tu tabla de Supabase limpia
    const descripcionConCategoria = `[Categoría: ${categoria}] ${descripcion}`

    const ticket = {
      asunto, 
      descripcion: descripcionConCategoria, 
      prioridad,
      fecha: new Date().toISOString(),
      estado: 'pendiente'
    }

    try {
      showLoader('Enviando ticket...')

      // A. Guarda el registro en tu base de datos mediante tu modelo actual
      await TicketModel.insert(ticket)

      // B. Envía de forma automática el correo con EmailJS
      // REEMPLAZA "TU_SERVICE_ID" y "TU_TEMPLATE_ID" con los códigos de tu panel de EmailJS
      await emailjs.send("service_r3j8qbq", "template_b61rbq1", {
        asunto: asunto,
        categoria: categoria,
        prioridad: prioridad,
        descripcion: descripcion
      });

      // Refresca la lista de tickets en la interfaz
      await this.renderTickets()
      hideLoader()
      showToast('Ticket enviado y notificado al correo correctamente')

    } catch(e) {
      console.error("Error en el envío, respaldando localmente...", e)
      
      // Si la red falla, tu lógica de respaldo en LocalStorage sigue funcionando impecable
      const tickets = JSON.parse(localStorage.getItem('gym_tickets')||'[]')
      tickets.push({ id: Date.now(), ...ticket, categoria }) 
      localStorage.setItem('gym_tickets', JSON.stringify(tickets))
      
      this._renderLocal()
      hideLoader()
      showToast('Guardado localmente debido a una falla de red', '#fbbf24')
    }

    // Limpia las cajas de texto tras el éxito o respaldo
    document.getElementById('s_asunto').value = ''
    document.getElementById('s_descripcion').value = ''
  }
}
