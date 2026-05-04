// ============================================================
// controllers/RegistrarController.js  (admin registra miembros)
// ============================================================
import { Auth }         from '../services/auth.js'
import { showToast, buildNavbar, formatMoney, formatDate } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'

export const RegistrarController = {

  async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('registrar.html')
    window.registrarPersona = () => this.registrar()
    window.limpiarForm      = () => this.limpiarForm()
    await Promise.all([this.cargarStats(), this.cargarUltimos()])
  },

  async registrar() {
    const nombre    = document.getElementById('r_nombre').value.trim()
    const documento = document.getElementById('r_documento').value.trim()
    const plan_id   = parseInt(document.getElementById('r_plan').value)
    if (!nombre || !documento) { showToast('⚠️ Nombre y documento son obligatorios', '#fbbf24'); return }
    if (!plan_id)               { showToast('⚠️ Debes seleccionar un plan', '#fbbf24'); return }

    try {
      const dup = await PersonaModel.getByDocumento(documento)
      if (dup.length > 0) { showToast('⚠️ Este documento ya está registrado', '#f87171'); return }

      await PersonaModel.insert({
        nombre, documento, plan_id,
        nacimiento:    document.getElementById('r_nacimiento').value || null,
        genero:        document.getElementById('r_genero').value,
        telefono:      document.getElementById('r_telefono').value.trim(),
        email:         document.getElementById('r_email').value.trim(),
        direccion:     document.getElementById('r_direccion').value.trim(),
        mensualidad:   parseFloat(document.getElementById('r_mensualidad').value) || 0,
        fecha_inicio:  document.getElementById('r_inicio').value || null,
        entrenador:    document.getElementById('r_entrenador').value.trim(),
        objetivo:      document.getElementById('r_objetivo').value,
        estado:        document.getElementById('r_estado').value,
        peso:          parseFloat(document.getElementById('r_peso').value) || null,
        altura:        parseFloat(document.getElementById('r_altura').value) || null,
        emergencia:    document.getElementById('r_emergencia').value.trim(),
        observaciones: document.getElementById('r_obs').value.trim(),
        fecha_registro: new Date().toISOString(),
      })

      showToast('✅ ¡Miembro registrado correctamente! 🔥')
      this.limpiarForm()
      await Promise.all([this.cargarStats(), this.cargarUltimos()])
      setTimeout(() => { window.location.href = 'personas.html' }, 1200)
    } catch(e) {
      console.error(e)
      showToast('❌ Error: ' + e.message, '#f87171')
    }
  },

  limpiarForm() {
    ['r_nombre','r_documento','r_nacimiento','r_telefono','r_email',
     'r_direccion','r_mensualidad','r_inicio','r_entrenador',
     'r_peso','r_altura','r_emergencia','r_obs'].forEach(id => {
      const el = document.getElementById(id)
      if (el) el.value = ''
    })
  },

  async cargarStats() {
    try {
      const data     = await PersonaModel.getStats()
      const total    = data.length
      const activos  = data.filter(p => p.estado === 'Activo').length
      const ingresos = data.reduce((s, p) => s + (parseFloat(p.mensualidad)||0), 0)
      document.getElementById('regStats').innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Total Miembros</div><div class="stat-value">${total}</div></div>
          <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Activos</div><div class="stat-value" style="color:#4ade80">${activos}</div></div>
          <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Ingresos Proyectados</div><div class="stat-value" style="font-size:1.2rem">${formatMoney(ingresos)}</div></div>
        </div>`
    } catch(e) { console.error(e) }
  },

  async cargarUltimos() {
    try {
      const data = await PersonaModel.getUltimos(5)
      document.getElementById('ultimosReg').innerHTML = data.length
        ? data.map(p => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(56,189,248,0.07)">
            <div>
              <div style="font-weight:700;font-size:0.88rem">${p.nombre}</div>
              <div style="color:var(--text-muted);font-size:0.75rem">${formatDate(p.fecha_registro)}</div>
            </div>
            <span class="badge ${p.estado==='Activo'?'badge-active':'badge-inactive'}">${p.estado}</span>
          </div>`).join('')
        : '<p style="color:var(--text-muted);font-size:0.85rem">Sin registros aún.</p>'
    } catch(e) { console.error(e) }
  }
}
