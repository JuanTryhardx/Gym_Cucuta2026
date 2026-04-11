import { checkAuth, buildNavbar, showToast, formatMoney, formatDate, supabase } from './app.js'

// ===== INICIO =====
checkAuth()
document.getElementById('navbar-container').innerHTML = buildNavbar('registrar.html')

// ===== REGISTRAR PERSONA =====
window.registrarPersona = async function () {

  const nombre    = document.getElementById('r_nombre').value.trim()
  const documento = document.getElementById('r_documento').value.trim()
  const plan_id   = parseInt(document.getElementById('r_plan').value)

  // ===== VALIDACIONES =====
  if (!nombre || !documento) {
    showToast('⚠️ Nombre y documento son obligatorios', '#fbbf24')
    return
  }

  if (!plan_id) {
    showToast('⚠️ Debes seleccionar un plan', '#fbbf24')
    return
  }

  // ===== VALIDAR DUPLICADOS =====
  const { data: existe, error: errorCheck } = await supabase
    .from('personas')
    .select('id')
    .eq('documento', documento)

  if (errorCheck) {
    console.error(errorCheck)
    showToast('❌ Error verificando datos', '#f87171')
    return
  }

  if (existe.length > 0) {
    showToast('⚠️ Este documento ya está registrado', '#f87171')
    return
  }

  // ===== CREAR OBJETO =====
  const persona = {
    nombre,
    documento,
    nacimiento:    document.getElementById('r_nacimiento').value || null,
    genero:        document.getElementById('r_genero').value,
    telefono:      document.getElementById('r_telefono').value.trim(),
    email:         document.getElementById('r_email').value.trim(),
    direccion:     document.getElementById('r_direccion').value.trim(),
    plan_id,
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
  }

  // ===== INSERTAR EN SUPABASE =====
  const { error } = await supabase
    .from('personas')
    .insert([persona])

  if (error) {
    console.error(error)
    showToast('❌ Error: ' + error.message, '#f87171')
    return
  }

  // ===== ÉXITO =====
  showToast('✅ ¡Miembro registrado correctamente! 🔥')

  limpiarForm()
  cargarStats()
  cargarUltimos()

  // ===== REDIRECCIÓN PRO =====
  setTimeout(() => {
    window.location.href = 'personas.html'
  }, 1200)
}

// ===== LIMPIAR FORM =====
window.limpiarForm = function () {
  [
    'r_nombre','r_documento','r_nacimiento','r_telefono','r_email',
    'r_direccion','r_mensualidad','r_inicio','r_entrenador',
    'r_peso','r_altura','r_emergencia','r_obs'
  ].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.value = ''
  })
}

// ===== STATS =====
async function cargarStats() {
  const { data } = await supabase
    .from('personas')
    .select('estado, mensualidad')

  if (!data) return

  const total   = data.length
  const activos = data.filter(p => p.estado === 'Activo').length
  const ingresos = data.reduce((s,p) => s + (parseFloat(p.mensualidad)||0), 0)

  document.getElementById('regStats').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-label">Total Miembros</div>
        <div class="stat-value">${total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-label">Activos</div>
        <div class="stat-value" style="color:#4ade80">${activos}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-label">Ingresos Proyectados</div>
        <div class="stat-value" style="font-size:1.2rem">${formatMoney(ingresos)}</div>
      </div>
    </div>`
}




// ===== ÚLTIMOS REGISTROS =====
async function cargarUltimos() {
  const { data } = await supabase
    .from('personas')
    .select('nombre, estado, fecha_registro')
    .order('id', { ascending: false })
    .limit(5)

  if (!data) return

  document.getElementById('ultimosReg').innerHTML = data.length
    ? data.map(p => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(56,189,248,0.07)">
        <div>
          <div style="font-weight:700;font-size:0.88rem">${p.nombre}</div>
          <div style="color:var(--text-muted);font-size:0.75rem">${formatDate(p.fecha_registro)}</div>
        </div>
        <span class="badge ${p.estado==='Activo'?'badge-active':'badge-inactive'}">${p.estado}</span>
      </div>
    `).join('')
    : '<p style="color:var(--text-muted);font-size:0.85rem">Sin registros aún.</p>'
}

// ===== INIT =====
cargarStats()
cargarUltimos()