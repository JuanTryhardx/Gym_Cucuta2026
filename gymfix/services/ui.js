// ============================================================
// services/ui.js
// Helpers de UI reutilizables: toast, formato, navbar.
// ============================================================
import { Auth } from './auth.js'

// ── Toast ────────────────────────────────────────────────────
export function showToast(msg, color = '#38bdf8') {
    const t = document.createElement('div')
    t.className = 'toast'
    t.style.borderColor = color
    t.textContent = msg
    document.body.appendChild(t)
    setTimeout(() => t.remove(), 3000)
}
window.showToast = showToast

// ── Formato ──────────────────────────────────────────────────
export function formatMoney(n) {
    return '$' + Number(n || 0).toLocaleString('es-CO')
}
export function formatDate(iso) {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
window.formatMoney = formatMoney
window.formatDate = formatDate

// ── Navbar ───────────────────────────────────────────────────
export function buildNavbar(activePage) {
    const user = Auth.getUser()
    
    // AJUSTE: Como index.html está en la raíz según tu FileZilla, quitamos el "../"
    if (!user) {
        window.location.href = 'index.html'; 
        return ''
    }

    const nombre = user.nombre || user.email || 'Usuario'
    const rol = user.rol || 'cliente'

    const base = [{ href: 'inicio.html', label: 'Inicio', icon: '🏠' }]

    const byRol = {
        cliente: [
            { href: 'eventos.html', label: 'Eventos', icon: '📅' },
            { href: 'soporte.html', label: 'Soporte', icon: '🛟' }
        ],
        entrenador: [
            { href: 'personas.html', label: 'Clientes', icon: '👥' },
            { href: 'eventos.html', label: 'Eventos', icon: '📅' }
        ],
        admin: [
            { href: 'registrar.html', label: 'Registrar', icon: '➕' },
            { href: 'personas.html', label: 'Personas', icon: '👥' },
            { href: 'informes.html', label: 'Informes', icon: '📊' },
            { href: 'eventos.html', label: 'Eventos', icon: '📅' },
            { href: 'soporte.html', label: 'Soporte', icon: '🛟' },
            { href: 'validaciones.html', label: 'Validaciones',icon: '✅' }
        ]
    }

    const links = [...base, ...(byRol[rol] || [])]
    const liItems = links.map(l => `
        <li><a href="${l.href}" class="${l.href === activePage ? 'active' : ''}">${l.icon} ${l.label}</a></li>
    `).join('')

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
            <span class="nav-user">👤 ${nombre} (${rol})</span>
            <button class="btn-logout" onclick="logout()">⏻ Salir</button>
        </div>
    </nav>`
}

// AJUSTE: Quitamos el "../" porque index.html está al mismo nivel que las otras páginas en FileZilla
window.logout = () => {
    Auth.logout();
    window.location.href = 'index.html';
}
