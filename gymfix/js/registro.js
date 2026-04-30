import { supabase } from './supabase.js'

let rolActual = 'cliente'

window.setRol = function(rol) {
  rolActual = rol
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
}

async function cargarPlanes() {
  const { data, error } = await supabase.from('planes').select('id, nombre, precio').order('precio')
  if (error) { console.error(error); return }
  const select = document.getElementById('reg_plan')
  if (!select) return
  select.innerHTML = '<option value="">— Selecciona un plan —</option>'
  data.forEach(p => {
    const opt = document.createElement('option')
    opt.value = p.id
    opt.textContent = `${p.nombre}${p.precio ? ' — $' + Number(p.precio).toLocaleString('es-CO') : ''}`
    select.appendChild(opt)
  })
}

function mostrarError(msg) {
  const box = document.getElementById('errorMsgReg')
  document.getElementById('errorMsgText').textContent = msg
  box.style.display = 'flex'
  setTimeout(() => { box.style.display = 'none' }, 5000)
}

// Validar fortaleza de contraseña
function validarPassword(pass) {
  if (pass.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
  return null
}

window.registrarUsuario = async function() {
  const btn = document.getElementById('btnRegistrar')
  btn.disabled = true
  btn.textContent = rolActual === 'entrenador' ? 'Enviando...' : 'Registrando...'

  try {
    const nombre     = document.getElementById('reg_nombre').value.trim()
    const documento  = document.getElementById('reg_documento').value.trim()
    const email      = document.getElementById('reg_email').value.trim()
    const telefono   = document.getElementById('reg_telefono').value.trim()
    const nacimiento = document.getElementById('reg_nacimiento').value || null
    const genero     = document.getElementById('reg_genero').value
    const password   = document.getElementById('reg_password').value
    const passConf   = document.getElementById('reg_password_confirm').value

    if (!nombre)    { mostrarError('El nombre es obligatorio'); return }
    if (!documento) { mostrarError('El documento es obligatorio'); return }
    if (!email)     { mostrarError('El email es obligatorio'); return }
    if (!password)  { mostrarError('La contraseña es obligatoria'); return }

    const passError = validarPassword(password)
    if (passError)  { mostrarError(passError); return }
    if (password !== passConf) { mostrarError('Las contraseñas no coinciden'); return }

    // Verificar duplicado por documento
    const { data: dupDoc } = await supabase.from('personas').select('id').eq('documento', documento)
    if (dupDoc && dupDoc.length > 0) { mostrarError('Ya existe una cuenta con ese documento'); return }

    // Verificar duplicado por email
    const { data: dupEmail } = await supabase.from('personas').select('id').eq('email', email)
    if (dupEmail && dupEmail.length > 0) { mostrarError('Ya existe una cuenta con ese email'); return }

    if (rolActual === 'cliente') {
      await registrarCliente({ nombre, documento, email, telefono, nacimiento, genero, password })
    } else {
      await registrarSolicitudEntrenador({ nombre, documento, email, telefono, nacimiento, genero, password })
    }

  } catch (err) {
    console.error(err)
    mostrarError('Error inesperado. Intenta nuevamente.')
  } finally {
    btn.disabled = false
    btn.textContent = rolActual === 'entrenador' ? 'ENVIAR SOLICITUD' : 'CREAR CUENTA'
  }
}

async function registrarCliente(base) {
  const plan_id  = parseInt(document.getElementById('reg_plan').value)
  const objetivo = document.getElementById('reg_objetivo').value
  if (!plan_id) { mostrarError('Debes seleccionar un plan'); return }

  const { error } = await supabase.from('personas').insert([{
    nombre: base.nombre, documento: base.documento, email: base.email,
    telefono: base.telefono, nacimiento: base.nacimiento, genero: base.genero,
    plan_id, objetivo, estado: 'Activo', password: base.password,
    fecha_registro: new Date().toISOString(),
    fecha_inicio:   new Date().toISOString().split('T')[0],
  }])

  if (error) { console.error(error); mostrarError('No se pudo registrar: ' + error.message); return }
  mostrarModalExito('✅', '¡Registro exitoso!', `Bienvenido/a ${base.nombre}. Tu cuenta está activa.\nYa puedes iniciar sesión con tu email y contraseña.`)
}

async function registrarSolicitudEntrenador(base) {
  const especialidad = document.getElementById('reg_especialidad').value.trim()
  const motivacion   = document.getElementById('reg_motivacion').value.trim()
  if (!especialidad) { mostrarError('La especialidad es obligatoria'); return }

  const { data: dup } = await supabase
    .from('solicitudes_entrenador').select('id')
    .eq('documento', base.documento).eq('estado', 'pendiente')
  if (dup && dup.length > 0) { mostrarError('Ya tienes una solicitud pendiente'); return }

  const { error } = await supabase.from('solicitudes_entrenador').insert([{
    nombre: base.nombre, documento: base.documento, email: base.email,
    telefono: base.telefono, nacimiento: base.nacimiento, genero: base.genero,
    especialidad, motivacion: motivacion || null,
    estado: 'pendiente', password: base.password,
    fecha_solicitud: new Date().toISOString(),
  }])

  if (error) { console.error(error); mostrarError('No se pudo enviar la solicitud: ' + error.message); return }
  mostrarModalExito('⏳', 'Solicitud enviada', 'Tu solicitud será revisada por el administrador.\nUna vez aprobada podrás iniciar sesión.')
}

function mostrarModalExito(icon, titulo, mensaje) {
  document.getElementById('exitoIcon').textContent    = icon
  document.getElementById('exitoTitulo').textContent  = titulo
  document.getElementById('exitoMensaje').textContent = mensaje
  document.getElementById('modalExito').style.display = 'flex'
}

// Toggle visibilidad contraseñas
window.togglePassReg = function(inputId, btn) {
  const inp = document.getElementById(inputId)
  const isPass = inp.type === 'password'
  inp.type = isPass ? 'text' : 'password'
  btn.textContent = isPass ? '🙈' : '👁'
}

// Indicador de fortaleza de contraseña en tiempo real
window.checkPasswordStrength = function() {
  const pass = document.getElementById('reg_password').value
  const bar  = document.getElementById('passStrengthBar')
  const txt  = document.getElementById('passStrengthText')
  if (!bar) return
  let score = 0
  if (pass.length >= 6)  score++
  if (pass.length >= 10) score++
  if (/[A-Z]/.test(pass))  score++
  if (/[0-9]/.test(pass))  score++
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
}

cargarPlanes()
