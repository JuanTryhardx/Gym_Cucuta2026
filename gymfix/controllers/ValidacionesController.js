// ============================================================
// ValidacionesController.js — Solo Admin
// ============================================================
import { Auth }           from '../services/auth.js'
import { buildNavbar, showLoader, hideLoader, swalConfirm, swalSuccess, swalError, isAdmin } from '../services/ui.js'
import { SolicitudModel } from '../models/SolicitudModel.js'
import { PersonaModel }   from '../models/PersonaModel.js'

export const ValidacionesController = {

  async init() {
    Auth.requireAuth()
    // Solo admin puede entrar a validaciones
    if (!isAdmin()) { window.location.href = 'inicio.html'; return }

    document.getElementById('navbar-container').innerHTML = buildNavbar('validaciones.html')

    window.setFiltro         = (f)  => this._setFiltro(f)
    window.verDetalle        = (id) => this._verDetalle(id)
    window.closeDetalle      = ()   => this._closeDetalle()
    window.aprobarSolicitud  = (id) => this.aprobar(id)
    window.rechazarSolicitud = (id) => this.rechazar(id)

    showLoader('Cargando solicitudes...')
    await this.cargar()
    hideLoader()
  },

  async cargar() {
    try {
      this._data = await SolicitudModel.getAll()
      this._actualizarStats()
      this._renderTarjetas()
    } catch(e) {
      console.error(e)
      await swalError('Error de conexión', 'No se pudieron cargar las solicitudes.')
      const c = document.getElementById('contenedor-tarjetas-validaciones')
      if (c) c.innerHTML = `<p style="color:#f87171;padding:20px;text-align:center">Error al conectar con la base de datos.</p>`
    }
  },

  _actualizarStats() {
    const count = (est) => this._data.filter(s => (s.estado||'').toLowerCase() === est).length
    document.getElementById('stat-pendientes').textContent = count('pendiente')
    document.getElementById('stat-aprobados').textContent  = count('aprobado')
    document.getElementById('stat-rechazados').textContent = count('rechazado')
    const badge = document.getElementById('contador-badge')
    const p = count('pendiente')
    if (badge) {
      badge.textContent  = p === 0 ? '✓ Al día' : `${p} pendiente${p > 1 ? 's' : ''}`
      badge.style.background = p === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)'
      badge.style.color      = p === 0 ? '#4ade80' : '#fbbf24'
      badge.style.border     = p === 0 ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(251,191,36,0.3)'
    }
  },

  _renderTarjetas() {
    const contenedor = document.getElementById('contenedor-tarjetas-validaciones')
    const empty  = document.getElementById('emptyMsg')
    const label  = document.getElementById('countLabel')
    if (!contenedor) return

    const lista = this._filtro === 'todos'
      ? this._data
      : this._data.filter(s => (s.estado||'').toLowerCase() === this._filtro)

    if (label) label.textContent = `${lista.length} solicitud${lista.length !== 1 ? 'es' : ''} encontrada${lista.length !== 1 ? 's' : ''}`

    if (!lista.length) {
      contenedor.innerHTML = ''
      if (empty) empty.style.display = 'block'
      return
    }
    if (empty) empty.style.display = 'none'

    contenedor.innerHTML = lista.map((sol, i) => {
      const estado = (sol.estado || 'pendiente').toLowerCase()
      const fecha  = sol.fecha_solicitud
        ? new Date(sol.fecha_solicitud).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' })
        : 'Reciente'

      const badgeMap = {
        pendiente: 'badge-pendiente',
        aprobado:  'badge-activo',
        rechazado: 'badge-inactivo'
      }
      const badgeClass = badgeMap[estado] || 'badge-pendiente'
      const badgeLabel = { pendiente:'⏳ Pendiente', aprobado:'✅ Aprobado', rechazado:'❌ Rechazado' }[estado] || estado

      const botones = estado === 'pendiente'
        ? `<div class="val-card-actions">
            <button class="btn-aprobar" onclick="aprobarSolicitud(${sol.id})">✅ Aprobar</button>
            <button class="btn-rechazar" onclick="rechazarSolicitud(${sol.id})">❌ Rechazar</button>
           </div>`
        : `<div class="val-card-procesado">Solicitud Procesada</div>`

      return `
        <article class="val-card" style="animation-delay:${i*0.06}s">
          <div class="val-card-header">
            <div class="val-avatar">${(sol.nombre||'?').charAt(0).toUpperCase()}</div>
            <div class="val-card-info">
              <div class="val-nombre">${sol.nombre || 'Sin nombre'}</div>
              <div class="val-fecha">📅 Solicitado el ${fecha}</div>
            </div>
            <span class="status-badge ${badgeClass}">${badgeLabel}</span>
          </div>

          <div class="val-contacto">
            <div class="val-contacto-item">📧 <span>${sol.email || '-'}</span></div>
            <div class="val-contacto-item">📱 <span>${sol.telefono || '-'}</span></div>
          </div>

          <div class="val-detalles">
            <div class="val-detalle-item">🎓 <label>Especialización:</label> <span>${sol.especialidad || 'General'}</span></div>
            <div class="val-detalle-item">📄 <label>Documento:</label> <span>${sol.documento || '-'}</span></div>
          </div>

          <div class="val-card-footer">
            <button class="btn-secondary btn-sm" onclick="verDetalle(${sol.id})">🔍 Ver detalle</button>
            ${botones}
          </div>
        </article>`
    }).join('')
  },

  _setFiltro(filtro) {
    this._filtro = filtro
    document.querySelectorAll('.val-tab').forEach(t => t.classList.toggle('active', t.dataset.filter === filtro))
    this._renderTarjetas()
  },

  _verDetalle(id) {
    const sol = this._data.find(s => s.id === id)
    if (!sol) return
    const fecha = sol.fecha_solicitud
      ? new Date(sol.fecha_solicitud).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' }) : '-'
    const estado = (sol.estado || 'pendiente').toLowerCase()

    document.getElementById('detalle-content').innerHTML = `
      <div class="detalle-item"><label>Nombre</label><span>${sol.nombre||'-'}</span></div>
      <div class="detalle-item"><label>Documento</label><span>${sol.documento||'-'}</span></div>
      <div class="detalle-item"><label>Email</label><span>${sol.email||'-'}</span></div>
      <div class="detalle-item"><label>Teléfono</label><span>${sol.telefono||'-'}</span></div>
      <div class="detalle-item"><label>Especialidad</label><span>${sol.especialidad||'-'}</span></div>
      <div class="detalle-item"><label>Fecha solicitud</label><span>${fecha}</span></div>
      <div class="detalle-item full-width"><label>Estado</label><span>${sol.estado||'pendiente'}</span></div>`

    const btnA = document.getElementById('btn-aprobar-modal')
    const btnR = document.getElementById('btn-rechazar-modal')
    if (estado === 'pendiente') {
      btnA.style.display = 'inline-flex'
      btnR.style.display = 'inline-flex'
      btnA.onclick = () => { this._closeDetalle(); this.aprobar(id) }
      btnR.onclick = () => { this._closeDetalle(); this.rechazar(id) }
    } else {
      btnA.style.display = 'none'
      btnR.style.display = 'none'
    }
    document.getElementById('detalleModal').style.display = 'flex'
  },

  _closeDetalle() {
    document.getElementById('detalleModal').style.display = 'none'
  },

  async aprobar(id) {
    const ok = await swalConfirm('¿Aprobar entrenador?', 'Se creará su perfil y podrá iniciar sesión en el sistema.', '✅ Sí, aprobar')
    if (!ok) return
    const sol = this._data.find(s => s.id === id)
    if (!sol) { await swalError('Error', 'Solicitud no encontrada.'); return }
    showLoader('Aprobando entrenador...')
    try {
      await PersonaModel.insert({
        nombre: sol.nombre, documento: sol.documento, email: sol.email,
        telefono: sol.telefono, rol: 'entrenador', estado: 'Activo',
        mensualidad: 0, password: sol.password || null
      })
      await SolicitudModel.updateEstado(id, 'aprobado')
      await this.cargar()
      await swalSuccess('¡Entrenador aprobado!', 'Su perfil fue creado y ya puede acceder al sistema.')
    } catch(e) {
      console.error(e)
      await swalError('Error al aprobar', e.message)
    } finally { hideLoader() }
  },

  async rechazar(id) {
    const ok = await swalConfirm('¿Rechazar solicitud?', 'Esta acción notificará al entrenador que su solicitud fue denegada.', '❌ Sí, rechazar')
    if (!ok) return
    showLoader('Rechazando...')
    try {
      await SolicitudModel.updateEstado(id, 'rechazado')
      await this.cargar()
      await swalSuccess('Solicitud rechazada', 'El registro fue actualizado.')
    } catch(e) {
      console.error(e)
      await swalError('Error al rechazar', e.message)
    } finally { hideLoader() }
  },

  _data: [],
  _filtro: 'pendiente'
}
