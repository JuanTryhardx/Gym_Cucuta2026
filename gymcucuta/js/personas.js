import { checkAuth, buildNavbar } from './app.js'
import { supabase } from './supabase.js'

// seguridad
checkAuth()

// navbar
document.getElementById('navbar-container').innerHTML = buildNavbar('personas.html')

// cargar personas
async function cargarPersonas() {
  const { data, error } = await supabase
    .from('personas')
    .select('*')

  if (error) {
    console.error(error)
    return
  }

  const tbody = document.getElementById('tablaPersonas')
  const emptyMsg = document.getElementById('emptyMsg')
  const countLabel = document.getElementById('countLabel')

  if (!data || data.length === 0) {
    emptyMsg.style.display = 'block'
    tbody.innerHTML = ''
    countLabel.textContent = '0 miembros'
    return
  }

  emptyMsg.style.display = 'none'
  countLabel.textContent = `${data.length} miembros`

  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.nombre}</td>
      <td>${p.documento}</td>
      <td>-</td>
      <td>${p.plan_id}</td>
      <td>${p.mensualidad || 0}</td>
      <td>${p.fecha_inicio || '-'}</td>
      <td>${p.estado}</td>
      <td>
        <button onclick="eliminar(${p.id})">🗑️</button>
      </td>
    </tr>
  `).join('')
}

// eliminar
window.eliminar = async function(id) {
  if (!confirm('¿Eliminar este miembro?')) return

  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('❌ Error al eliminar')
  } else {
    alert('🗑️ Eliminado correctamente')
    cargarPersonas()
  }
}

// ejecutar
cargarPersonas()