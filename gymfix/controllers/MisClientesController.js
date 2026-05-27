// ============================================================
// MisClientesController.js — Vista exclusiva para Entrenadores
// Muestra sus clientes asignados, fichas de salud y control
// de objetivos
// ============================================================
import { Auth }         from '../services/auth.js'
import { buildNavbar, showLoader, hideLoader, swalConfirm,
         swalSuccess, swalError, formatDate, isEntrenador, isAdmin } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'

const OBJETIVOS = [
  'Pérdida de peso', 'Ganancia muscular', 'Mantenimiento',
  'Resistencia', 'Rehabilitación', 'General'
]

export const MisClientesController = {

  async init() {
    Auth.requireAuth()
    // Solo entrenadores y admins acceden a esta vista
    if (!isEntrenador() && !isAdmin()) {
      window.location.href = 'inicio.html'; return
    }

    document.getElementById('navbar-container').innerHTML = buildNavbar('mis-clientes.html')

    const user = Auth.getUser()
    this._entrenadorNombre = user.nombre || ''
    this._entrenadorId     = user.id

    // Exponer funciones globales
    window.abrirFicha       = (id) => this.abrirFicha(id)
    window.cerrarFicha      = ()   => this.cerrarFicha()
    window.guardarObjetivo  = ()   => this.guardarObjetivo()
    window.guardarSalud     = ()   => this.guardarSalud()
    window.buscarClientes   = ()   => this._filtrar(document.getElementById('buscarCliente').value)

    // Mostrar nombre del entrenador en el header
    const nameEl = document.getElementById('entrenadorNombre')
    if (nameEl) nameEl.textContent = this._entrenadorNombre

    showLoader('Cargando tus clientes...')
    await this.cargar()
    hideLoader()

    document.getElementById('buscarCliente')
      ?.addEventListener('input', e => this._filtrar(e.target.value))
  },

  async cargar() {
    try {
      this._clientes = await PersonaModel.getByEntrenador(this._entrenadorNombre)
      this._renderLista(this._clientes)
      this._renderStats(this._clientes)
    } catch(e) {
      console.error(e)
      await swalError('Error al cargar', 'No se pudieron obtener tus clientes.')
    }
  },

  _filtrar(texto) {
    const q = texto.toLowerCase()
    const filtrado = this._clientes.filter(c =>
      (c.nombre    || '').toLowerCase().includes(q) ||
      (c.documento || '').toLowerCase().includes(q) ||
      (c.objetivo  || '').toLowerCase().includes(q)
    )
    this._renderLista(filtrado)
  },

  _renderStats(data) {
    const total  = data.length
    const activos = data.filter(c => c.estado === 'Activo').length
    const el = document.getElementById('statsClientes')
    if (!el) return
    el.innerHTML = `
      <div class="mc-stat"><div class="mc-stat-val">${total}</div><div class="mc-stat-label">Total Clientes</div></div>
      <div class="mc-stat"><div class="mc-stat-val" style="color:#4ade80">${activos}</div><div class="mc-stat-label">Activos</div></div>
      <div class="mc-stat"><div class="mc-stat-val" style="color:#fbbf24">${total - activos}</div><div class="mc-stat-label">Inactivos</div></div>`
  },

  _objetivoBadge(obj) {
    const map = {
      'Pérdida de peso':   { cls: 'obj-perdida',  icon: '' },
      'Ganancia muscular': { cls: 'obj-musculo',  icon: '' },
      'Mantenimiento':     { cls: 'obj-mant',     icon: '' },
      'Resistencia':       { cls: 'obj-resist',   icon: '' },
      'Rehabilitación':    { cls: 'obj-rehab',    icon: '' },
      'General':           { cls: 'obj-general',  icon: '' },
    }
    const o = map[obj] || map['General']
    return `<span class="obj-badge ${o.cls}">${o.icon} ${obj || 'General'}</span>`
  },

  _imc(peso, altura) {
    if (!peso || !altura) return null
    const h = altura / 100
    return (peso / (h * h)).toFixed(1)
  },

  _imcLabel(imc) {
    if (!imc) return ''
    const v = parseFloat(imc)
    if (v < 18.5) return { label: 'Bajo peso',    color: '#60a5fa' }
    if (v < 25)   return { label: 'Normal',        color: '#4ade80' }
    if (v < 30)   return { label: 'Sobrepeso',     color: '#fbbf24' }
    return              { label: 'Obesidad',        color: '#f87171' }
  },

  _renderLista(data) {
    const tbody  = document.getElementById('tablaClientes')
    const empty  = document.getElementById('emptyClientes')
    const count  = document.getElementById('countClientes')

    if (!data || data.length === 0) {
      tbody.innerHTML = ''
      empty.style.display = 'flex'
      count.textContent = '0 clientes'
      return
    }
    empty.style.display = 'none'
    count.textContent   = `${data.length} cliente${data.length !== 1 ? 's' : ''}`

    tbody.innerHTML = data.map((c, i) => {
      const imc      = this._imc(c.peso, c.altura)
      const imcData  = this._imcLabel(imc)
      return `
      <tr style="animation-delay:${i*0.04}s" onclick="abrirFicha(${c.id})" class="fila-cliente">
        <td>
          <div class="member-cell">
            <div class="mem-avatar">${(c.nombre||'?').charAt(0).toUpperCase()}</div>
            <div class="mem-info">
              <div class="mem-name">${c.nombre || '-'}</div>
              <div class="mem-email">${c.email || '-'}</div>
            </div>
          </div>
        </td>
        <td><span class="doc-chip">${c.documento || '-'}</span></td>
        <td>${this._objetivoBadge(c.objetivo)}</td>
        <td class="td-salud">
          ${c.peso ? `<span class="salud-chip">${c.peso}kg</span>` : '<span style="color:#4b5563">—</span>'}
          ${c.altura ? `<span class="salud-chip">${c.altura}cm</span>` : ''}
          ${imc ? `<span class="salud-chip imc" style="border-color:${imcData?.color};color:${imcData?.color}">IMC ${imc}</span>` : ''}
        </td>
        <td><span class="status-badge ${c.estado==='Activo'?'badge-activo':'badge-inactivo'}">${c.estado||'Activo'}</span></td>
        <td class="td-actions">
          <button class="btn-edit" onclick="event.stopPropagation();abrirFicha(${c.id})">Ver Ficha</button>
        </td>
      </tr>`
    }).join('')
  },

  async abrirFicha(id) {
    showLoader('Cargando ficha...')
    try {
      const c = await PersonaModel.getById(id)
      this._fichaActual = c

      // Rellenar cabecera de la ficha
      document.getElementById('fichaAvatar').textContent = (c.nombre||'?').charAt(0).toUpperCase()
      document.getElementById('fichaNombre').textContent  = c.nombre || '-'
      document.getElementById('fichaEmail').textContent   = c.email  || '-'
      document.getElementById('fichaTel').textContent     = c.telefono || '-'
      document.getElementById('fichaDoc').textContent     = c.documento || '-'
      document.getElementById('fichaFecha').textContent   = formatDate(c.fecha_inicio)
      document.getElementById('fichaPlan').textContent    = { 1:'Mensual', 2:'Trimestral', 3:'Semestral', 4:'Anual' }[c.plan_id] || '-'

      // Datos de salud
      document.getElementById('fichaPeso').value   = c.peso    || ''
      document.getElementById('fichaAltura').value = c.altura  || ''
      document.getElementById('fichaObs').value    = c.observaciones || ''

      // IMC calculado
      const imc     = this._imc(c.peso, c.altura)
      const imcData = this._imcLabel(imc)
      const imcEl   = document.getElementById('fichaIMC')
      if (imcEl) {
        imcEl.textContent  = imc ? `IMC: ${imc} — ${imcData?.label}` : 'IMC: Sin datos'
        imcEl.style.color  = imcData?.color || '#94a3b8'
      }

      // Selector de objetivo
      const selObj = document.getElementById('fichaObjetivo')
      selObj.innerHTML = OBJETIVOS.map(o =>
        `<option value="${o}" ${o === c.objetivo ? 'selected' : ''}>${o}</option>`
      ).join('')

      // Observaciones especiales
      document.getElementById('fichaEmergencia').textContent = c.contacto_emergencia || 'No registrado'

      document.getElementById('fichaModal').style.display = 'flex'
    } catch(e) {
      console.error(e)
      await swalError('Error', 'No se pudo cargar la ficha del cliente.')
    } finally { hideLoader() }
  },

  cerrarFicha() {
    document.getElementById('fichaModal').style.display = 'none'
    this._fichaActual = null
  },

  async guardarObjetivo() {
    if (!this._fichaActual) return
    const nuevo = document.getElementById('fichaObjetivo').value
    showLoader('Guardando objetivo...')
    try {
      await PersonaModel.updateObjetivo(this._fichaActual.id, nuevo)
      // Actualizar en memoria
      const idx = this._clientes.findIndex(c => c.id === this._fichaActual.id)
      if (idx !== -1) this._clientes[idx].objetivo = nuevo
      this._renderLista(this._clientes)
      this.cerrarFicha()
      await swalSuccess('¡Objetivo actualizado!', `Ahora el objetivo es: ${nuevo}`)
    } catch(e) {
      await swalError('Error', 'No se pudo actualizar el objetivo.')
    } finally { hideLoader() }
  },

  async guardarSalud() {
    if (!this._fichaActual) return
    const peso    = parseFloat(document.getElementById('fichaPeso').value)   || null
    const altura  = parseFloat(document.getElementById('fichaAltura').value) || null
    const obs     = document.getElementById('fichaObs').value.trim()

    showLoader('Guardando datos de salud...')
    try {
      await PersonaModel.updateSalud(this._fichaActual.id, { peso, altura, observaciones: obs })
      // Actualizar en memoria y refrescar IMC en pantalla
      this._fichaActual = { ...this._fichaActual, peso, altura, observaciones: obs }
      const imc     = this._imc(peso, altura)
      const imcData = this._imcLabel(imc)
      const imcEl   = document.getElementById('fichaIMC')
      if (imcEl) {
        imcEl.textContent = imc ? `IMC: ${imc} — ${imcData?.label}` : 'IMC: Sin datos'
        imcEl.style.color = imcData?.color || '#94a3b8'
      }
      const idx = this._clientes.findIndex(c => c.id === this._fichaActual.id)
      if (idx !== -1) this._clientes[idx] = { ...this._clientes[idx], peso, altura }
      this._renderLista(this._clientes)
      await swalSuccess('¡Datos de salud actualizados!', 'La ficha fue guardada correctamente.')
    } catch(e) {
      await swalError('Error', 'No se pudo guardar la información de salud.')
    } finally { hideLoader() }
  },

  _clientes: [],
  _fichaActual: null,
  _entrenadorNombre: '',
  _entrenadorId: null
}

MisClientesController.init()
