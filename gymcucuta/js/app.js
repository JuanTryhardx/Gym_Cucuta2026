// ===== AUTH =====
export function checkAuth() {
  const path = window.location.pathname

  // No ejecutar en login
  if (path.includes('login.html')) return

  const logged = sessionStorage.getItem('gymLoggedIn')

  if (!logged) {
    window.location.href = 'login.html'
  }
}

// ===== NAVBAR =====
export function buildNavbar(activePage) {
  const user = sessionStorage.getItem('gymUser') || 'Admin'

  const links = [
    { href: 'inicio.html', label: 'Inicio', icon: '🏠' },
    { href: 'registrar.html', label: 'Registrar', icon: '➕' },
    { href: 'personas.html', label: 'Personas', icon: '👥' }
  ]

  const liItems = links.map(l => `
    <li>
      <a href="${l.href}" class="${l.href === activePage ? 'active' : ''}">
        ${l.icon} ${l.label}
      </a>
    </li>
  `).join('')

  return `
    <nav class="navbar">
      <span>APP GYM</span>
      <ul>${liItems}</ul>
      <button onclick="logout()">Salir</button>
    </nav>
  `
}

// ===== LOGOUT =====
window.logout = function () {
  sessionStorage.clear()
  window.location.href = 'login.html'
}