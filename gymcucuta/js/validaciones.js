import { checkAuth, buildNavbar, showToast, supabase } from './app.js'

// ===== SEGURIDAD =====
checkAuth()

// ===== NAVBAR =====
document.getElementById('navbar-container').innerHTML = buildNavbar('validaciones.html')

// ===== VALIDACIONES =====
async function cargarSolicitudes() {

  const { data, error } = await supabase
    .from('solicitudes_entrenador')
    .select('*')
    .ilike('estado', 'pendiente')
    .order('fecha_solicitud', { ascending: false })

  if (error) {
    console.error(error)
    showToast('❌ Error cargando solicitudes', '#f87171')
    return
  }

  renderSolicitudes(data || [])
}

// ===== RENDER =====
function renderSolicitudes(lista) {

  const cont = document.getElementById('lista-solicitudes')

  if (!cont) return

  if (lista.length === 0) {
    cont.innerHTML = '<p>No hay solicitudes pendientes</p>'
    return
  }

  cont.innerHTML = lista.map(sol => `
    <div class="card-solicitud">
      <h3>${sol.nombre}</h3>
      <p><b>Documento:</b> ${sol.documento}</p>
      <p><b>Email:</b> ${sol.email}</p>
      <p><b>Especialidad:</b> ${sol.especialidad}</p>

      <div class="acciones">
        <button onclick="aprobarSolicitud(${sol.id})">Aceptar</button>
        <button onclick="rechazarSolicitud(${sol.id})">Rechazar</button>
      </div>
    </div>
  `).join('')
}

// ===== APROBAR =====
window.aprobarSolicitud = async function(id) {

  const { data } = await supabase
    .from('solicitudes_entrenador')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) return

  await supabase.from('personas').insert([{
    nombre: data.nombre,
    documento: data.documento,
    email: data.email,
    telefono: data.telefono,
    rol: 'entrenador',
    estado: 'Activo'
  }])

  await supabase
    .from('solicitudes_entrenador')
    .update({ estado: 'aprobado' })
    .eq('id', id)

  showToast('✅ Aprobado')
  cargarSolicitudes()
}

// ===== RECHAZAR =====
window.rechazarSolicitud = async function(id) {

  await supabase
    .from('solicitudes_entrenador')
    .update({ estado: 'rechazado' })
    .eq('id', id)

  showToast('❌ Rechazado')
  cargarSolicitudes()
}

// ===== INIT =====
cargarSolicitudes()