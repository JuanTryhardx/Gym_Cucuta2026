// ============================================================
// services/auth.js
// Manejo de sesión: login, logout, verificación de auth.
// ============================================================
import { supabase } from './supabase.js'

export const Auth = {

  /** Busca usuario por email y valida contraseña */
  async login(email, password) {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) throw new Error('Usuario no encontrado')

    const passwordValido = data.password
      ? password === data.password
      : password === '1234'                    // fallback cuentas antiguas

    if (!passwordValido)                        throw new Error('Contraseña incorrecta')
    if ((data.estado || '').toLowerCase() === 'inactivo') throw new Error('Cuenta inactiva')

    sessionStorage.setItem('gymLoggedIn', 'true')
    sessionStorage.setItem('gymUser', JSON.stringify(data))
    return data
  },

  logout() {
    sessionStorage.clear()
    window.location.href = '../views/index.html'
  },

  /** Redirige al login si no hay sesión activa */
  requireAuth() {
    if (!sessionStorage.getItem('gymLoggedIn')) {
      window.location.href = '../views/index.html'
    }
  },

  getUser() {
    const raw = sessionStorage.getItem('gymUser')
    return raw ? JSON.parse(raw) : null
  },

  getRol() {
    return this.getUser()?.rol || 'cliente'
  }
}
