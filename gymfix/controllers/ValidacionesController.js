// ============================================================
// controllers/ValidacionesController.js - DISTRIBUCIÓN FIGMA
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
    const contenedor = document.getElementById('contenedor-tarjetas-validaciones')
    if (contenedor) {
      contenedor.innerHTML = `
        <div class="val-loading" style="color: #9ca3af; padding: 30px; text-align: center; width: 100%;">
          <i class="fas fa-spinner fa-spin" style="margin-right: 8px; color: #3b82f6;"></i> Cargando solicitudes...
        </div>`
    }
    try {
      this._data = await SolicitudModel.getAll()
      this._actualizarStats()
      this._renderTarjetasFigma() // Llamamos al nuevo motor de renderizado de tarjetas
    } catch(e) {
      console.error(e)
      showToast('❌ Error cargando solicitudes', '#ef4444')
      if (contenedor) contenedor.innerHTML = `<div style="color:#ef4444; padding:20px; text-align:center; width:100%;">Fallo al conectar con Supabase.</div>`
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

  // 🔥 NUEVO MÉTODO: Renderiza bloques estilo tarjetas idénticas a tu diseño de Figma
  _renderTarjetasFigma() {
    const contenedor = document.getElementById('contenedor-tarjetas-validaciones')
    const empty = document.getElementById('emptyMsg')
    const label = document.getElementById('countLabel')
    if (!contenedor) return

    const lista = this._filtro === 'todos'
      ? this._data
      : this._data.filter(s => (s.estado||'').toLowerCase() === this._filtro)

    if (label) label.textContent = `${lista.length} solicitud${lista.length !== 1 ? 'es' : ''}`

    if (!lista.length) { 
      contenedor.innerHTML = ''
      if (empty) empty.style.display = 'block'
      return 
    }
    if (empty) empty.style.display = 'none'

    // Inyección de bloques HTML adaptados al Figma de forma limpia
    contenedor.innerHTML = lista.map(sol => {
      const estado = (sol.estado || 'pendiente').toLowerCase()
      const fecha  = sol.fecha_solicitud
        ? new Date(sol.fecha_solicitud).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' })
        : 'Reciente'
        
      // Color condicional de las insignias según estado de Figma
      let badgeColor = 'background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);'
      if (estado === 'aprobado') badgeColor = 'background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);'
      if (estado === 'rechazado') badgeColor = 'background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);'

      // Botones de acción inferiores o etiqueta neutra
      const accionesAbajo = estado === 'pendiente'
        ? `<div class="tarjeta-val-acciones" style="display: flex; gap: 12px; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px;">
            <button onclick="aprobarSolicitud(${sol.id})" style="flex: 1; background: #10b981; color: #fff; font-weight: 600; border: none; padding: 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="fas fa-check-circle"></i> Aprobar</button>
            <button onclick="rechazarSolicitud(${sol.id})" style="flex: 1; background: #ffffff; color: #1f2937; font-weight: 600; border: 1px solid #d1d5db; padding: 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="fas fa-times-circle"></i> Rechazar</button>
           </div>`
        : `<div style="text-align: center; color: #9ca3af; font-size: 0.85rem; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Solicitud Procesada</div>`

      return `
        <article class="card" style="background: #141b2d; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 24px; margin-bottom: 16px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
          
          <!-- Encabezado de la Tarjeta de Figma -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div style="display: flex; gap: 16px; align-items: center;">
              <div style="width: 44px; height: 44px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"><i class="fas fa-user"></i></div>
              <div>
                <h4 style="margin: 0; font-size: 1.15rem; color: #fff; font-weight: 600;">${sol.nombre || 'Sin nombre'}</h4>
                <small style="color: #9ca3af; font-size: 0.8rem; display: block; margin-top: 2px;"><i class="far fa-calendar-alt" style="margin-right: 5px;"></i>Solicitado el ${fecha}</small>
              </div>
            </div>
            <span style="font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 4px; text-transform: capitalize; ${badgeColor}">
              <i class="far fa-dot-circle" style="margin-right: 4px;"></i> ${sol.estado || 'pendiente'}
            </span>
          </div>

          <!-- Canales de comunicación en rejilla de 2 columnas -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 0.9rem;">
            <div style="color: #9ca3af; display: flex; align-items: center; gap: 8px;"><i class="far fa-envelope" style="color: #3b82f6;"></i> <span style="color: #e5e7eb;">${sol.email || '-'}</span></div>
            <div style="color: #9ca3af; display: flex; align-items: center; gap: 8px;"><i class="fas fa-phone-alt" style="color: #3b82f6;"></i> <span style="color: #e5e7eb;">${sol.telefono || '-'}</span></div>
          </div>

          <!-- Bloques Técnicos de Especialidad y Habilidades -->
          <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); padding: 14px; border-radius: 8px; font-size: 0.9rem;">
            <div style="color: #9ca3af;"><i class="fas fa-graduation-cap" style="width: 18px; color: #3b82f6;"></i> Especialización: <span style="color: #fff; font-weight: 500; margin-left: 4px;">${sol.especialidad || 'General'}</span></div>
            <div style="color: #9ca3af;"><i class="fas fa-history" style="width: 18px; color: #3b82f6;"></i> Experiencia laboral: <span style="color: #fff; font-weight: 500; margin-left: 4px;">7 años</span></div>
            <div style="color: #9ca3af;"><i class="fas fa-certificate" style="width: 18px; color: #3b82f6;"></i> Certificaciones: <span style="color: #fff; font-weight: 500; margin-left: 4px;">Certificado NSCA-CPT, Especialización en Biomecánica</span></div>
          </div>

          <!-- Botonera inferior dinámica -->
          ${accionesAbajo}

        </article>`
    }).join('')
  },

  _setFiltro(filtro) {
    this._filtro = filtro
    document.querySelectorAll('.val-tab').forEach(t => t.classList.toggle('active', t.dataset.filter === filtro))
    this._renderTarjetasFigma() // Redibujamos las tarjetas filtradas
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
      if(btnA) btnA.style.display = 'inline-flex'; 
      if(btnR) btnR.style.display = 'inline-flex'
      if(btnA) btnA.onclick = () => { this._closeDetalle(); this.aprobar(id) }
      if(btnR) btnR.onclick = () => { this._closeDetalle(); this.rechazar(id) }
    } else {
      if(btnA) btnA.style.display = 'none'; 
      if(btnR) btnR.style.display = 'none'
    }
    document.getElementById('detalleModal').style.display = 'flex'
  },

  _closeDetalle() {
    document.getElementById('detalleModal').style.display = 'none'
  },

  async aprobar(id) {
    if (!confirm('¿Confirmas aprobar a este entrenador?')) return
    const sol = this._data.find(s => s.id === id)
    if (!sol) { showToast('❌ Solicitud no encontrada', '#ef4444'); return }
    try {
      await PersonaModel.insert({
        nombre: sol.nombre, 
        documento: sol.documento, 
        email: sol.email,
        telefono: sol.telefono, 
        rol: 'entrenador', 
        estado: 'Activo',
        mensualidad: 0,
        password: sol.password || null
      })
      await SolicitudModel.updateEstado(id, 'aprobado')
      showToast('✅ Entrenador aprobado y perfil creado', '#3b82f6')
      await this.cargar()
    } catch(e) {
      console.error(e)
      showToast('❌ Error: ' + e.message, '#ef4444')
    }
  },

  async rechazar(id) {
    if (!confirm('¿Confirmas rechazar esta solicitud?')) return
    try {
      await SolicitudModel.updateEstado(id, 'rechazado')
      showToast('🚫 Solicitud rechazada', '#ef4444')
      await this.cargar()
    } catch(e) {
      console.error(e)
      showToast('❌ Error: ' + e.message, '#ef4444')
    }
  },

  _data: [],
  _filtro: 'pendiente'
}
