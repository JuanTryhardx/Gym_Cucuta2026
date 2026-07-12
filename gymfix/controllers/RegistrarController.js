import { Auth }         from '../services/auth.js'
import { buildNavbar, formatMoney, formatDate, showLoader, hideLoader,
         swalSuccess, swalError, isCliente } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'

export const RegistrarController = {

  async init() {
    Auth.requireAuth()
    // Clientes no pueden registrar personas
    if (isCliente()) { window.location.href = 'inicio.html'; return }

    document.getElementById('navbar-container').innerHTML = buildNavbar('registrar.html')

    window.registrarPersona = () => this.registrar()
    window.limpiarForm      = () => this.limpiarForm()

    showLoader('Cargando...')
    await Promise.all([this.cargarStats(), this.cargarUltimos()])
    hideLoader()
  },

  async registrar() {
    const nombre      = document.getElementById('r_nombre')?.value.trim()
    const documento   = document.getElementById('r_documento')?.value.trim()
    const mensualidad = document.getElementById('r_mensualidad')?.value.trim()

    if (!nombre || !documento || !mensualidad) {
      await swalError('Campos requeridos', 'Nombre, Documento y Mensualidad son obligatorios.')
      return
    }

    showLoader('Verificando documento...')
    try {
      const dup = await PersonaModel.getByDocumento(documento)
      if (dup && dup.length > 0) {
        hideLoader()
        await swalError('Documento duplicado', 'Ya existe un miembro con este número de documento.')
        return
      }

      showLoader('Registrando miembro...')
      await PersonaModel.insert({
        nombre, documento,
        nacimiento:           document.getElementById('r_nacimiento')?.value || null,
        genero:               document.getElementById('r_genero')?.value || 'Masculino',
        telefono:             document.getElementById('r_telefono')?.value.trim() || '',
        email:                document.getElementById('r_email')?.value.trim() || '',
        direccion:            document.getElementById('r_direccion')?.value.trim() || '',
        plan_id:              document.getElementById('r_plan')?.value || '1',
        mensualidad:          parseFloat(mensualidad) || 0,
        fecha_inicio:         document.getElementById('r_inicio')?.value || new Date().toISOString().split('T')[0],
        entrenador:           document.getElementById('r_entrenador')?.value.trim() || '',
        objetivo:             document.getElementById('r_objetivo')?.value || 'General',
        estado:               document.getElementById('r_estado')?.value || 'Inactivo',
        peso:                 parseFloat(document.getElementById('r_peso')?.value) || null,
        altura:               parseFloat(document.getElementById('r_altura')?.value) || null,
        contacto_emergencia:  document.getElementById('r_emergencia')?.value.trim() || '',
        observaciones:        document.getElementById('r_obs')?.value.trim() || '',
        fecha_registro:       new Date().toISOString()
      })

      this.limpiarForm()
      await Promise.all([this.cargarStats(), this.cargarUltimos()])
      await swalSuccess('¡Miembro registrado!', `${nombre} fue agregado exitosamente al sistema.`)
    } catch(e) {
      console.error(e)
      await swalError('Error al registrar', e.message)
    } finally { hideLoader() }
  },

  limpiarForm() {
    const ids = ['r_nombre','r_documento','r_nacimiento','r_telefono','r_email',
      'r_direccion','r_mensualidad','r_inicio','r_entrenador','r_peso','r_altura','r_emergencia','r_obs']
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = '' })
    ;['r_genero','r_plan','r_objetivo','r_estado'].forEach(id => {
      const el = document.getElementById(id); if (el) el.selectedIndex = 0
    })
  },

  async cargarStats() {
    try {
      const data     = await PersonaModel.getStats()
      const total    = data.length
      const activos  = data.filter(p => p.estado === 'Activo').length
      const ingresos = data.reduce((s, p) => s + (parseFloat(p.mensualidad) || 0), 0)

      const el = document.getElementById('regStats')
      if (!el) return
      el.innerHTML = `
        <div class="reg-stat-item">
          <div class="reg-stat-label">Total Registrados</div>
          <div class="reg-stat-value">${total}</div>
        </div>
        <div class="reg-stat-item">
          <div class="reg-stat-label">Activos</div>
          <div class="reg-stat-value" style="color:#4ade80">${activos}</div>
        </div>
        <div class="reg-stat-item">
          <div class="reg-stat-label">Proyección Mensual</div>
          <div class="reg-stat-value" style="color:#38bdf8">${formatMoney(ingresos)}</div>
        </div>`
    } catch(e) { console.error(e) }
  },

  async cargarUltimos() {
    const el = document.getElementById('ultimosReg')
    if (!el) return
    try {
      const data = await PersonaModel.getUltimos(5)
      if (!data || !data.length) {
        el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:12px">Sin registros aún.</p>'
        return
      }
      el.innerHTML = data.map(p => `
        <div class="ultimos-item">
          <div class="ultimos-avatar">${p.nombre.charAt(0).toUpperCase()}</div>
          <div class="ultimos-info">
            <div class="ultimos-nombre">${p.nombre}</div>
            <div class="ultimos-fecha">${formatDate(p.fecha_registro)}</div>
          </div>
          <span class="status-badge ${p.estado==='Activo'?'badge-activo':'badge-inactivo'}">${p.estado}</span>
        </div>`).join('')
    } catch(e) { console.error(e) }
  }
}
