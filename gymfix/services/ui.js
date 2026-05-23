// ============================================================
// services/ui.js
// Helpers de UI: SweetAlert2, Loader, Toast, Navbar, Formato
// ============================================================
import { Auth } from './auth.js'

// ── Loader de Carga Global ────────────────────────────────────
export function showLoader(msg = 'Cargando...') {
  let el = document.getElementById('global-loader')
  if (!el) {
    el = document.createElement('div')
    el.id = 'global-loader'
    el.innerHTML = `
      <div class="loader-backdrop">
        <div class="loader-box">
          <div class="loader-spinner">
            <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#38bdf8" stroke-width="4"
                stroke-dasharray="80 40" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate"
                  from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          <p class="loader-msg" id="loader-msg-text">${msg}</p>
        </div>
      </div>`
    document.body.appendChild(el)
  } else {
    const msgEl = el.querySelector('#loader-msg-text')
    if (msgEl) msgEl.textContent = msg
    el.style.display = 'flex'
  }
}

export function hideLoader() {
  const el = document.getElementById('global-loader')
  if (el) el.style.display = 'none'
}

// ── SweetAlert2 helpers ─────────────────────────────────────
function _swalLoaded() { return typeof window.Swal !== 'undefined' }

export async function swalConfirm(titulo, texto, confirmTxt = 'Sí, confirmar') {
  if (!_swalLoaded()) return confirm(`${titulo}\n${texto}`)
  const result = await window.Swal.fire({
    title: titulo,
    text: texto,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#38bdf8',
    cancelButtonColor: '#ef4444',
    confirmButtonText: confirmTxt,
    cancelButtonText: 'Cancelar',
    background: '#0d1424',
    color: '#e2e8f0',
    customClass: { popup: 'swal-gym' }
  })
  return result.isConfirmed
}

export async function swalSuccess(titulo, texto = '') {
  if (!_swalLoaded()) { showToast('✅ ' + titulo); return }
  await window.Swal.fire({
    title: titulo, text: texto, icon: 'success',
    confirmButtonColor: '#38bdf8', background: '#0d1424', color: '#e2e8f0',
    timer: 2200, timerProgressBar: true, showConfirmButton: false,
    customClass: { popup: 'swal-gym' }
  })
}

export async function swalError(titulo, texto = '') {
  if (!_swalLoaded()) { showToast('❌ ' + titulo, '#f87171'); return }
  await window.Swal.fire({
    title: titulo, text: texto, icon: 'error',
    confirmButtonColor: '#38bdf8', background: '#0d1424', color: '#e2e8f0',
    customClass: { popup: 'swal-gym' }
  })
}

// Exponer globalmente
window.swalConfirm = swalConfirm
window.swalSuccess = swalSuccess
window.swalError   = swalError
window.showLoader  = showLoader
window.hideLoader  = hideLoader

// ── Toast (Notificaciones fallback) ─────────────────────────
export function showToast(msg, color = '#38bdf8') {
  const t = document.createElement('div')
  t.className = 'toast'
  t.style.borderColor = color
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3000)
}
window.showToast = showToast

// ── Formato (Colombia) ───────────────────────────────────────
export function formatMoney(n) {
  return '$' + Number(n || 0).toLocaleString('es-CO', {
    minimumFractionDigits: 0, maximumFractionDigits: 0
  })
}
export function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}
window.formatMoney = formatMoney
window.formatDate  = formatDate

// ── Navbar Dinámico ─────────────────────────────────────────
export function buildNavbar(activePage) {
  const user = Auth.getUser()
  if (!user) { window.location.href = 'index.html'; return '' }

  const nombre = user.nombre || user.email || 'Usuario'
  const rol = (user.rol || 'cliente').toLowerCase()

  const base = [{ href: 'inicio.html', label: 'Inicio', icon: '🏠' }]
  const menus = {
    cliente:    [{ href: 'eventos.html', label: 'Eventos', icon: '📅' }, { href: 'soporte.html', label: 'Soporte', icon: '🛟' }],
    entrenador: [{ href: 'personas.html', label: 'Clientes', icon: '👥' }, { href: 'eventos.html', label: 'Eventos', icon: '📅' }],
    admin: [
      { href: 'registrar.html',    label: 'Registrar',   icon: '➕' },
      { href: 'personas.html',     label: 'Personas',    icon: '👥' },
      { href: 'informes.html',     label: 'Informes',    icon: '📊' },
      { href: 'eventos.html',      label: 'Eventos',     icon: '📅' },
      { href: 'validaciones.html', label: 'Validaciones',icon: '✅' },
      { href: 'soporte.html',      label: 'Soporte',     icon: '🛟' }
    ]
  }

  const links   = [...base, ...(menus[rol] || [])]
  const liItems = links.map(l => `
    <li>
      <a href="${l.href}" class="${l.href === activePage ? 'active' : ''}">
        ${l.icon} ${l.label}
      </a>
    </li>`).join('')

  return `
  <nav class="navbar">
    <a href="inicio.html" class="nav-logo">
      <div class="nav-logo-icon">
        <svg viewBox="0 0 40 40" width="24" height="24">
          <rect x="2" y="14" width="6" height="12" rx="2" fill="#38bdf8"/>
          <rect x="8" y="16" width="3" height="8" rx="1" fill="#0ea5e9"/>
          <rect x="11" y="8" width="18" height="24" rx="3" fill="#0284c7"/>
          <rect x="29" y="16" width="3" height="8" rx="1" fill="#0ea5e9"/>
          <rect x="32" y="14" width="6" height="12" rx="2" fill="#38bdf8"/>
          <rect x="14" y="17" width="12" height="4" rx="2" fill="#fff" opacity="0.9"/>
        </svg>
      </div>
      <span class="nav-logo-text">APP GYM CÚCUTA</span>
    </a>
    <button class="nav-toggle" id="nav-toggle" aria-label="Menú" onclick="(function(){
      document.getElementById('nav-links-list').classList.toggle('open');
      document.getElementById('nav-right-bar').classList.toggle('open');
    })()">
      <span></span><span></span><span></span>
    </button>
    <ul class="nav-links" id="nav-links-list">${liItems}</ul>
    <div class="nav-right" id="nav-right-bar">
      <span class="nav-user">👤 ${nombre} <small style="opacity:0.7">(${rol})</small></span>
      <button class="btn-logout" onclick="logout()">⏻ Salir</button>
    </div>
  </nav>`
}

window.logout = () => {
  swalConfirm('¿Cerrar sesión?', '¿Estás seguro que deseas salir?', '⏻ Salir').then(ok => {
    if (ok) { Auth.logout(); window.location.href = 'index.html' }
  })
}
