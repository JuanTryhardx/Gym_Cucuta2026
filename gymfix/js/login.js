import { supabase } from './supabase.js'

if (document.getElementById('loginForm')) {

  window.togglePass = function() {
    const inp = document.getElementById('password')
    const btn = document.getElementById('togglePassBtn')
    const isPass = inp.type === 'password'
    inp.type = isPass ? 'text' : 'password'
    btn.textContent = isPass ? '🙈' : '👁'
  }

  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault()
    const emailVal = document.getElementById('usuario').value.trim()
    const passVal  = document.getElementById('password').value
    const btn      = document.getElementById('btnLogin')
    const err      = document.getElementById('errorMsg')

    btn.disabled = true
    btn.textContent = 'VERIFICANDO...'
    err.style.display = 'none'

    try {
      // Buscar en personas por email
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('email', emailVal)
        .single()

      if (error || !data) throw new Error('Usuario no encontrado')

      // Verificar contraseña — soporta cuentas antiguas (password null → usa '1234')
      const passwordGuardado = data.password
      const passwordValido   = passwordGuardado
        ? passVal === passwordGuardado
        : passVal === '1234'

      if (!passwordValido) throw new Error('Contraseña incorrecta')
      if (data.estado && data.estado.toLowerCase() === 'inactivo') throw new Error('Cuenta inactiva')

      sessionStorage.setItem('gymLoggedIn', 'true')
      sessionStorage.setItem('gymUser', JSON.stringify(data))
      window.location.href = 'inicio.html'

    } catch (errCatch) {
      console.error(errCatch)
      document.getElementById('errorMsgText').textContent = errCatch.message || 'Usuario o contraseña incorrectos'
      err.style.display = 'flex'
      setTimeout(() => { err.style.display = 'none' }, 4000)
    } finally {
      btn.disabled = false
      btn.textContent = 'INGRESAR AL SISTEMA'
    }
  })
}
