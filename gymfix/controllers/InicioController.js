import { Auth } from '../services/auth.js'
import { buildNavbar, formatMoney, formatDate } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'
import { EventoModel } from '../models/EventoModel.js'
import { NoticiaModel } from '../models/NoticiaModel.js'

export const InicioController = {
  async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('inicio.html')
    window.openNoticiaModal = () => document.getElementById('noticiaModal').style.display = 'flex'
    window.closeNoticiaModal = () => document.getElementById('noticiaModal').style.display = 'none'
    window.publicarNoticia = () => this.publicarNoticia()
    window.eliminarNoticia = (id) => this.eliminarNoticia(id)
    await Promise.all([this.renderStats(), this.renderNoticias(), this.renderEventos()])
  },

  async renderStats() {
    try {
      const data = await PersonaModel.getStats()
      const total = data.length, activos = data.filter(p => p.estado === 'Activo').length
      const ingresos = data.reduce((s, p) => s + (parseFloat(p.mensualidad) || 0), 0)
      document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Miembros</div><div class="stat-value">${total}</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Activos</div><div class="stat-value" style="color:#4ade80">${activos}</div></div>
        <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Ingresos</div><div class="stat-value">${formatMoney(ingresos)}</div></div>`
    } catch(e) { console.error(e) }
  },

  async renderNoticias() {
    const el = document.getElementById('noticiasLista')
    try {
      const data = await NoticiaModel.getAll()
      el.innerHTML = data.map(n => `<div class="noticia-item"><div class="noticia-title">${n.titulo}</div><div class="noticia-content">${n.contenido}</div></div>`).join('')
    } catch(e) { console.error(e) }
  },

  async renderEventos() {
    const el = document.getElementById('proximosEventos')
    try {
      const data = await EventoModel.getProximos(3)
      el.innerHTML = data.map(e => `<div class="evento-mini"><h4>${e.titulo}</h4></div>`).join('')
    } catch(e) { console.error(e) }
  }
}
// DISPARADOR AUTOMÁTICO PARA QUE FUNCIONE YA
InicioController.init();
