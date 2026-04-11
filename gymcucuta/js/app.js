import { supabase } from './supabase.js'

// ===== AUTH =====
export function checkAuth() {
  const path = window.location.pathname
  if (path.includes('index.html') || path.endsWith('/')) return
  const logged = sessionStorage.getItem('gymLoggedIn')
  if (!logged) window.location.href = 'index.html'
}

// ===== NAVBAR =====
export function buildNavbar(activePage) {
  const user = sessionStorage.getItem('gymUser') || 'Admin'
  const links = [
    { href: 'inicio.html',    label: 'Inicio',    icon: '🏠' },
    { href: 'registrar.html', label: 'Registrar', icon: '➕' },
    { href: 'personas.html',  label: 'Personas',  icon: '👥' },
    { href: 'informes.html',  label: 'Informes',  icon: '📊' },
    { href: 'eventos.html',   label: 'Eventos',   icon: '📅' },
    { href: 'soporte.html',   label: 'Soporte',   icon: '🛟' },
  ]
  const liItems = links.map(l => `
    <li><a href="${l.href}" class="${l.href === activePage ? 'active' : ''}">${l.icon} ${l.label}</a></li>
  `).join('')
  return `
    <nav class="navbar">
      <a href="inicio.html" class="nav-logo">
        <div class="nav-logo-icon">
          <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
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
      <ul class="nav-links">${liItems}</ul>
      <div class="nav-right">
        <span class="nav-user">👤 <span>${user}</span></span>
        <button class="btn-logout" onclick="logout()">⏻ Salir</button>
      </div>
    </nav>
  `
}

// ===== LOGOUT =====
window.logout = function () {
  sessionStorage.clear()
  window.location.href = 'index.html'
}

// ===== TOAST =====
export function showToast(msg, color = '#38bdf8') {
  const t = document.createElement('div')
  t.className = 'toast'
  t.style.borderColor = color
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3000)
}
window.showToast = showToast

// ===== FORMATO =====
export function formatMoney(n) {
  return '$' + Number(n || 0).toLocaleString('es-CO')
}
export function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
window.formatMoney = formatMoney
window.formatDate = formatDate

export { supabase }
