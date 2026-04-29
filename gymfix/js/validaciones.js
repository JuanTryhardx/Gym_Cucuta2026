import { checkAuth, buildNavbar, showToast, supabase } from './app.js'

// ===== SEGURIDAD =====
checkAuth()

// ===== NAVBAR =====
document.getElementById('navbar-container').innerHTML = buildNavbar('validaciones.html')

// ===== CARGAR SOLICITUDES =====
async function cargarSolicitudes() {

  const cont = document.getElementById('lista-solicitudes')
  const badge = document.getElementById('contador-badge')

  cont.innerHTML = '<p>⏳ Cargando solicitudes...</p>'

  const { data, error } = await supabase
    .from('solicitudes_entrenador')
    .select('*')
    .ilike('estado', 'pendiente')
    .order('fecha_solicitud', { ascending: false })

  if (error) {
    console.error(error)
    showToast('❌ Error cargando solicitudes', '#f87171')
    cont.innerHTML = '<p>❌ No se pudieron cargar las solicitudes.</p>'
    return
  }

  if (badge) {
    badge.textContent = data.length === 0
      ? 'Sin pendientes'
      : `${data.length} pendiente${data.length > 1 ? 's' : ''}`
  }

  renderSolicitudes(data || [])
}

// ===== RENDER =====
function renderSolicitudes(lista) {

  const cont = document.getElementById('lista-solicitudes')
  if (!cont) return

  if (lista.length === 0) {
    cont.innerHTML = '<p>✅ No hay solicitudes pendientes en este momento.</p>'
    return
  }

  cont.innerHTML = lista.map(sol => `
    <div class="card-solicitud">
      <h3>👤 ${sol.nombre || 'Sin nombre'}</h3>
      <p><b>Documento:</b> ${sol.documento || '-'}</p>
      <p><b>Email:</b> ${sol.email || '-'}</p>
      <p><b>Teléfono:</b> ${sol.telefono || '-'}</p>
      <p><b>Especialidad:</b> ${sol.especialidad || '-'}</p>
      <p><b>Fecha solicitud:</b> ${sol.fecha_solicitud ? new Date(sol.fecha_solicitud).toLocaleDateString('es-CO') : '-'}</p>
      <div class="acciones">
        <button onclick="aprobarSolicitud(${sol.id})">✅ Aceptar</button>
        <button onclick="rechazarSolicitud(${sol.id})">❌ Rechazar</button>
      </div>
    </div>
  `).join('')
}

// ===== APROBAR =====
window.aprobarSolicitud = async function(id) {

  if (!confirm('¿Confirmas aprobar a este entrenador?')) return

  const { data, error: fetchError } = await supabase
    .from('solicitudes_entrenador')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !data) {
    showToast('❌ No se encontró la solicitud', '#f87171')
    return
  }

  const { error: insertError } = await supabase.from('personas').insert([{
    nombre: data.nombre,
    documento: data.documento,
    email: data.email,
    telefono: data.telefono,
    rol: 'entrenador',
    estado: 'Activo'
  }])

  if (insertError) {
    console.error(insertError)
    showToast('❌ Error al crear la persona', '#f87171')
    return
  }

  await supabase
    .from('solicitudes_entrenador')
    .update({ estado: 'aprobado' })
    .eq('id', id)

  showToast('✅ Entrenador aprobado correctamente', '#22c55e')
  cargarSolicitudes()
}

// ===== RECHAZAR =====
window.rechazarSolicitud = async function(id) {

  if (!confirm('¿Confirmas rechazar esta solicitud?')) return

  const { error } = await supabase
    .from('solicitudes_entrenador')
    .update({ estado: 'rechazado' })
    .eq('id', id)

  if (error) {
    console.error(error)
    showToast('❌ Error al rechazar', '#f87171')
    return
  }

  showToast('❌ Solicitud rechazada', '#f87171')
  cargarSolicitudes()
}

// ===== INIT =====
cargarSolicitudes()
