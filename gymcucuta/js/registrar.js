import { checkAuth, buildNavbar } from './app.js'
import { supabase } from './supabase.js'

// seguridad
checkAuth()

// navbar
document.getElementById('navbar-container').innerHTML = buildNavbar('registrar.html')

// función global
window.registrarPersona = async function () {

  const nombre = document.getElementById('r_nombre').value.trim()
  const documento = document.getElementById('r_documento').value.trim()
  const plan_id = document.getElementById('r_plan').value
  const mensualidad = document.getElementById('r_mensualidad').value
  const fecha_inicio = document.getElementById('r_inicio').value

  if (!nombre || !documento) {
    alert('⚠️ Nombre y documento son obligatorios')
    return
  }

  const { error } = await supabase
    .from('personas')
    .insert([
      {
        nombre,
        documento,
        plan_id,
        mensualidad: parseFloat(mensualidad) || 0,
        fecha_inicio,
        estado: 'Activo'
      }
    ])

  if (error) {
    console.error(error)
    alert('❌ Error al registrar')
  } else {
    alert('✅ Registrado correctamente 🔥')
    limpiarForm()
  }
}

// limpiar form
window.limpiarForm = function () {
  document.getElementById('r_nombre').value = ''
  document.getElementById('r_documento').value = ''
  document.getElementById('r_mensualidad').value = ''
  document.getElementById('r_inicio').value = ''
}