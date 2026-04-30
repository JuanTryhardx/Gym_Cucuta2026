import { checkAuth, buildNavbar, showToast, supabase } from './app.js'

checkAuth()
document.getElementById('navbar-container').innerHTML = buildNavbar('validaciones.html')

let todasLasSolicitudes = []
let filtroActual = 'pendiente'

// ===== CARGAR =====
async function cargarSolicitudes() {
  const tbody = document.getElementById('tbody-validaciones')
  const empty = document.getElementById('emptyMsg')
  tbody.innerHTML = `<tr><td colspan="7" class="val-loading">⏳ Cargando solicitudes...</td></tr>`
  empty.style.display = 'none'

  const { data, error } = await supabase
    .from('solicitudes_entrenador')
    .select('*')
    .order('fecha_solicitud', { ascending: false })

  if (error) {
    console.error('Error SELECT:', error)
    showToast('❌ Error cargando solicitudes', '#f87171')
    tbody.innerHTML = `<tr><td colspan="7" class="val-loading">❌ No se pudieron cargar las solicitudes.</td></tr>`
    return
  }

  todasLasSolicitudes = data || []
  actualizarStats()
  renderTabla()
}

// ===== STATS =====
function actualizarStats() {
  const p = todasLasSolicitudes.filter(s => (s.estado || '').toLowerCase() === 'pendiente').length
  const a = todasLasSolicitudes.filter(s => (s.estado || '').toLowerCase() === 'aprobado').length
  const r = todasLasSolicitudes.filter(s => (s.estado || '').toLowerCase() === 'rechazado').length
  document.getElementById('stat-pendientes').textContent = p
  document.getElementById('stat-aprobados').textContent  = a
  document.getElementById('stat-rechazados').textContent = r
  const badge = document.getElementById('contador-badge')
  if (badge) badge.textContent = p === 0 ? '✓ Sin pendientes' : `${p} pendiente${p > 1 ? 's' : ''}`
}

// ===== RENDER =====
function renderTabla() {
  const tbody = document.getElementById('tbody-validaciones')
  const empty = document.getElementById('emptyMsg')
  const label = document.getElementById('countLabel')

  const lista = filtroActual === 'todos'
    ? todasLasSolicitudes
    : todasLasSolicitudes.filter(s => (s.estado || '').toLowerCase() === filtroActual)

  label.textContent = `${lista.length} solicitud${lista.length !== 1 ? 'es' : ''}`

  if (lista.length === 0) {
    tbody.innerHTML = ''
    empty.style.display = 'block'
    return
  }
  empty.style.display = 'none'

  tbody.innerHTML = lista.map(sol => {
    const inicial   = sol.nombre ? sol.nombre.charAt(0).toUpperCase() : '?'
    const estado    = (sol.estado || 'pendiente').toLowerCase()
    const fecha     = sol.fecha_solicitud
      ? new Date(sol.fecha_solicitud).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })
      : '-'
    const pillClass = estado === 'aprobado' ? 'pill-aprobado' : estado === 'rechazado' ? 'pill-rechazado' : 'pill-pendiente'
    const pillIcon  = estado === 'aprobado' ? '✅' : estado === 'rechazado' ? '❌' : '⏳'
    const btns      = estado === 'pendiente'
      ? `<button class="btn-val-aprobar"  onclick="aprobarSolicitud(${sol.id})">✅ Aprobar</button>
         <button class="btn-val-rechazar" onclick="rechazarSolicitud(${sol.id})">❌ Rechazar</button>`
      : `<span style="color:var(--text-muted);font-size:0.8rem;padding:0 6px">—</span>`

    return `<tr>
      <td><div class="val-name-cell">
        <div class="val-avatar">${inicial}</div>
        <div><div class="val-name">${sol.nombre || 'Sin nombre'}</div>
             <div class="val-email">${sol.email || '-'}</div></div>
      </div></td>
      <td>${sol.documento || '-'}</td>
      <td>${sol.telefono || '-'}</td>
      <td>${sol.especialidad || '-'}</td>
      <td>${fecha}</td>
      <td><span class="pill ${pillClass}">${pillIcon} ${sol.estado || 'pendiente'}</span></td>
      <td><div class="acciones-cell">${btns}
        <button class="btn-val-ver" onclick="verDetalle(${sol.id})">👁 Ver</button>
      </div></td>
    </tr>`
  }).join('')
}

// ===== FILTRO =====
window.setFiltro = function(filtro) {
  filtroActual = filtro
  document.querySelectorAll('.val-tab').forEach(t => t.classList.toggle('active', t.dataset.filter === filtro))
  renderTabla()
}

// ===== DETALLE MODAL =====
window.verDetalle = function(id) {
  const sol = todasLasSolicitudes.find(s => s.id === id)
  if (!sol) return
  const fecha = sol.fecha_solicitud
    ? new Date(sol.fecha_solicitud).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' })
    : '-'
  document.getElementById('detalle-content').innerHTML = `
    <div class="detalle-item"><label>Nombre</label><span>${sol.nombre || '-'}</span></div>
    <div class="detalle-item"><label>Documento</label><span>${sol.documento || '-'}</span></div>
    <div class="detalle-item"><label>Email</label><span>${sol.email || '-'}</span></div>
    <div class="detalle-item"><label>Teléfono</label><span>${sol.telefono || '-'}</span></div>
    <div class="detalle-item"><label>Especialidad</label><span>${sol.especialidad || '-'}</span></div>
    <div class="detalle-item"><label>Fecha solicitud</label><span>${fecha}</span></div>
    <div class="detalle-item full-width"><label>Estado</label><span>${sol.estado || 'pendiente'}</span></div>`
  const estado = (sol.estado || 'pendiente').toLowerCase()
  const btnA = document.getElementById('btn-aprobar-modal')
  const btnR = document.getElementById('btn-rechazar-modal')
  if (estado === 'pendiente') {
    btnA.style.display = 'inline-flex'; btnR.style.display = 'inline-flex'
    btnA.onclick = () => { closeDetalle(); aprobarSolicitud(id) }
    btnR.onclick = () => { closeDetalle(); rechazarSolicitud(id) }
  } else {
    btnA.style.display = 'none'; btnR.style.display = 'none'
  }
  document.getElementById('detalleModal').style.display = 'flex'
}
window.closeDetalle = () => { document.getElementById('detalleModal').style.display = 'none' }

// ===== APROBAR =====
window.aprobarSolicitud = async function(id) {
  if (!confirm('¿Confirmas aprobar a este entrenador?')) return

  const sol = todasLasSolicitudes.find(s => s.id === id)
  if (!sol) { showToast('❌ Solicitud no encontrada', '#f87171'); return }

  // 1. Crear en personas
  const { error: insertError } = await supabase.from('personas').insert([{
    nombre: sol.nombre, documento: sol.documento,
    email: sol.email, telefono: sol.telefono,
    rol: 'entrenador', estado: 'Activo',
    password: sol.password || null
  }])

  if (insertError) {
    console.error('Error INSERT personas:', insertError)
    showToast('❌ Error al crear el perfil: ' + insertError.message, '#f87171')
    return
  }

  // 2. Actualizar estado — usando el id exacto
  const { data: updated, error: updError } = await supabase
    .from('solicitudes_entrenador')
    .update({ estado: 'aprobado', fecha_resolucion: new Date().toISOString() })
    .eq('id', id)
    .select()

  if (updError) {
    console.error('Error UPDATE aprobado:', updError)
    showToast('⚠️ Perfil creado pero no se actualizó el estado: ' + updError.message, '#fbbf24')
    return
  }

  console.log('Aprobado OK:', updated)
  showToast('✅ Entrenador aprobado y perfil creado', '#22c55e')
  await cargarSolicitudes()
}

// ===== RECHAZAR =====
window.rechazarSolicitud = async function(id) {
  if (!confirm('¿Confirmas rechazar esta solicitud?')) return

  const { data: updated, error } = await supabase
    .from('solicitudes_entrenador')
    .update({ estado: 'rechazado', fecha_resolucion: new Date().toISOString() })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error UPDATE rechazado:', error)
    showToast('❌ Error al rechazar: ' + error.message, '#f87171')
    return
  }

  console.log('Rechazado OK:', updated)
  showToast('🚫 Solicitud rechazada', '#f87171')
  await cargarSolicitudes()
}

cargarSolicitudes()
