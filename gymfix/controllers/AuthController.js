// ============================================================
// controllers/AuthController.js - VERSIÓN OPTIMIZADA GYM CÚCUTA
// ============================================================
import { Auth }         from '../services/auth.js'
import { showToast }    from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'
import { SolicitudModel } from '../models/SolicitudModel.js'

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
    // Ya no cargamos planes aquí porque los quitamos del HTML
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
    
    const secEntrenador = document.getElementById('seccionEntrenador')
    const info     = document.getElementById('rolInfo')
    const infoIcon = document.getElementById('rolInfoIcon')
    const infoText = document.getElementById('rolInfoText')
    const btnReg   = document.getElementById('btnRegistrar')

    if (rol === 'entrenador') {
      secEntrenador.style.display = 'block'
      info.className = 'rol-info warning'
      infoIcon.textContent = '⏳'
      infoText.textContent = 'Tu solicitud quedará pendiente hasta que el administrador la apruebe.'
      btnReg.textContent = 'ENVIAR SOLICITUD'
    } else {
      secEntrenador.style.display = 'none'
      info.className = 'rol-info'
      infoIcon.textContent = '✅'
      infoText.textContent = 'Tu cuenta se activará de inmediato al registrarte.'
      btnReg.textContent = 'CREAR CUENTA'
    }
  },

  _mostrarError(msg) {
    const box = document.getElementById('errorMsgReg')
    const txt = document.getElementById('errorMsgText')
    if(txt) txt.textContent = msg
    if(box) {
        box.style.display = 'flex'
        // Auto scroll al error para que el usuario lo vea
        box.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => { box.style.display = 'none' }, 5000)
    }
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
    
    try {
      const nombre     = document.getElementById('reg_nombre').value.trim()
      const documento  = document.getElementById('reg_documento').value.trim()
      const email      = document.getElementById('reg_email').value.trim()
      const password   = document.getElementById('reg_password').value
      const passConf   = document.getElementById('reg_password_confirm').value
      
      // Datos opcionales
      const telefono   = document.getElementById('reg_telefono').value.trim()
      const nacimiento = document.getElementById('reg_nacimiento').value || null
      const genero     = document.getElementById('reg_genero').value

      if (!nombre)    { this._mostrarError('El nombre es obligatorio'); return }
      if (!documento) { this._mostrarError('El documento es obligatorio'); return }
      if (!email)     { this._mostrarError('El email es obligatorio'); return }
      if (!password)  { this._mostrarError('La contraseña es obligatoria'); return }
      if (password.length < 6) { this._mostrarError('Mínimo 6 caracteres'); return }
      if (password !== passConf) { this._mostrarError('Las contraseñas no coinciden'); return }

      btn.disabled = true
      btn.textContent = 'PROCESANDO...'

      const dupDoc   = await PersonaModel.getByDocumento(documento)
      if (dupDoc.length > 0) { throw new Error('Ya existe una cuenta con ese documento') }
      
      const dupEmail = await PersonaModel.getByEmail(email)
      if (dupEmail.length > 0) { throw new Error('Ya existe una cuenta con ese email') }

      const base = { 
        nombre, documento, email, telefono, nacimiento, genero, password,
        rol: rol,
        fecha_registro: new Date().toISOString()
      }

      if (rol === 'cliente') {
        // Registro directo como Cliente (sin plan obligatorio por ahora)
        await PersonaModel.insert({
          ...base, 
          plan_id: null, 
          objetivo: 'General', 
          estado: 'Activo',
          fecha_inicio: new Date().toISOString().split('T')[0]
        })
        this._mostrarExito('✅', '¡Registro exitoso!', `Bienvenido/a ${nombre}. Ya puedes iniciar sesión.`)
      } else {
        // Registro como solicitud de Entrenador
        const especialidad = document.getElementById('reg_especialidad').value.trim()
        if (!especialidad) { throw new Error('La especialidad es obligatoria para entrenadores') }
        
        await SolicitudModel.insert({
          ...base,
          especialidad,
          estado: 'Pendiente'
        })
        this._mostrarExito('⏳', 'Solicitud enviada', `Hola ${nombre}, tu perfil de entrenador será revisado por el administrador.`)
      }

    } catch(ex) {
      this._mostrarError(ex.message)
    } finally {
      btn.disabled = false
      btn.textContent = rol === 'entrenador' ? 'ENVIAR SOLICITUD' : 'CREAR CUENTA'
    }
  }
}
