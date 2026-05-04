// ============================================================
// controllers/EventosController.js
// ============================================================
import { Auth }        from '../services/auth.js'
import { showToast, buildNavbar } from '../services/ui.js'
import { EventoModel } from '../models/EventoModel.js'

const TIPO_COLORS = { clase:'#38bdf8', evento:'#c084fc', evaluacion:'#4ade80', mantenimiento:'#fbbf24', otro:'#f87171' }
const TIPO_ICONS  = { clase:'🏋️', evento:'🎉', evaluacion:'📋', mantenimiento:'🔧', otro:'📌' }

export const EventosController = {

  async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('eventos.html')
    window.changeMonth    = (dir) => this.changeMonth(dir)
    window.selectDay      = (d)   => this.selectDay(d)
    window.openEvento     = ()    => this.openEvento()
    window.closeEvento    = ()    => this.closeEvento()
    window.guardarEvento  = ()    => this.guardar()
    window.eliminarEvento = (id)  => this.eliminar(id)
    await this.cargar()
  },

  async cargar() {
    try {
      this._eventos = await EventoModel.getAll()
      this._renderCalendario()
      this._renderLista()
    } catch(e) { console.error(e); showToast('❌ Error al cargar eventos', '#f87171') }
  },

  _renderCalendario() {
    const y = this._fecha.getFullYear()
    const m = this._fecha.getMonth()
    document.getElementById('calTitle').textContent =
      new Date(y,m,1).toLocaleString('es',{month:'long',year:'numeric'})
    const firstDay    = new Date(y,m,1).getDay()
    const daysInMonth = new Date(y,m+1,0).getDate()
    const daysInPrev  = new Date(y,m,0).getDate()
    const today       = new Date()
    let html = ''
    for (let i = firstDay-1; i >= 0; i--)
      html += `<div class="cal-day other-month"><span class="cal-day-num">${daysInPrev-i}</span></div>`
    for (let d = 1; d <= daysInMonth; d++) {
      const ds  = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const evs = this._eventos.filter(e => e.fecha === ds)
      const isToday = today.getFullYear()===y && today.getMonth()===m && today.getDate()===d
      const isSel   = this._selectedDay === ds
      const dots    = evs.map(e => `<div class="cal-dot ${e.tipo||'otro'}"></div>`).join('')
      html += `<div class="cal-day${isToday?' today':''}${isSel?' selected':''}" onclick="selectDay('${ds}')">
        <span class="cal-day-num">${d}</span><div class="cal-dots">${dots}</div></div>`
    }
    const rem = (firstDay+daysInMonth)%7
    for (let i = 1; i <= (rem===0?0:7-rem); i++)
      html += `<div class="cal-day other-month"><span class="cal-day-num">${i}</span></div>`
    document.getElementById('calGrid').innerHTML = html
  },

  selectDay(ds) {
    this._selectedDay = ds
    this._renderCalendario()
    this._renderDayEvents(ds)
  },

  _renderDayEvents(ds) {
    const evs   = this._eventos.filter(e => e.fecha === ds)
    const d     = new Date(ds + 'T00:00:00')
    const label = d.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})
    const el    = document.getElementById('diaEventos')
    el.innerHTML = `<div class="card-title">📌 ${label}</div>`
    if (!evs.length) { el.innerHTML += '<p style="color:var(--text-muted);font-size:0.85rem">No hay eventos este día.</p>'; return }
    el.innerHTML += evs.map(e => `
      <div class="ev-item">
        <div class="ev-tipo-dot" style="background:${TIPO_COLORS[e.tipo]||'#94a3b8'}"></div>
        <div><div class="ev-info-title">${TIPO_ICONS[e.tipo]||'📌'} ${e.titulo}</div>
          <div class="ev-info-meta">⏰ ${e.hora||''} · ${e.descripcion||''}</div></div>
        <button class="ev-del-btn" onclick="eliminarEvento(${e.id})">🗑️</button>
      </div>`).join('')
  },

  _renderLista() {
    const el  = document.getElementById('listaEventos')
    const hoy = new Date().toISOString().split('T')[0]
    if (!this._eventos.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No hay eventos creados.</p>'; return }
    el.innerHTML = [...this._eventos]
      .sort((a,b) => new Date(a.fecha)-new Date(b.fecha))
      .map(e => {
        const d = new Date(e.fecha+'T00:00:00')
        return `<div class="ev-item" style="${e.fecha<hoy?'opacity:0.5':''}">
          <div class="ev-tipo-dot" style="background:${TIPO_COLORS[e.tipo]||'#94a3b8'}"></div>
          <div style="flex:1"><div class="ev-info-title">${e.titulo}</div>
            <div class="ev-info-meta">📅 ${d.toLocaleDateString('es-CO',{day:'2-digit',month:'short'})} · ⏰ ${e.hora||''}</div></div>
          <button class="ev-del-btn" onclick="eliminarEvento(${e.id})">🗑️</button>
        </div>`
      }).join('')
  },

  changeMonth(dir) {
    this._fecha.setMonth(this._fecha.getMonth()+dir)
    this._renderCalendario()
  },

  openEvento() {
    document.getElementById('ev_fecha').value  = this._selectedDay || new Date().toISOString().split('T')[0]
    document.getElementById('ev_hora').value   = '08:00'
    document.getElementById('ev_titulo').value = ''
    document.getElementById('ev_desc').value   = ''
    document.getElementById('eventoModal').style.display = 'flex'
  },

  closeEvento() { document.getElementById('eventoModal').style.display = 'none' },

  async guardar() {
    const titulo = document.getElementById('ev_titulo').value.trim()
    const fecha  = document.getElementById('ev_fecha').value
    if (!titulo || !fecha) { showToast('⚠️ Completa título y fecha', '#fbbf24'); return }
    try {
      await EventoModel.insert({
        titulo, fecha,
        hora:        document.getElementById('ev_hora').value,
        tipo:        document.getElementById('ev_tipo').value,
        descripcion: document.getElementById('ev_desc').value.trim(),
      })
      this.closeEvento()
      showToast('✅ Evento guardado')
      await this.cargar()
      if (this._selectedDay === fecha) this._renderDayEvents(fecha)
    } catch(e) { console.error(e); showToast('❌ Error al guardar', '#f87171') }
  },

  async eliminar(id) {
    if (!confirm('¿Eliminar este evento?')) return
    try {
      await EventoModel.delete(id)
      showToast('🗑️ Evento eliminado', '#f87171')
      await this.cargar()
      if (this._selectedDay) this._renderDayEvents(this._selectedDay)
    } catch(e) { showToast('❌ Error al eliminar', '#f87171') }
  },

  _eventos: [],
  _fecha: new Date(),
  _selectedDay: null
}
