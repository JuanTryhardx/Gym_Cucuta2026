// ============================================================
// controllers/InicioController.js - Dashboard Visual Mejorado
// ============================================================
import { Auth } from '../services/auth.js'
import { buildNavbar, formatMoney, formatDate, showLoader, hideLoader, swalConfirm, swalError } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'
import { EventoModel }  from '../models/EventoModel.js'
import { NoticiaModel } from '../models/NoticiaModel.js'

export const InicioController = {
  async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('inicio.html')

    window.openNoticiaModal  = () => { const m = document.getElementById('noticiaModal'); if (m) m.style.display = 'flex' }
    window.closeNoticiaModal = () => {
      const m = document.getElementById('noticiaModal')
      if (m) { m.style.display = 'none'; document.getElementById('formNuevaNoticia')?.reset() }
    }
    window.publicarNoticia  = () => this.publicarNoticia()
    window.eliminarNoticia  = (id) => this.eliminarNoticia(id)

    showLoader('Cargando dashboard...')
    await Promise.all([this.renderStats(), this.renderNoticias(), this.renderEventos()])
    hideLoader()
  },

  async publicarNoticia() {
    const titulo    = document.getElementById('noticiaTitulo')?.value.trim()
    const contenido = document.getElementById('noticiaContenido')?.value.trim()
    const tipo      = document.getElementById('noticiaTipo')?.value || 'Novedad'
    const url_media = document.getElementById('noticiaUrlMedia')?.value.trim() || null

    if (!titulo || !contenido) {
      await swalError('Campos requeridos', 'Por favor llena el título y el contenido.')
      return
    }
    showLoader('Publicando...')
    try {
      await NoticiaModel.insert({ titulo, contenido, tipo, url_media, autor: 'Admin' })
      window.closeNoticiaModal()
      await this.renderNoticias()
    } catch (e) {
      await swalError('Error al publicar', 'No se pudo guardar la publicación.')
      console.error(e)
    } finally { hideLoader() }
  },

  async eliminarNoticia(id) {
    const ok = await swalConfirm('¿Eliminar publicación?', 'Esta acción no se puede deshacer.', '🗑️ Eliminar')
    if (!ok) return
    showLoader('Eliminando...')
    try {
      await NoticiaModel.delete(id)
      await this.renderNoticias()
    } catch (e) {
      await swalError('Error', 'No se pudo eliminar la publicación.')
    } finally { hideLoader() }
  },

  async renderStats() {
    try {
      const data = await PersonaModel.getStats()
      const total    = data.length
      const activos  = data.filter(p => p.estado === 'Activo').length
      const inactivos = total - activos
      const ingresos  = data.reduce((s, p) => s + (parseFloat(p.mensualidad) || 0), 0)
      const pct       = total > 0 ? Math.round((activos / total) * 100) : 0

      document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card stat-total">
          <div class="stat-icon-wrap">👥</div>
          <div class="stat-label">Miembros Totales</div>
          <div class="stat-value">${total}</div>
          <div class="stat-bar-wrap"><div class="stat-bar" style="width:100%;background:rgba(56,189,248,0.5)"></div></div>
        </div>
        <div class="stat-card stat-activos">
          <div class="stat-icon-wrap">✅</div>
          <div class="stat-label">Activos</div>
          <div class="stat-value" style="color:#4ade80">${activos}</div>
          <div class="stat-bar-wrap"><div class="stat-bar" style="width:${pct}%;background:#4ade80"></div></div>
          <div class="stat-sub">${pct}% del total</div>
        </div>
        <div class="stat-card stat-inactivos">
          <div class="stat-icon-wrap">⚠️</div>
          <div class="stat-label">Inactivos</div>
          <div class="stat-value" style="color:#f87171">${inactivos}</div>
          <div class="stat-bar-wrap"><div class="stat-bar" style="width:${100-pct}%;background:#f87171"></div></div>
          <div class="stat-sub">${100-pct}% del total</div>
        </div>
        <div class="stat-card stat-ingresos">
          <div class="stat-icon-wrap">💰</div>
          <div class="stat-label">Ingresos Mensuales</div>
          <div class="stat-value" style="color:#3b82f6">${formatMoney(ingresos)}</div>
          <div class="stat-sub">Suma de mensualidades</div>
        </div>`
    } catch(e) { console.error(e) }
  },

  async renderNoticias() {
    const el = document.getElementById('noticiasLista')
    if (!el) return
    try {
      const data = await NoticiaModel.getAll()
      if (!data || data.length === 0) {
        el.innerHTML = `<div class="empty-feed">📢 No hay publicaciones aún</div>`
        return
      }
      el.innerHTML = data.map((n, i) => {
        const tipo = (n.tipo || 'novedad').toLowerCase()
        const tagMap = { novedad:'tag-novedad', actualización:'tag-actualizacion', importante:'tag-importante', motivacion:'tag-motivacion', salud:'tag-salud' }
        const tagClass = tagMap[tipo] || 'tag-novedad'
        const mediaHtml = n.url_media
          ? `<img src="${n.url_media}" alt="noticia" style="width:64px;height:64px;object-fit:cover;border-radius:10px;flex-shrink:0">`
          : `<div class="noticia-icon-placeholder">📰</div>`
        const fecha = n.fecha ? new Date(n.fecha).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' }) : 'Reciente'
        return `
          <div class="noticia-item" style="animation-delay:${i*0.08}s">
            ${mediaHtml}
            <div class="noticia-body">
              <div class="noticia-header-row">
                <span class="noticia-pill ${tagClass}">${n.tipo || 'Novedad'}</span>
                <span class="noticia-date">${fecha}</span>
              </div>
              <h4 class="noticia-titulo">${n.titulo}</h4>
              <p class="noticia-texto">${n.contenido}</p>
            </div>
            <button onclick="eliminarNoticia('${n.id}')" class="btn-del-noticia" title="Eliminar">✕</button>
          </div>`
      }).join('')
    } catch(e) { console.error(e) }
  },

  async renderEventos() {
    const el = document.getElementById('proximosEventos')
    if (!el) return
    try {
      const data = await EventoModel.getProximos(3)
      if (!data || data.length === 0) {
        el.innerHTML = `<p style="color:#94a3b8;font-size:0.88rem;padding:10px 0">Sin eventos programados.</p>`
        return
      }
      el.innerHTML = data.map(e => `
        <div class="evento-mini">
          <div class="evento-dot"></div>
          <div>
            <div class="evento-titulo">${e.titulo}</div>
            ${e.fecha ? `<div class="evento-fecha">📅 ${formatDate(e.fecha)}</div>` : ''}
          </div>
        </div>`).join('')
    } catch(e) { console.error(e) }
  }
}

InicioController.init()
