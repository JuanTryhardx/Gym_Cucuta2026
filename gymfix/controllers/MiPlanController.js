import { Auth }         from '../services/auth.js'
import { buildNavbar, showLoader, hideLoader, swalError, isCliente } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'

export const MiPlanController = {

  async init() {
    Auth.requireAuth()
    // Solo clientes acceden a Mi Plan
    if (!isCliente()) { window.location.href = 'inicio.html'; return }

    document.getElementById('navbar-container').innerHTML = buildNavbar('mi-plan.html')

    showLoader('Cargando tu plan...')
    try {
      const user = Auth.getUser()
      // Refrescar datos del usuario desde Supabase para tener los más actuales
      const datos = await PersonaModel.getById(user.id)
      await this._renderPerfil(datos)
      await this._renderEntrenador(datos.entrenador)
      this._renderEvolucion(datos)
      this._renderObjetivo(datos)
    } catch(e) {
      console.error(e)
      await swalError('Error', 'No se pudieron cargar tus datos.')
    } finally { hideLoader() }
  },

  _renderPerfil(d) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '-' }
    set('mpNombre',    d.nombre)
    set('mpDocumento', d.documento)
    set('mpEmail',     d.email)
    set('mpTelefono',  d.telefono)
    const av = document.getElementById('mpAvatar')
    if (av) av.textContent = (d.nombre || '?').charAt(0).toUpperCase()
  },

  async _renderEntrenador(nombreEntrenador) {
    const el = document.getElementById('entrenadorCard')
    if (!el) return

    if (!nombreEntrenador || !nombreEntrenador.trim()) {
      el.innerHTML = `
        <div class="sin-entrenador">
          
          <p>Aún no tienes un entrenador asignado.</p>
          <small>Contacta al administrador del gimnasio para que te asignen uno.</small>
        </div>`
      return
    }

    try {
      const e = await PersonaModel.getEntrenadorByNombre(nombreEntrenador)
      if (!e) throw new Error('no encontrado')
      el.innerHTML = `
        <div class="entrenador-perfil">
          <div class="ent-avatar">${(e.nombre||'E').charAt(0).toUpperCase()}</div>
          <div class="ent-info">
            <div class="ent-nombre">${e.nombre}</div>
            <div class="ent-especialidad">${e.especialidad || 'Entrenamiento General'}</div>
          </div>
        </div>
        <div class="ent-contacto">
          ${e.email    ? `<div class="ent-contact-item"><span class="ent-contact-icon"></span><div><div class="ent-contact-label">Correo</div><div class="ent-contact-val">${e.email}</div></div></div>` : ''}
          ${e.telefono ? `<div class="ent-contact-item"><span class="ent-contact-icon"></span><div><div class="ent-contact-label">Teléfono</div><div class="ent-contact-val">${e.telefono}</div></div></div>` : ''}
          <div class="ent-contact-item"><div><div class="ent-contact-label">Especialidad</div><div class="ent-contact-val">${e.especialidad || 'Entrenamiento General'}</div></div></div>
          <div class="ent-contact-item"><span class="ent-contact-icon"></span><div><div class="ent-contact-label">Atención</div><div class="ent-contact-val">Lun–Sáb · 6:00 AM – 8:00 PM</div></div></div>
        </div>
        <a href="soporte.html" class="btn-secondary btn-contactar">Enviar mensaje al soporteoporte</a>`
    } catch(e) {
      // Si el entrenador no está en BD, mostrar solo el nombre
      el.innerHTML = `
        <div class="entrenador-perfil">
          <div class="ent-avatar">${(nombreEntrenador||'E').charAt(0).toUpperCase()}</div>
          <div class="ent-info">
            <div class="ent-nombre">${nombreEntrenador}</div>
            <div class="ent-especialidad">Entrenador Personal</div>
          </div>
        </div>
        <div class="ent-tip">Contacta al gimnasio para más información sobre tu entrenador.</div>`
    }
  },

  _imc(peso, altura) {
    if (!peso || !altura) return null
    return (peso / Math.pow(altura / 100, 2)).toFixed(1)
  },

  _imcInfo(imc) {
    if (!imc) return null
    const v = parseFloat(imc)
    if (v < 18.5) return { label: 'Bajo peso',  color: '#60a5fa', icon: '', consejo: 'Tu entrenador te ayudará a ganar masa muscular de forma saludable.' }
    if (v < 25)   return { label: 'Normal',      color: '#4ade80', icon: '', consejo: '¡Excelente! Mantén tus hábitos de entrenamiento y nutrición.' }
    if (v < 30)   return { label: 'Sobrepeso',   color: '#fbbf24', icon: '', consejo: 'Con constancia en el gimnasio y buena alimentación lo lograrás.' }
    return              { label: 'Obesidad',      color: '#f87171', icon: '', consejo: 'Tu entrenador diseñará un plan seguro para ti. ¡Confía en el proceso!' }
  },

  _renderEvolucion(d) {
    const el = document.getElementById('evolucionCard')
    if (!el) return

    const imc     = this._imc(d.peso, d.altura)
    const imcInfo = this._imcInfo(imc)
    const pctPeso = d.peso ? Math.min((d.peso / 120) * 100, 100) : 0

    el.innerHTML = `
      <div class="evol-grid">
        <div class="evol-item">
          <div class="evol-icon"></div>
          <div class="evol-val">${d.peso ? d.peso + ' kg' : '—'}</div>
          <div class="evol-label">Peso Actual</div>
          ${d.peso ? `<div class="evol-bar-wrap"><div class="evol-bar" style="width:${pctPeso}%;background:#38bdf8"></div></div>` : ''}
        </div>
        <div class="evol-item">
          <div class="evol-icon"></div>
          <div class="evol-val">${d.altura ? d.altura + ' cm' : '—'}</div>
          <div class="evol-label">Altura</div>
        </div>
        <div class="evol-item ${imc ? 'evol-imc' : ''}">
          <div class="evol-icon">${imcInfo?.label || 'IMC'}</div>
          <div class="evol-val" style="color:${imcInfo?.color || '#94a3b8'}">${imc || '—'}</div>
          <div class="evol-label">IMC</div>
          ${imcInfo ? `<div class="evol-imc-label" style="color:${imcInfo.color}">${imcInfo.label}</div>` : ''}
        </div>
      </div>
      ${imcInfo ? `<div class="evol-consejo">${imcInfo.icon} ${imcInfo.consejo}</div>` : ''}
      ${d.observaciones ? `<div class="evol-obs"><div class="evol-obs-titulo">Notas de tu entrenador</div><p>${d.observaciones}</p></div>` : ''}
      ${!d.peso && !d.altura ? `<div class="sin-datos">Tu entrenador o administrador aún no ha registrado tu información física.</div>` : ''}`
  },

  _renderObjetivo(d) {
    const el = document.getElementById('objetivoCard')
    if (!el) return

    const obj = d.objetivo || 'General'
    const map = {
      'Pérdida de peso':   { icon:'', color:'#f87171', desc:'Déficit calórico + cardio + fuerza moderada. Evitar el sedentarismo y mantener hidratación constante.' },
      'Ganancia muscular': { icon:'', color:'#38bdf8', desc:'Superávit calórico + entrenamiento de fuerza progresivo. Priorizar proteínas y descanso de calidad.' },
      'Mantenimiento':     { icon:'', color:'#fbbf24', desc:'Calorías de mantenimiento + rutina mixta de fuerza y cardio. Consistencia por encima de todo.' },
      'Resistencia':       { icon:'', color:'#c084fc', desc:'Alto volumen + trabajo aeróbico progresivo. Entrenamientos de duración creciente.' },
      'Rehabilitación':    { icon:'', color:'#4ade80', desc:'Ejercicio controlado bajo supervisión. Coordinación con fisioterapia si es necesario.' },
      'General':           { icon:'', color:'#94a3b8', desc:'Rutina equilibrada de fuerza, cardio y flexibilidad para mejorar la condición física general.' },
    }
    const o = map[obj] || map['General']

    el.innerHTML = `
      <div class="obj-display">
        <div class="obj-display-icon">${o.icon}</div>
        <div>
          <div class="obj-display-nombre" style="color:${o.color}">${obj}</div>
          <div class="obj-display-desc">${o.desc}</div>
        </div>
      </div>
      <div class="obj-tips-titulo">Recomendaciones</div>
      <div class="obj-tips">
        <div class="obj-tip">Lleva un registro de tu alimentación diaria</div>
        <div class="obj-tip">Bebe mínimo 2 litros de agua al día</div>
        <div class="obj-tip">Duerme entre 7 y 9 horas para recuperarte</div>
        <div class="obj-tip">Consulta con tu entrenador tu progreso cada semana</div>
      </div>`
  }
}

MiPlanController.init()
