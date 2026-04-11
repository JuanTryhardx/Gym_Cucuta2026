checkAuth();
document.getElementById('navbar-container').innerHTML = buildNavbar('inicio.html');

const tipoIcon = { info: 'ℹ️', update: '🔄', aviso: '⚠️', logro: '🏆' };
const tipoLabel = { info: 'Info', update: 'Actualización', aviso: 'Aviso', logro: 'Logro' };

function renderStats() {
  const s = DB.getStats();
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-label">Total Miembros</div>
      <div class="stat-value">${s.total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">✅</div>
      <div class="stat-label">Activos</div>
      <div class="stat-value" style="color:#4ade80">${s.activos}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">❌</div>
      <div class="stat-label">Inactivos</div>
      <div class="stat-value" style="color:#f87171">${s.inactivos}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">💰</div>
      <div class="stat-label">Ingresos Proyectados</div>
      <div class="stat-value" style="font-size:1.4rem">${formatMoney(s.ingresos)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🆕</div>
      <div class="stat-label">Nuevos Hoy</div>
      <div class="stat-value">${s.nuevosHoy}</div>
    </div>
  `;
}

function renderNoticias() {
  const list = DB.getNoticias();
  const el = document.getElementById('noticiasLista');
  if (!list.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">No hay noticias publicadas.</p>'; return; }
  el.innerHTML = list.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map(n => `
    <div class="noticia-item">
      <div class="noticia-badge-icon ${n.tipo}">${tipoIcon[n.tipo]||'📌'}</div>
      <div class="noticia-body">
        <div class="noticia-title">${n.titulo}</div>
        <div class="noticia-content">${n.contenido}</div>
        <div class="noticia-meta">
          <span class="noticia-date">📅 ${formatDate(n.fecha)}</span>
          <span class="noticia-tipo ${n.tipo}">${tipoLabel[n.tipo]||n.tipo}</span>
        </div>
      </div>
      <button class="noticia-delete" onclick="eliminarNoticia(${n.id})">🗑️</button>
    </div>`).join('');
}

function renderEventos() {
  const eventos = DB.getEventos();
  const hoy = new Date();
  const proximos = eventos.filter(e => new Date(e.fecha) >= hoy).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).slice(0,3);
  const el = document.getElementById('proximosEventos');
  if (!proximos.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No hay eventos próximos.</p>'; return; }
  el.innerHTML = proximos.map(e => {
    const d = new Date(e.fecha + 'T00:00:00');
    const day = d.getDate();
    const mon = d.toLocaleString('es', {month:'short'}).toUpperCase();
    return `
    <div class="evento-mini">
      <div class="evento-mini-date"><span class="em-day">${day}</span><span class="em-mon">${mon}</span></div>
      <div class="evento-mini-info"><h4>${e.titulo}</h4><p>⏰ ${e.hora}</p></div>
    </div>`;
  }).join('');
}

function openNoticiaModal() { document.getElementById('noticiaModal').style.display = 'flex'; }
function closeNoticiaModal() { document.getElementById('noticiaModal').style.display = 'none'; }

function publicarNoticia() {
  const titulo = document.getElementById('nTitulo').value.trim();
  const contenido = document.getElementById('nContenido').value.trim();
  const tipo = document.getElementById('nTipo').value;
  if (!titulo || !contenido) { showToast('⚠️ Completa todos los campos', '#fbbf24'); return; }
  const noticias = DB.getNoticias();
  noticias.unshift({ id: Date.now(), titulo, contenido, tipo, fecha: new Date().toISOString(), autor: sessionStorage.getItem('gymUser') || 'Admin' });
  DB.setNoticias(noticias);
  closeNoticiaModal();
  document.getElementById('nTitulo').value = '';
  document.getElementById('nContenido').value = '';
  renderNoticias();
  showToast('✅ Noticia publicada');
}

function eliminarNoticia(id) {
  if (!confirm('¿Eliminar esta noticia?')) return;
  DB.setNoticias(DB.getNoticias().filter(n => n.id !== id));
  renderNoticias();
}

renderStats();
renderNoticias();
renderEventos();
import { supabase } from './supabase.js'

async function cargarStats() {
  const { data } = await supabase.from('personas').select('*')

  const total = data.length
  const activos = data.filter(p => p.estado === 'Activo').length
  const ingresos = data.reduce((acc, p) => acc + (p.mensualidad || 0), 0)

  document.getElementById('stats').innerHTML = `
    <div class="card">👥 ${total} miembros</div>
    <div class="card">✅ ${activos} activos</div>
    <div class="card">💰 $${ingresos}</div>
  `
}

cargarStats()
