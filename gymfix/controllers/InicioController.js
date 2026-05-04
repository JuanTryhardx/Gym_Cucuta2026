// ============================================================
// controllers/InicioController.js
// ============================================================
import { Auth }          from '../services/auth.js'
import { showToast, buildNavbar, formatMoney, formatDate } from '../services/ui.js'
import { PersonaModel }  from '../models/PersonaModel.js'
import { EventoModel }   from '../models/EventoModel.js'
import { NoticiaModel }  from '../models/NoticiaModel.js'

const TIPO_ICON  = { info:'ℹ️', update:'🔄', aviso:'⚠️', logro:'🏆' }
const TIPO_LABEL = { info:'Info', update:'Actualización', aviso:'Aviso', logro:'Logro' }

export const InicioController = {

  async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('inicio.html')
    window.openNoticiaModal  = () => { document.getElementById('noticiaModal').style.display = 'flex' }
    window.closeNoticiaModal = () => { document.getElementById('noticiaModal').style.display = 'none' }
    window.publicarNoticia   = () => this.publicarNoticia()
    window.eliminarNoticia   = (id) => this.eliminarNoticia(id)
    await Promise.all([this.renderStats(), this.renderNoticias(), this.renderEventos()])
  },

  async renderStats() {
    try {
      const data = await PersonaModel.getStats()
      const total     = data.length
      const activos   = data.filter(p => p.estado === 'Activo').length
      const inactivos = data.filter(p => p.estado === 'Inactivo').length
      const ingresos  = data.reduce((s, p) => s + (parseFloat(p.mensualidad) || 0), 0)
      const hoy       = new Date().toDateString()
      const nuevosHoy = data.filter(p => p.fecha_registro && new Date(p.fecha_registro).toDateString() === hoy).length
      document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Total Miembros</div><div class="stat-value">${total}</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Activos</div><div class="stat-value" style="color:#4ade80">${activos}</div></div>
        <div class="stat-card"><div class="stat-icon">❌</div><div class="stat-label">Inactivos</div><div class="stat-value" style="color:#f87171">${inactivos}</div></div>
        <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Ingresos Proyectados</div><div class="stat-value" style="font-size:1.4rem">${formatMoney(ingresos)}</div></div>
        <div class="stat-card"><div class="stat-icon">🆕</div><div class="stat-label">Nuevos Hoy</div><div class="stat-value">${nuevosHoy}</div></div>`
    } catch(e) { console.error(e) }
  },

  async renderNoticias() {
    const el = document.getElementById('noticiasLista')
    try {
      const data = await NoticiaModel.getAll()
      if (!data.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">No hay noticias publicadas.</p>'; return }
      el.innerHTML = data.map(n => `
        <div class="noticia-item">
          <div class="noticia-badge-icon ${n.tipo}">${TIPO_ICON[n.tipo]||'📌'}</div>
          <div class="noticia-body">
            <div class="noticia-title">${n.titulo}</div>
            <div class="noticia-content">${n.contenido}</div>
            <div class="noticia-meta">
              <span class="noticia-date">📅 ${formatDate(n.fecha)}</span>
              <span class="noticia-tipo ${n.tipo}">${TIPO_LABEL[n.tipo]||n.tipo}</span>
            </div>
          </div>
          <button class="noticia-delete" onclick="eliminarNoticia(${n.id})">🗑️</button>
        </div>`).join('')
    } catch(e) { console.error(e) }
  },

  async renderEventos() {
    const el = document.getElementById('proximosEventos')
    try {
      const data = await EventoModel.getProximos(3)
      if (!data.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No hay eventos próximos.</p>'; return }
      el.innerHTML = data.map(e => {
        const d = new Date(e.fecha + 'T00:00:00')
        return `<div class="evento-mini">
          <div class="evento-mini-date">
            <span class="em-day">${d.getDate()}</span>
            <span class="em-mon">${d.toLocaleString('es',{month:'short'}).toUpperCase()}</span>
          </div>
          <div class="evento-mini-info"><h4>${e.titulo}</h4><p>⏰ ${e.hora||''}</p></div>
        </div>`
      }).join('')
    } catch(e) { console.error(e) }
  },

  async publicarNoticia() {
    const titulo    = document.getElementById('nTitulo').value.trim()
    const contenido = document.getElementById('nContenido').value.trim()
    const tipo      = document.getElementById('nTipo').value
    if (!titulo || !contenido) { showToast('⚠️ Completa todos los campos', '#fbbf24'); return }
    try {
      await NoticiaModel.insert({ titulo, contenido, tipo, fecha: new Date().toISOString() })
      window.closeNoticiaModal()
      document.getElementById('nTitulo').value = ''
      document.getElementById('nContenido').value = ''
      showToast('✅ Noticia publicada')
      await this.renderNoticias()
    } catch(e) { console.error(e); showToast('❌ Error al publicar', '#f87171') }
  },

  async eliminarNoticia(id) {
    if (!confirm('¿Eliminar esta noticia?')) return
    try {
      await NoticiaModel.delete(id)
      showToast('🗑️ Noticia eliminada', '#f87171')
      await this.renderNoticias()
    } catch(e) { showToast('❌ Error al eliminar', '#f87171') }
  }
}
