// ============================================================
// controllers/RegistrarController.js  (Versión Corregida)
// ============================================================
import { Auth }         from '../services/auth.js'
import { showToast, buildNavbar, formatMoney, formatDate } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'

export const RegistrarController = {

  async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('registrar.html')
    
    // Exponer métodos al objeto global window mapeando con los botones del HTML
    window.registrarPersona = () => this.registrar()
    window.limpiarForm      = () => this.limpiarForm()
    
    await Promise.all([this.cargarStats(), this.cargarUltimos()])
  },

  async registrar() {
    // 1. Captura de datos sincronizada al 100% con los IDs de tu HTML
    const nombre      = document.getElementById('r_nombre')?.value.trim()
    const documento   = document.getElementById('r_documento')?.value.trim()
    const mensualidad = document.getElementById('r_mensualidad')?.value.trim()

    // 2. Validaciones básicas obligatorias
    if (!nombre || !documento || !mensualidad) { 
        showToast('⚠️ Nombre, Documento y Mensualidad son obligatorios', '#ef4444')
        return
    }

    try {
      // 3. Verificar si el documento ya existe en tu Supabase
      const dup = await PersonaModel.getByDocumento(documento)
      if (dup && dup.length > 0) { 
          showToast('⚠️ Este documento ya está registrado', '#ef4444')
          return
      }

      // 4. Armar el objeto completo para la tabla de Supabase con todos tus campos
      const nuevoMiembro = {
        nombre, 
        documento,
        nacimiento:        document.getElementById('r_nacimiento')?.value || null,
        genero:            document.getElementById('r_genero')?.value || 'Masculino',
        telefono:          document.getElementById('r_telefono')?.value.trim() || '',
        email:             document.getElementById('r_email')?.value.trim() || '',
        direccion:         document.getElementById('r_direccion')?.value.trim() || '',
        
        // Información del Plan
        plan_id:           document.getElementById('r_plan')?.value || '1',
        mensualidad:       parseFloat(mensualidad) || 0,
        fecha_inicio:      document.getElementById('r_inicio')?.value || new Date().toISOString().split('T')[0],
        entrenador:        document.getElementById('r_entrenador')?.value.trim() || '',
        objetivo:          document.getElementById('r_objetivo')?.value || 'General',
        estado:            document.getElementById('r_estado')?.value || 'Activo',
        
        // Información de Salud y Biometría
        peso:              parseFloat(document.getElementById('r_peso')?.value) || null,
        altura:            parseFloat(document.getElementById('r_altura')?.value) || null,
        contacto_emergencia: document.getElementById('r_emergencia')?.value.trim() || '',
        observaciones:     document.getElementById('r_obs')?.value.trim() || '',
        
        fecha_registro:    new Date().toISOString()
      }

      // 5. Inserción en la base de datos
      await PersonaModel.insert(nuevoMiembro)

      showToast('✅ ¡Miembro registrado con éxito! 🚀')
      this.limpiarForm()
      
      // Actualizar los componentes visuales del panel lateral de inmediato
      await Promise.all([this.cargarStats(), this.cargarUltimos()])

    } catch(e) {
      console.error("Error en registro:", e)
      showToast('❌ Error al guardar: ' + e.message, '#ef4444')
    }
  },

  limpiarForm() {
    // Limpia exactamente los campos definidos en tu HTML
    const ids = [
      'r_nombre', 'r_documento', 'r_nacimiento', 'r_telefono', 
      'r_email', 'r_direccion', 'r_mensualidad', 'r_inicio', 
      'r_entrenador', 'r_peso', 'r_altura', 'r_emergencia', 'r_obs'
    ]
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) el.value = ''
    })
    // Resetea los selectores desplegables
    if(document.getElementById('r_genero')) document.getElementById('r_genero').selectedIndex = 0
    if(document.getElementById('r_plan')) document.getElementById('r_plan').selectedIndex = 0
    if(document.getElementById('r_objetivo')) document.getElementById('r_objetivo').selectedIndex = 0
    if(document.getElementById('r_estado')) document.getElementById('r_estado').selectedIndex = 0
  },

  async cargarStats() {
    try {
      const data = await PersonaModel.getStats()
      const total = data.length
      const activos = data.filter(p => p.estado === 'Activo').length
      const ingresos = data.reduce((s, p) => s + (parseFloat(p.mensualidad) || 0), 0)
      
      const statsEl = document.getElementById('regStats')
      if (statsEl) {
          statsEl.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:12px;">
              <div class="stat-card" style="padding:14px; background: rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px;">
                <div class="stat-label" style="font-size:0.75rem; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px;">Total Registrados</div>
                <div class="stat-value" style="font-size:1.5rem; font-weight:700; color:#fff;">${total}</div>
              </div>
              <div class="stat-card" style="padding:14px; background: rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px;">
                <div class="stat-label" style="font-size:0.75rem; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px;">Activos</div>
                <div class="stat-value" style="font-size:1.5rem; font-weight:700; color:#3b82f6;">${activos}</div>
              </div>
              <div class="stat-card" style="padding:14px; background: rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px;">
                <div class="stat-label" style="font-size:0.75rem; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px;">Proyección Mensual</div>
                <div class="stat-value" style="font-size:1.5rem; font-weight:700; color:#fff;">${formatMoney(ingresos)}</div>
              </div>
            </div>`
      }
    } catch(e) { console.error(e) }
  },

  async cargarUltimos() {
    const listEl = document.getElementById('ultimosReg')
    if (!listEl) return

    try {
      const data = await PersonaModel.getUltimos(5)
      listEl.innerHTML = data && data.length
        ? data.map(p => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
            <div>
              <div style="font-weight:600; font-size:0.9rem; color:#fff;">${p.nombre}</div>
              <div style="color:#9ca3af; font-size:0.75rem;">${formatDate(p.fecha_registro)}</div>
            </div>
            <span style="font-size:0.75rem; font-weight:600; padding:3px 8px; border-radius:4px; background:${p.estado==='Activo'?'rgba(59,130,246,0.1)':'rgba(255,255,255,0.05)'}; color:${p.estado==='Activo'?'#3b82f6':'#9ca3af'}; border:1px solid ${p.estado==='Activo'?'rgba(59,130,246,0.2)':'rgba(255,255,255,0.1)'};">
              ${p.estado}
            </span>
          </div>`).join('')
        : '<p style="color:#9ca3af; font-size:0.85rem; text-align:center; padding:10px;">Sin registros en la base de datos.</p>'
    } catch(e) { console.error(e) }
  }
}
