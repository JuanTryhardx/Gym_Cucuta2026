// ============================================================
// controllers/RegistrarController.js  (Versión Optimizada)
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
    // 1. Captura de datos (Ajustado a los IDs del nuevo HTML)
    const nombre    = document.getElementById('reg_nombre')?.value.trim()
    const documento = document.getElementById('reg_documento')?.value.trim()
    const email     = document.getElementById('reg_email')?.value.trim()

    // 2. Validaciones básicas
    if (!nombre || !documento || !email) { 
        showToast('⚠️ Nombre, documento y email son obligatorios', '#fbbf24'); 
        return; 
    }

    try {
      // 3. Verificar duplicados
      const dup = await PersonaModel.getByDocumento(documento)
      if (dup.length > 0) { 
          showToast('⚠️ Este documento ya está registrado', '#f87171'); 
          return; 
      }

      // 4. Inserción en Base de Datos con VALORES POR DEFECTO
      await PersonaModel.insert({
        nombre, 
        documento,
        email,
        telefono:      document.getElementById('reg_telefono')?.value.trim() || '',
        nacimiento:    document.getElementById('reg_nacimiento')?.value || null,
        genero:        document.getElementById('reg_genero')?.value || 'Otro',
        
        // ASIGNACIÓN AUTOMÁTICA (Ya que quitamos los campos del HTML)
        plan_id:       null,        // Se asignará cuando el Admin lo apruebe
        objetivo:      'General',   // Valor inicial neutro
        estado:        'Pendiente', // Aparecerá en "Validaciones" para el Admin
        
        // Otros campos (opcionales con valores base)
        mensualidad:   0,
        fecha_registro: new Date().toISOString(),
      })

      showToast('✅ ¡Registro enviado! Espera la aprobación del Admin 🔥')
      this.limpiarForm()
      
      // Actualizar vista
      await Promise.all([this.cargarStats(), this.cargarUltimos()])
      
      // Redirección suave
      setTimeout(() => { window.location.href = 'index.html' }, 2000)

    } catch(e) {
      console.error("Error en registro:", e)
      showToast('❌ Error: ' + e.message, '#f87171')
    }
  },

  limpiarForm() {
    const ids = ['reg_nombre','reg_documento','reg_email','reg_telefono','reg_nacimiento','reg_password','reg_password_confirm'];
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) el.value = ''
    })
  },

  async cargarStats() {
    try {
      const data = await PersonaModel.getStats()
      const total = data.length
      const activos = data.filter(p => p.estado === 'Activo').length
      const ingresos = data.reduce((s, p) => s + (parseFloat(p.mensualidad)||0), 0)
      
      const statsEl = document.getElementById('regStats');
      if (statsEl) {
          statsEl.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:12px">
              <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Total</div><div class="stat-value">${total}</div></div>
              <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Activos</div><div class="stat-value" style="color:#4ade80">${activos}</div></div>
              <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Ingresos</div><div class="stat-value">${formatMoney(ingresos)}</div></div>
            </div>`
      }
    } catch(e) { console.error(e) }
  },

  async cargarUltimos() {
    const listEl = document.getElementById('ultimosReg');
    if (!listEl) return;

    try {
      const data = await PersonaModel.getUltimos(5)
      listEl.innerHTML = data.length
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
