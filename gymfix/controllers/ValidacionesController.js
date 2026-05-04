// ============================================================
// controllers/ValidacionesController.js
// ============================================================
import { Auth }           from '../services/auth.js'
import { showToast, buildNavbar } from '../services/ui.js'
import { SolicitudModel } from '../models/SolicitudModel.js'
import { PersonaModel }   from '../models/PersonaModel.js'

export const ValidacionesController = {

  async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('validaciones.html')

    window.setFiltro         = (f)  => this._setFiltro(f)
    window.verDetalle        = (id) => this._verDetalle(id)
    window.closeDetalle      = ()   => this._closeDetalle()
    window.aprobarSolicitud  = (id) => this.aprobar(id)
    window.rechazarSolicitud = (id) => this.rechazar(id)

    await this.cargar()
  },

  async cargar() {
    const tbody = document.getElementById('tbody-validaciones')
    tbody.innerHTML = `<tr><td colspan="7" class="val-loading">⏳ Cargando solicitudes...</td></tr>`
    try {
      this._data = await SolicitudModel.getAll()
      this._actualizarStats()
      this._renderTabla()
    } catch(e) {
      console.error(e)
      showToast('❌ Error cargando solicitudes', '#f87171')
      tbody.innerHTML = `<tr><td colspan="7" class="val-loading">❌ No se pudieron cargar.</td></tr>`
    }
  },

  _actualizarStats() {
    const count = (est) => this._data.filter(s => (s.estado||'').toLowerCase() === est).length
    document.getElementById('stat-pendientes').textContent  = count('pendiente')
    document.getElementById('stat-aprobados').textContent   = count('aprobado')
    document.getElementById('stat-rechazados').textContent  = count('rechazado')
    const badge = document.getElementById('contador-badge')
    const p = count('pendiente')
    if (badge) badge.textContent = p === 0 ? '✓ Sin pendientes' : `${p} pendiente${p > 1 ? 's' : ''}`
  },

  _renderTabla() {
    const tbody = document.getElementById('tbody-validaciones')
    const empty = document.getElementById('emptyMsg')
    const label = document.getElementById('countLabel')

    const lista = this._filtro === 'todos'
      ? this._data
      : this._data.filter(s => (s.estado||'').toLowerCase() === this._filtro)

    label.textContent = `${lista.length} solicitud${lista.length !== 1 ? 'es' : ''}`

    if (!lista.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return }
    empty.style.display = 'none'

    const pillClass = e => e === 'aprobado' ? 'pill-aprobado' : e === 'rechazado' ? 'pill-rechazado' : 'pill-pendiente'
    const pillIcon  = e => e === 'aprobado' ? '✅' : e === 'rechazado' ? '❌' : '⏳'

    tbody.innerHTML = lista.map(sol => {
      const estado = (sol.estado || 'pendiente').toLowerCase()
      const fecha  = sol.fecha_solicitud
        ? new Date(sol.fecha_solicitud).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })
        : '-'
      const btns = estado === 'pendiente'
        ? `<button class="btn-val-aprobar"  onclick="aprobarSolicitud(${sol.id})">✅ Aprobar</button>
           <button class="btn-val-rechazar" onclick="rechazarSolicitud(${sol.id})">❌ Rechazar</button>`
        : `<span style="color:var(--text-muted);font-size:0.8rem">—</span>`
      return `
        <tr>
          <td><div class="val-name-cell">
            <div class="val-avatar">${(sol.nombre||'?').charAt(0).toUpperCase()}</div>
            <div><div class="val-name">${sol.nombre||'Sin nombre'}</div>
                 <div class="val-email">${sol.email||'-'}</div></div>
          </div></td>
          <td>${sol.documento||'-'}</td>
          <td>${sol.telefono||'-'}</td>
          <td>${sol.especialidad||'-'}</td>
          <td>${fecha}</td>
          <td><span class="pill ${pillClass(estado)}">${pillIcon(estado)} ${sol.estado||'pendiente'}</span></td>
          <td><div class="acciones-cell">${btns}
            <button class="btn-val-ver" onclick="verDetalle(${sol.id})">👁 Ver</button>
          </div></td>
        </tr>`
    }).join('')
  },

  _setFiltro(filtro) {
    this._filtro = filtro
    document.querySelectorAll('.val-tab').forEach(t => t.classList.toggle('active', t.dataset.filter === filtro))
    this._renderTabla()
  },

  _verDetalle(id) {
    const sol = this._data.find(s => s.id === id)
    if (!sol) return
    const fecha = sol.fecha_solicitud
      ? new Date(sol.fecha_solicitud).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' })
      : '-'
    document.getElementById('detalle-content').innerHTML = `
      <div class="detalle-item"><label>Nombre</label><span>${sol.nombre||'-'}</span></div>
      <div class="detalle-item"><label>Documento</label><span>${sol.documento||'-'}</span></div>
      <div class="detalle-item"><label>Email</label><span>${sol.email||'-'}</span></div>
      <div class="detalle-item"><label>Teléfono</label><span>${sol.telefono||'-'}</span></div>
      <div class="detalle-item"><label>Especialidad</label><span>${sol.especialidad||'-'}</span></div>
      <div class="detalle-item"><label>Fecha solicitud</label><span>${fecha}</span></div>
      <div class="detalle-item full-width"><label>Estado</label><span>${sol.estado||'pendiente'}</span></div>`
    const estado = (sol.estado||'pendiente').toLowerCase()
    const btnA = document.getElementById('btn-aprobar-modal')
    const btnR = document.getElementById('btn-rechazar-modal')
    if (estado === 'pendiente') {
      btnA.style.display = 'inline-flex'; btnR.style.display = 'inline-flex'
      btnA.onclick = () => { this._closeDetalle(); this.aprobar(id) }
      btnR.onclick = () => { this._closeDetalle(); this.rechazar(id) }
    } else {
      btnA.style.display = 'none'; btnR.style.display = 'none'
    }
    document.getElementById('detalleModal').style.display = 'flex'
  },

  _closeDetalle() {
    document.getElementById('detalleModal').style.display = 'none'
  },

  async aprobar(id) {
    if (!confirm('¿Confirmas aprobar a este entrenador?')) return
    const sol = this._data.find(s => s.id === id)
    if (!sol) { showToast('❌ Solicitud no encontrada', '#f87171'); return }
    try {
      await PersonaModel.insert({
        nombre: sol.nombre, documento: sol.documento, email: sol.email,
        telefono: sol.telefono, rol: 'entrenador', estado: 'Activo',
        password: sol.password || null
      })
      await SolicitudModel.updateEstado(id, 'aprobado')
      showToast('✅ Entrenador aprobado y perfil creado', '#22c55e')
      await this.cargar()
    } catch(e) {
      console.error(e)
      showToast('❌ Error: ' + e.message, '#f87171')
    }
  },

  async rechazar(id) {
    if (!confirm('¿Confirmas rechazar esta solicitud?')) return
    try {
      await SolicitudModel.updateEstado(id, 'rechazado')
      showToast('🚫 Solicitud rechazada', '#f87171')
      await this.cargar()
    } catch(e) {
      console.error(e)
      showToast('❌ Error: ' + e.message, '#f87171')
    }
  },

  _data: [],
  _filtro: 'pendiente'
}
