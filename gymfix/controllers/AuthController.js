// ============================================================
// controllers/AuthController.js
// Controla login y registro de usuarios.
// ============================================================
import { Auth }         from '../services/auth.js'
import { showToast }    from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'
import { SolicitudModel } from '../models/SolicitudModel.js'
import { PlanModel }    from '../models/PlanModel.js'

export const AuthController = {

  // ── LOGIN ────────────────────────────────────────────────
  initLogin() {
    const form = document.getElementById('loginForm')
    if (!form) return

    window.togglePass = function() {
      const inp = document.getElementById('password')
      const btn = document.getElementById('togglePassBtn')
      const isPass = inp.type === 'password'
      inp.type = isPass ? 'text' : 'password'
      btn.textContent = isPass ? '🙈' : '👁'
    }

    form.addEventListener('submit', async function(e) {
      e.preventDefault()
      const btn = document.getElementById('btnLogin')
      const err = document.getElementById('errorMsg')
      btn.disabled = true
      btn.textContent = 'VERIFICANDO...'
      err.style.display = 'none'
      try {
        await Auth.login(
          document.getElementById('usuario').value.trim(),
          document.getElementById('password').value
        )
        window.location.href = 'inicio.html'
      } catch (ex) {
        document.getElementById('errorMsgText').textContent = ex.message
        err.style.display = 'flex'
        setTimeout(() => { err.style.display = 'none' }, 4000)
      } finally {
        btn.disabled = false
        btn.textContent = 'INGRESAR AL SISTEMA'
      }
    })
  },

  // ── REGISTRO ─────────────────────────────────────────────
  async initRegistro() {
    await this._cargarPlanes()

    window.setRol = (rol) => this._setRol(rol)
    window.registrarUsuario = () => this._registrar()
    window.togglePassReg = (id, btn) => {
      const inp = document.getElementById(id)
      const isPass = inp.type === 'password'
      inp.type = isPass ? 'text' : 'password'
      btn.textContent = isPass ? '🙈' : '👁'
    }
    window.checkPasswordStrength = () => this._checkStrength()
  },

  _setRol(rol) {
    this._rolActual = rol
    document.getElementById('btnCliente').classList.toggle('active', rol === 'cliente')
    document.getElementById('btnEntrenador').classList.toggle('active', rol === 'entrenador')
    const secCliente    = document.getElementById('seccionCliente')
    const secEntrenador = document.getElementById('seccionEntrenador')
    const info     = document.getElementById('rolInfo')
    const infoIcon = document.getElementById('rolInfoIcon')
    const infoText = document.getElementById('rolInfoText')
    if (rol === 'entrenador') {
      secCliente.style.display    = 'none'
      secEntrenador.style.display = 'block'
      info.className = 'rol-info warning'
      infoIcon.textContent = '⏳'
      infoText.textContent = 'Tu solicitud quedará pendiente hasta que el administrador la apruebe.'
      document.getElementById('btnRegistrar').textContent = 'ENVIAR SOLICITUD'
    } else {
      secCliente.style.display    = 'block'
      secEntrenador.style.display = 'none'
      info.className = 'rol-info'
      infoIcon.textContent = '✅'
      infoText.textContent = 'Tu cuenta se activará de inmediato al registrarte.'
      document.getElementById('btnRegistrar').textContent = 'CREAR CUENTA'
    }
  },

  async _cargarPlanes() {
    try {
      const planes = await PlanModel.getAll()
      const select = document.getElementById('reg_plan')
      if (!select) return
      select.innerHTML = '<option value="">— Selecciona un plan —</option>'
      planes.forEach(p => {
        const opt = document.createElement('option')
        opt.value = p.id
        opt.textContent = `${p.nombre}${p.precio ? ' — $' + Number(p.precio).toLocaleString('es-CO') : ''}`
        select.appendChild(opt)
      })
    } catch(e) { console.error(e) }
  },

  _mostrarError(msg) {
    const box = document.getElementById('errorMsgReg')
    document.getElementById('errorMsgText').textContent = msg
    box.style.display = 'flex'
    setTimeout(() => { box.style.display = 'none' }, 5000)
  },

  _mostrarExito(icon, titulo, mensaje) {
    document.getElementById('exitoIcon').textContent    = icon
    document.getElementById('exitoTitulo').textContent  = titulo
    document.getElementById('exitoMensaje').textContent = mensaje
    document.getElementById('modalExito').style.display = 'flex'
  },

  _checkStrength() {
    const pass = document.getElementById('reg_password').value
    const bar  = document.getElementById('passStrengthBar')
    const txt  = document.getElementById('passStrengthText')
    if (!bar) return
    let score = 0
    if (pass.length >= 6) score++
    if (pass.length >= 10) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    const levels = [
      { color: '#f87171', text: 'Muy débil',  width: '20%' },
      { color: '#fb923c', text: 'Débil',      width: '40%' },
      { color: '#fbbf24', text: 'Regular',    width: '60%' },
      { color: '#4ade80', text: 'Fuerte',     width: '80%' },
      { color: '#22c55e', text: 'Muy fuerte', width: '100%' },
    ]
    const lvl = levels[Math.max(0, score - 1)] || levels[0]
    bar.style.width = pass.length === 0 ? '0%' : lvl.width
    bar.style.background = lvl.color
    txt.textContent = pass.length === 0 ? '' : lvl.text
    txt.style.color = lvl.color
  },

  async _registrar() {
    const rol = this._rolActual || 'cliente'
    const btn = document.getElementById('btnRegistrar')
    btn.disabled = true
    btn.textContent = rol === 'entrenador' ? 'Enviando...' : 'Registrando...'
    try {
      const nombre     = document.getElementById('reg_nombre').value.trim()
      const documento  = document.getElementById('reg_documento').value.trim()
      const email      = document.getElementById('reg_email').value.trim()
      const telefono   = document.getElementById('reg_telefono').value.trim()
      const nacimiento = document.getElementById('reg_nacimiento').value || null
      const genero     = document.getElementById('reg_genero').value
      const password   = document.getElementById('reg_password').value
      const passConf   = document.getElementById('reg_password_confirm').value

      if (!nombre)    { this._mostrarError('El nombre es obligatorio'); return }
      if (!documento) { this._mostrarError('El documento es obligatorio'); return }
      if (!email)     { this._mostrarError('El email es obligatorio'); return }
      if (!password)  { this._mostrarError('La contraseña es obligatoria'); return }
      if (password.length < 6) { this._mostrarError('Mínimo 6 caracteres'); return }
      if (password !== passConf) { this._mostrarError('Las contraseñas no coinciden'); return }

      const dupDoc   = await PersonaModel.getByDocumento(documento)
      if (dupDoc.length > 0) { this._mostrarError('Ya existe una cuenta con ese documento'); return }
      const dupEmail = await PersonaModel.getByEmail(email)
      if (dupEmail.length > 0) { this._mostrarError('Ya existe una cuenta con ese email'); return }

      const base = { nombre, documento, email, telefono, nacimiento, genero, password }

      if (rol === 'cliente') {
        const plan_id  = parseInt(document.getElementById('reg_plan').value)
        const objetivo = document.getElementById('reg_objetivo').value
        if (!plan_id) { this._mostrarError('Debes seleccionar un plan'); return }
        await PersonaModel.insert({
          ...base, plan_id, objetivo, estado: 'Activo',
          fecha_registro: new Date().toISOString(),
          fecha_inicio:   new Date().toISOString().split('T')[0],
        })
        this._mostrarExito('✅', '¡Registro exitoso!', `Bienvenido/a ${nombre}. Ya puedes iniciar sesión.`)
      } else {
        const especialidad = document.getElementById('reg_especialidad').value.trim()
        const motivacion   = document.getElementById('reg_motivacion').value.trim()
        if (!especialidad) { this._mostrarError('La especialidad es obligatoria'); return }
        const existe = await SolicitudModel.existePendiente(documento)
        if (existe) { this._mostrarError('Ya tienes una solicitud pendiente'); return }
        await SolicitudModel.insert({
          ...base, especialidad, motivacion: motivacion || null,
          estado: 'pendiente', fecha_solicitud: new Date().toISOString(),
        })
        this._mostrarExito('⏳', 'Solicitud enviada', 'Tu solicitud será revisada por el administrador.')
      }
    } catch(ex) {
      console.error(ex)
      this._mostrarError('Error inesperado: ' + ex.message)
    } finally {
      btn.disabled = false
      btn.textContent = (this._rolActual || 'cliente') === 'entrenador' ? 'ENVIAR SOLICITUD' : 'CREAR CUENTA'
    }
  },

  _rolActual: 'cliente'
}
