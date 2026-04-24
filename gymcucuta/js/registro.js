// ===== REGISTRO.JS =====
// Lógica de registro público (clientes y entrenadores)
// NO modifica ninguna funcionalidad existente.

import { supabase } from './supabase.js'

// ── Estado del formulario ──────────────────────────────────────────────────
let rolActual = 'cliente'

// ── Selector de rol ───────────────────────────────────────────────────────
window.setRol = function (rol) {
  rolActual = rol

  document.getElementById('btnCliente').classList.toggle('active', rol === 'cliente')
  document.getElementById('btnEntrenador').classList.toggle('active', rol === 'entrenador')

  const secCliente    = document.getElementById('seccionCliente')
  const secEntrenador = document.getElementById('seccionEntrenador')
  const info          = document.getElementById('rolInfo')
  const infoIcon      = document.getElementById('rolInfoIcon')
  const infoText      = document.getElementById('rolInfoText')

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

// ── Cargar planes desde Supabase ──────────────────────────────────────────
async function cargarPlanes () {
  const { data, error } = await supabase.from('planes').select('id, nombre, precio').order('precio')
  if (error || !data) return

  const select = document.getElementById('reg_plan')
  select.innerHTML = '<option value="">— Selecciona un plan —</option>'
  data.forEach(p => {
    const opt = document.createElement('option')
    opt.value = p.id
    opt.textContent = `${p.nombre}${p.precio ? ' — $' + Number(p.precio).toLocaleString('es-CO') : ''}`
    select.appendChild(opt)
  })
}

// ── Mostrar error ─────────────────────────────────────────────────────────
function mostrarError (msg) {
  const box = document.getElementById('errorMsgReg')
  document.getElementById('errorMsgText').textContent = msg
  box.style.display = 'flex'
  setTimeout(() => { box.style.display = 'none' }, 5000)
}

// ── Registro principal ────────────────────────────────────────────────────
window.registrarUsuario = async function () {
  const btn = document.getElementById('btnRegistrar')
  btn.disabled = true
  btn.textContent = rolActual === 'entrenador' ? 'Enviando...' : 'Registrando...'

  try {
    // ── Campos comunes ────────────────────────────────────────────────────
    const nombre    = document.getElementById('reg_nombre').value.trim()
    const documento = document.getElementById('reg_documento').value.trim()
    const email     = document.getElementById('reg_email').value.trim()
    const telefono  = document.getElementById('reg_telefono').value.trim()
    const nacimiento = document.getElementById('reg_nacimiento').value || null
    const genero    = document.getElementById('reg_genero').value

    // ── Validaciones básicas ──────────────────────────────────────────────
    if (!nombre) { mostrarError('El nombre es obligatorio'); return }
    if (!documento) { mostrarError('El documento es obligatorio'); return }
    if (!email) { mostrarError('El email es obligatorio'); return }

    // ── Verificar duplicado por documento ─────────────────────────────────
    const { data: dupPersona } = await supabase
      .from('personas')
      .select('id')
      .eq('documento', documento)

    if (dupPersona && dupPersona.length > 0) {
      mostrarError('Ya existe un cliente registrado con ese documento')
      return
    }

    // ── Flujo según rol ───────────────────────────────────────────────────
    if (rolActual === 'cliente') {
      await registrarCliente({ nombre, documento, email, telefono, nacimiento, genero })
    } else {
      await registrarSolicitudEntrenador({ nombre, documento, email, telefono, nacimiento, genero })
    }

  } catch (err) {
    console.error('Error en registro:', err)
    mostrarError('Error inesperado. Intenta nuevamente.')
  } finally {
    btn.disabled = false
    btn.textContent = rolActual === 'entrenador' ? 'ENVIAR SOLICITUD' : 'CREAR CUENTA'
  }
}

// ── Registrar CLIENTE → tabla personas ───────────────────────────────────
async function registrarCliente (base) {
  const plan_id = parseInt(document.getElementById('reg_plan').value)
  const objetivo = document.getElementById('reg_objetivo').value

  if (!plan_id) {
    mostrarError('Debes seleccionar un plan')
    return
  }

  const payload = {
    nombre:         base.nombre,
    documento:      base.documento,
    email:          base.email,
    telefono:       base.telefono,
    nacimiento:     base.nacimiento,
    genero:         base.genero,
    plan_id:        plan_id,
    objetivo:       objetivo,
    estado:         'Activo',
    fecha_registro: new Date().toISOString(),
    fecha_inicio:   new Date().toISOString().split('T')[0],
  }

  const { error } = await supabase.from('personas').insert([payload])

  if (error) {
    console.error('Error insertando cliente:', error)
    mostrarError('No se pudo registrar. Verifica tus datos.')
    return
  }

  mostrarModalExito(
    '✅',
    '¡Registro exitoso!',
    `Bienvenido/a ${base.nombre}. Tu cuenta está activa. Ya puedes iniciar sesión.`
  )
}

// ── Registrar solicitud ENTRENADOR → tabla solicitudes_entrenador ─────────
async function registrarSolicitudEntrenador (base) {
  const especialidad = document.getElementById('reg_especialidad').value.trim()
  const motivacion   = document.getElementById('reg_motivacion').value.trim()

  if (!especialidad) {
    mostrarError('La especialidad es obligatoria para entrenadores')
    return
  }

  // Verificar que no exista ya una solicitud pendiente con ese documento
  const { data: dupSolicitud } = await supabase
    .from('solicitudes_entrenador')
    .select('id')
    .eq('documento', base.documento)
    .eq('estado', 'pendiente')

  if (dupSolicitud && dupSolicitud.length > 0) {
    mostrarError('Ya existe una solicitud pendiente con ese documento')
    return
  }

  const payload = {
    nombre:       base.nombre,
    documento:    base.documento,
    email:        base.email,
    telefono:     base.telefono,
    nacimiento:   base.nacimiento,
    genero:       base.genero,
    especialidad: especialidad,
    motivacion:   motivacion || null,
    estado:       'pendiente',        // pendiente | aprobado | rechazado
    fecha_solicitud: new Date().toISOString(),
  }

  const { error } = await supabase.from('solicitudes_entrenador').insert([payload])

  if (error) {
    console.error('Error insertando solicitud:', error)
    mostrarError('No se pudo enviar la solicitud. Intenta nuevamente.')
    return
  }

  mostrarModalExito(
    '⏳',
    '¡Solicitud enviada!',
    `Gracias ${base.nombre}. Tu solicitud como entrenador ha sido recibida y será revisada por el administrador. Te contactaremos pronto.`
  )
}

// ── Modal de éxito ────────────────────────────────────────────────────────
function mostrarModalExito (icon, titulo, mensaje) {
  document.getElementById('exitoIcon').textContent    = icon
  document.getElementById('exitoTitulo').textContent  = titulo
  document.getElementById('exitoMensaje').textContent = mensaje
  document.getElementById('modalExito').style.display = 'flex'
}

// ── Init ──────────────────────────────────────────────────────────────────
cargarPlanes()
