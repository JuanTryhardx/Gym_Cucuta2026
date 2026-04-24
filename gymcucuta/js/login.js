import { supabase } from './supabase.js'

// ─────────────────────────────────────────────
// SOLO SI EXISTE EL FORM
// ─────────────────────────────────────────────
if (document.getElementById('loginForm')) {

  window.togglePass = function () {
    const inp = document.getElementById('password')
    inp.type = inp.type === 'password' ? 'text' : 'password'
  }

  const form = document.getElementById('loginForm')

  form.addEventListener('submit', async function(e) {
    e.preventDefault()

    const user = document.getElementById('usuario').value.trim()
    const pass = document.getElementById('password').value
    const err = document.getElementById('errorMsg')

    try {

      // 🔍 BUSCAR EN PERSONAS (CLIENTES Y ENTRENADORES)
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('correo_electronico', user)
        .single()

      if (error || !data) {
        throw new Error('Usuario no encontrado')
      }

      // ⚠️ VALIDACIÓN SIMPLE (porque no tienes auth aún)
      // (Luego se mejora con hash)
      if (pass !== '1234') {
        throw new Error('Contraseña incorrecta')
      }

      // 🔐 GUARDAR SESIÓN COMPLETA
      sessionStorage.setItem('gymLoggedIn', 'true')
      sessionStorage.setItem('gymUser', JSON.stringify(data))

      // 🚀 REDIRECCIÓN
      window.location.href = 'inicio.html'

    } catch (errCatch) {
      console.error(errCatch)
      err.style.display = 'block'
      setTimeout(() => err.style.display = 'none', 3000)
    }

  })
}

// ─────────────────────────────────────────────
// MODAL REGISTRO (SCROLL FIX)
// ─────────────────────────────────────────────
function abrirRegistro() {
  document.body.classList.add("modal-open");
  document.getElementById("modalRegistro").classList.add("active");
}

function cerrarRegistro() {
  document.body.classList.remove("modal-open");
  document.getElementById("modalRegistro").classList.remove("active");
}