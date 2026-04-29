import { checkAuth, buildNavbar, showToast, formatMoney, formatDate, supabase } from './app.js'

checkAuth()
document.getElementById('navbar-container').innerHTML = buildNavbar('inicio.html')

const tipoIcon  = { info: 'ℹ️', update: '🔄', aviso: '⚠️', logro: '🏆' }
const tipoLabel = { info: 'Info', update: 'Actualización', aviso: 'Aviso', logro: 'Logro' }

async function renderStats() {
  const { data } = await supabase.from('personas').select('estado, mensualidad, fecha_registro')
  if (!data) return
  const total     = data.length
  const activos   = data.filter(p => p.estado === 'Activo').length
  const inactivos = data.filter(p => p.estado === 'Inactivo').length
  const ingresos  = data.reduce((s, p) => s + (parseFloat(p.mensualidad) || 0), 0)
  const hoy       = new Date().toDateString()
  const nuevosHoy = data.filter(p => p.fecha_registro && new Date(p.fecha_registro).toDateString() === hoy).length
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Total Miembros</div><div class="stat-value">${total}</div></div>
    <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Activos</div><div class="stat-value" style="color:#4ade80">${activos}</div></div>
    <div class="stat-card"><div class="stat-icon">❌</div><div class="stat-label">Inactivos</div><div class="stat-value" style="color:#f87171">${inactivos}</div></div>
    <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Ingresos Proyectados</div><div class="stat-value" style="font-size:1.4rem">${formatMoney(ingresos)}</div></div>
    <div class="stat-card"><div class="stat-icon">🆕</div><div class="stat-label">Nuevos Hoy</div><div class="stat-value">${nuevosHoy}</div></div>
  `
}

async function renderNoticias() {
  const { data } = await supabase.from('noticias').select('*').order('fecha', { ascending: false })
  const el = document.getElementById('noticiasLista')
  if (!data || !data.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">No hay noticias publicadas.</p>'; return }
  el.innerHTML = data.map(n => `
    <div class="noticia-item">
      <div class="noticia-badge-icon ${n.tipo}">${tipoIcon[n.tipo] || '📌'}</div>
      <div class="noticia-body">
        <div class="noticia-title">${n.titulo}</div>
        <div class="noticia-content">${n.contenido}</div>
        <div class="noticia-meta">
          <span class="noticia-date">📅 ${formatDate(n.fecha)}</span>
          <span class="noticia-tipo ${n.tipo}">${tipoLabel[n.tipo] || n.tipo}</span>
        </div>
      </div>
      <button class="noticia-delete" onclick="eliminarNoticia(${n.id})">🗑️</button>
    </div>`).join('')
}

async function renderEventos() {
  const hoy = new Date().toISOString().split('T')[0]
  const { data } = await supabase.from('eventos').select('*').gte('fecha', hoy).order('fecha', { ascending: true }).limit(3)
  const el = document.getElementById('proximosEventos')
  if (!data || !data.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No hay eventos próximos.</p>'; return }
  el.innerHTML = data.map(e => {
    const d = new Date(e.fecha + 'T00:00:00')
    return `
      <div class="evento-mini">
        <div class="evento-mini-date"><span class="em-day">${d.getDate()}</span><span class="em-mon">${d.toLocaleString('es',{month:'short'}).toUpperCase()}</span></div>
        <div class="evento-mini-info"><h4>${e.titulo}</h4><p>⏰ ${e.hora || ''}</p></div>
      </div>`
  }).join('')
}

window.openNoticiaModal  = () => { document.getElementById('noticiaModal').style.display = 'flex' }
window.closeNoticiaModal = () => { document.getElementById('noticiaModal').style.display = 'none' }

window.publicarNoticia = async function () {
  const titulo   = document.getElementById('nTitulo').value.trim()
  const contenido = document.getElementById('nContenido').value.trim()
  const tipo     = document.getElementById('nTipo').value
  if (!titulo || !contenido) { showToast('⚠️ Completa todos los campos', '#fbbf24'); return }
  const { error } = await supabase.from('noticias').insert([{
    titulo, contenido, tipo, fecha: new Date().toISOString(),
    autor: sessionStorage.getItem('gymUser') || 'Admin'
  }])
  if (error) { console.error(error); showToast('❌ Error al publicar', '#f87171'); return }
  closeNoticiaModal()
  document.getElementById('nTitulo').value = ''
  document.getElementById('nContenido').value = ''
  showToast('✅ Noticia publicada')
  renderNoticias()
}

window.eliminarNoticia = async function (id) {
  if (!confirm('¿Eliminar esta noticia?')) return
  const { error } = await supabase.from('noticias').delete().eq('id', id)
  if (error) { showToast('❌ Error al eliminar', '#f87171'); return }
  showToast('🗑️ Noticia eliminada', '#f87171')
  renderNoticias()
}

renderStats()
renderNoticias()
renderEventos()
