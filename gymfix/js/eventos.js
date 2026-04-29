import { checkAuth, buildNavbar, showToast, supabase } from './app.js'

checkAuth()
document.getElementById('navbar-container').innerHTML = buildNavbar('eventos.html')

const TIPO_COLORS = { clase:'#38bdf8', evento:'#c084fc', evaluacion:'#4ade80', mantenimiento:'#fbbf24', otro:'#f87171' }
const TIPO_ICONS  = { clase:'🏋️', evento:'🎉', evaluacion:'📋', mantenimiento:'🔧', otro:'📌' }

let currentDate  = new Date()
let selectedDay  = null
let todosEventos = []

async function cargarEventos() {
  const { data, error } = await supabase.from('eventos').select('*').order('fecha', { ascending: true })
  if (error) { console.error(error); showToast('❌ Error al cargar eventos', '#f87171'); return }
  todosEventos = data || []
  renderCalendario()
  renderListaEventos()
}

function renderCalendario() {
  const y = currentDate.getFullYear()
  const m = currentDate.getMonth()
  document.getElementById('calTitle').textContent = new Date(y,m,1).toLocaleString('es',{month:'long',year:'numeric'})
  const firstDay    = new Date(y,m,1).getDay()
  const daysInMonth = new Date(y,m+1,0).getDate()
  const daysInPrev  = new Date(y,m,0).getDate()
  const today       = new Date()
  let html = ''
  for (let i = firstDay-1; i >= 0; i--) html += `<div class="cal-day other-month"><span class="cal-day-num">${daysInPrev-i}</span></div>`
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const dayEvs  = todosEventos.filter(e => e.fecha === dateStr)
    const isToday = today.getFullYear()===y && today.getMonth()===m && today.getDate()===d
    const isSel   = selectedDay === dateStr
    const dots    = dayEvs.map(e => `<div class="cal-dot ${e.tipo||'otro'}"></div>`).join('')
    html += `<div class="cal-day${isToday?' today':''}${isSel?' selected':''}" onclick="selectDay('${dateStr}')">
      <span class="cal-day-num">${d}</span><div class="cal-dots">${dots}</div></div>`
  }
  const total = firstDay + daysInMonth
  const rem   = total%7===0 ? 0 : 7-(total%7)
  for (let i = 1; i <= rem; i++) html += `<div class="cal-day other-month"><span class="cal-day-num">${i}</span></div>`
  document.getElementById('calGrid').innerHTML = html
}

window.selectDay = function (dateStr) {
  selectedDay = dateStr
  renderCalendario()
  renderDayEvents(dateStr)
}

function renderDayEvents(dateStr) {
  const evs   = todosEventos.filter(e => e.fecha === dateStr)
  const d     = new Date(dateStr + 'T00:00:00')
  const label = d.toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })
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
}

function renderListaEventos() {
  const el  = document.getElementById('listaEventos')
  const hoy = new Date().toISOString().split('T')[0]
  const evs = [...todosEventos].sort((a,b) => new Date(a.fecha)-new Date(b.fecha))
  if (!evs.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No hay eventos creados.</p>'; return }
  el.innerHTML = evs.map(e => {
    const d     = new Date(e.fecha+'T00:00:00')
    const label = d.toLocaleDateString('es-CO',{day:'2-digit',month:'short'})
    return `<div class="ev-item" style="${e.fecha<hoy?'opacity:0.5':''}">
      <div class="ev-tipo-dot" style="background:${TIPO_COLORS[e.tipo]||'#94a3b8'}"></div>
      <div style="flex:1"><div class="ev-info-title">${e.titulo}</div>
      <div class="ev-info-meta">📅 ${label} · ⏰ ${e.hora||''}</div></div>
      <button class="ev-del-btn" onclick="eliminarEvento(${e.id})">🗑️</button>
    </div>`
  }).join('')
}

window.changeMonth = function (dir) { currentDate.setMonth(currentDate.getMonth()+dir); renderCalendario() }

window.openEvento = function () {
  document.getElementById('ev_fecha').value  = selectedDay || new Date().toISOString().split('T')[0]
  document.getElementById('ev_hora').value   = '08:00'
  document.getElementById('ev_titulo').value = ''
  document.getElementById('ev_desc').value   = ''
  document.getElementById('eventoModal').style.display = 'flex'
}
window.closeEvento = function () { document.getElementById('eventoModal').style.display = 'none' }

window.guardarEvento = async function () {
  const titulo = document.getElementById('ev_titulo').value.trim()
  const fecha  = document.getElementById('ev_fecha').value
  if (!titulo || !fecha) { showToast('⚠️ Completa título y fecha', '#fbbf24'); return }
  const { error } = await supabase.from('eventos').insert([{
    titulo, fecha,
    hora:        document.getElementById('ev_hora').value,
    tipo:        document.getElementById('ev_tipo').value,
    descripcion: document.getElementById('ev_desc').value.trim(),
  }])
  if (error) { console.error(error); showToast('❌ Error al guardar', '#f87171'); return }
  closeEvento()
  showToast('✅ Evento guardado')
  await cargarEventos()
  if (selectedDay === fecha) renderDayEvents(fecha)
}

window.eliminarEvento = async function (id) {
  if (!confirm('¿Eliminar este evento?')) return
  const { error } = await supabase.from('eventos').delete().eq('id', id)
  if (error) { showToast('❌ Error al eliminar', '#f87171'); return }
  showToast('🗑️ Evento eliminado', '#f87171')
  await cargarEventos()
  if (selectedDay) renderDayEvents(selectedDay)
}

cargarEventos()
