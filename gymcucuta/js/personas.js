import { checkAuth, buildNavbar, showToast, formatMoney, formatDate, supabase } from './app.js'

// ===== SEGURIDAD Y NAVBAR =====
checkAuth()
document.getElementById('navbar-container').innerHTML = buildNavbar('personas.html')

// ===== USUARIO ACTUAL =====
const currentUser = JSON.parse(sessionStorage.getItem('gymUser'))

// ===== CARGAR PERSONAS =====
async function cargarPersonas() {

  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .order('id', { ascending: false })

  if (error) {
    console.error(error)
    showToast('❌ Error al cargar datos', '#f87171')
    return
  }

  const tbody = document.getElementById('tablaPersonas')
  const emptyMsg = document.getElementById('emptyMsg')
  const countLabel = document.getElementById('countLabel')

  if (!data || data.length === 0) {
    tbody.innerHTML = ''
    emptyMsg.style.display = 'block'
    countLabel.textContent = '0 miembros'
    return
  }

  emptyMsg.style.display = 'none'
  countLabel.textContent = `${data.length} miembros`

  tbody.innerHTML = data.map(p => `
    <tr>
      <td>
        <div style="display:flex;gap:10px;align-items:center">
          <div style="background:#38bdf8;color:#000;border-radius:50%;width:35px;height:35px;display:flex;align-items:center;justify-content:center;font-weight:bold">
            ${p.nombre ? p.nombre.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div style="font-weight:bold">${p.nombre}</div>
            <div style="font-size:12px;color:#aaa">${p.email || '-'}</div>
          </div>
        </div>
      </td>
      <td>${p.documento || '-'}</td>
      <td>${p.telefono || '-'}</td>
      <td>${p.plan_id || '-'}</td>
      <td>${formatMoney(p.mensualidad || 0)}</td>
      <td>${formatDate(p.fecha_inicio)}</td>
      <td>${p.estado || 'Activo'}</td>
      <td>
        <button onclick="openEdit(${p.id})">✏️</button>
        <button onclick="eliminar(${p.id})">🗑️</button>
      </td>
    </tr>
  `).join('')
}

// ===== ELIMINAR =====
window.eliminar = async function(id) {
  if (!confirm('¿Eliminar esta persona?')) return

  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    showToast('❌ Error al eliminar', '#f87171')
  } else {
    showToast('🗑️ Eliminado correctamente')
    cargarPersonas()
  }
}

// ===== EDITAR =====
window.openEdit = async function(id) {

  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(error)
    return
  }

  document.getElementById('e_id').value = data.id
  document.getElementById('e_nombre').value = data.nombre || ''
  document.getElementById('e_documento').value = data.documento || ''
  document.getElementById('e_telefono').value = data.telefono || ''
  document.getElementById('e_email').value = data.email || ''
  document.getElementById('e_plan').value = data.plan_id || 1
  document.getElementById('e_mensualidad').value = data.mensualidad || 0
  document.getElementById('e_estado').value = data.estado || 'Activo'
  document.getElementById('e_objetivo').value = data.objetivo || 'General'
  document.getElementById('e_entrenador').value = data.entrenador || ''
  document.getElementById('e_peso').value = data.peso || ''
  document.getElementById('e_altura').value = data.altura || ''
  document.getElementById('e_obs').value = data.observaciones || ''

  document.getElementById('editModal').style.display = 'flex'
}

// ===== CERRAR MODAL =====
window.closeEdit = function() {
  document.getElementById('editModal').style.display = 'none'
}

// ===== GUARDAR =====
window.guardarEdicion = async function() {

  const id = document.getElementById('e_id').value

  const datosActualizados = {
    nombre: document.getElementById('e_nombre').value,
    documento: document.getElementById('e_documento').value,
    telefono: document.getElementById('e_telefono').value,
    email: document.getElementById('e_email').value,
    plan_id: document.getElementById('e_plan').value,
    mensualidad: parseFloat(document.getElementById('e_mensualidad').value) || 0,
    estado: document.getElementById('e_estado').value,
    objetivo: document.getElementById('e_objetivo').value,
    entrenador: document.getElementById('e_entrenador').value,
    peso: parseFloat(document.getElementById('e_peso').value) || null,
    altura: parseFloat(document.getElementById('e_altura').value) || null,
    observaciones: document.getElementById('e_obs').value
  }

  const { error } = await supabase
    .from('personas')
    .update(datosActualizados)
    .eq('id', id)

  if (error) {
    console.error(error)
    showToast('❌ Error al guardar', '#f87171')
  } else {
    showToast('✅ Cambios guardados')
    closeEdit()
    cargarPersonas()
  }
}

// ===== VALIDACIONES (SOLO ADMIN) =====
if (currentUser?.rol === 'admin') {
  cargarSolicitudes()
}

// ===== CARGAR SOLICITUDES =====
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

// ===== RENDER SOLICITUDES =====
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
      <p><b>Email:</b> ${sol.email || '-'}</p>
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

  if (!confirm('¿Aprobar este entrenador?')) return

  const { data, error } = await supabase
    .from('solicitudes_entrenador')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error(error)
    showToast('❌ Error obteniendo solicitud', '#f87171')
    return
  }

  // Insertar como entrenador
  const { error: insertError } = await supabase
    .from('personas')
    .insert([{
      nombre: data.nombre,
      documento: data.documento,
      email: data.email,
      telefono: data.telefono,
      rol: 'entrenador',
      estado: 'Activo'
    }])

  if (insertError) {
    console.error(insertError)
    showToast('❌ Error al aprobar', '#f87171')
    return
  }

  // Actualizar estado
  await supabase
    .from('solicitudes_entrenador')
    .update({ estado: 'aprobado' })
    .eq('id', id)

  showToast('✅ Entrenador aprobado')
  cargarSolicitudes()
}

// ===== RECHAZAR =====
window.rechazarSolicitud = async function(id) {

  if (!confirm('¿Rechazar esta solicitud?')) return

  await supabase
    .from('solicitudes_entrenador')
    .update({ estado: 'rechazado' })
    .eq('id', id)

  showToast('❌ Solicitud rechazada')
  cargarSolicitudes()
}

// ===== INIT =====
cargarPersonas()