// ===== AUTH GUARD =====
function checkAuth() {
  if (!sessionStorage.getItem('gymLoggedIn')) {
    window.location.href = 'login.html';
  }
}

// ===== LOGOUT =====
function logout() {
  sessionStorage.removeItem('gymLoggedIn');
  sessionStorage.removeItem('gymUser');
  window.location.href = 'login.html';
}

// ===== DATA STORE (localStorage) =====
const DB = {
  getPersonas: () => JSON.parse(localStorage.getItem('gym_personas') || '[]'),
  setPersonas: (data) => localStorage.setItem('gym_personas', JSON.stringify(data)),
  getNoticias: () => JSON.parse(localStorage.getItem('gym_noticias') || JSON.stringify(defaultNoticias())),
  setNoticias: (data) => localStorage.setItem('gym_noticias', JSON.stringify(data)),
  getEventos: () => JSON.parse(localStorage.getItem('gym_eventos') || JSON.stringify(defaultEventos())),
  setEventos: (data) => localStorage.setItem('gym_eventos', JSON.stringify(data)),
  getStats: () => {
    const personas = DB.getPersonas();
    const activos = personas.filter(p => p.estado === 'Activo').length;
    const ingresos = personas.reduce((s, p) => s + (parseFloat(p.mensualidad) || 0), 0);
    const hoy = new Date().toDateString();
    const nuevosHoy = personas.filter(p => p.fechaRegistro && new Date(p.fechaRegistro).toDateString() === hoy).length;
    return {
      total: personas.length,
      activos,
      inactivos: personas.length - activos,
      ingresos,
      nuevosHoy
    };
  }
};

function defaultNoticias() {
  return [
    { id: 1, titulo: '¡Bienvenidos a App Gym Cúcuta!', contenido: 'Sistema de administración ahora disponible para todos los entrenadores y staff.', fecha: new Date().toISOString(), tipo: 'info', autor: 'Admin' },
    { id: 2, titulo: 'Nuevos horarios disponibles', contenido: 'Se actualizaron los horarios de clases grupales para este mes. Consulta la sección de eventos.', fecha: new Date(Date.now() - 86400000).toISOString(), tipo: 'update', autor: 'Admin' },
    { id: 3, titulo: 'Mantenimiento de equipos', contenido: 'Se realizará mantenimiento preventivo a las máquinas el próximo sábado de 6AM a 10AM.', fecha: new Date(Date.now() - 172800000).toISOString(), tipo: 'aviso', autor: 'Admin' }
  ];
}

function defaultEventos() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  return [
    { id: 1, titulo: 'Clase de Zumba', fecha: new Date(y, m, 15).toISOString().split('T')[0], hora: '08:00', tipo: 'clase', descripcion: 'Clase grupal de Zumba para todos los niveles' },
    { id: 2, titulo: 'Torneo Interno', fecha: new Date(y, m, 20).toISOString().split('T')[0], hora: '10:00', tipo: 'evento', descripcion: 'Competencia interna de levantamiento de pesas' },
    { id: 3, titulo: 'Evaluación Física', fecha: new Date(y, m, 25).toISOString().split('T')[0], hora: '07:00', tipo: 'evaluacion', descripcion: 'Evaluación física mensual para miembros activos' }
  ];
}

// ===== NAVBAR BUILDER =====
function buildNavbar(activePage) {
  const user = sessionStorage.getItem('gymUser') || 'Admin';
  const links = [
    { href: 'inicio.html', label: 'Inicio', icon: '🏠' },
    { href: 'registrar.html', label: 'Registrar Persona', icon: '➕' },
    { href: 'personas.html', label: 'Personas', icon: '👥' },
    { href: 'informes.html', label: 'Informes', icon: '📊' },
    { href: 'eventos.html', label: 'Eventos', icon: '📅' },
    { href: 'soporte.html', label: 'Soporte', icon: '🛟' },
  ];

  const liItems = links.map(l => `
    <li><a href="${l.href}" class="${l.href === activePage ? 'active' : ''}">${l.icon} ${l.label}</a></li>
  `).join('');

  return `
  <nav class="navbar">
    <a class="nav-logo" href="inicio.html">
      <div class="nav-logo-icon">
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" width="26" height="26">
          <rect x="2" y="14" width="7" height="12" rx="2.5" fill="#38bdf8"/>
          <rect x="9" y="17" width="3" height="6" rx="1.5" fill="#0ea5e9"/>
          <rect x="12" y="9" width="16" height="22" rx="3" fill="#0284c7"/>
          <rect x="14" y="13" width="12" height="14" rx="2" fill="#38bdf8" opacity="0.25"/>
          <rect x="28" y="17" width="3" height="6" rx="1.5" fill="#0ea5e9"/>
          <rect x="31" y="14" width="7" height="12" rx="2.5" fill="#38bdf8"/>
          <rect x="16" y="18" width="8" height="3" rx="1.5" fill="#fff" opacity="0.9"/>
        </svg>
      </div>
      <span class="nav-logo-text">APP GYM CÚCUTA</span>
    </a>
    <ul class="nav-links">${liItems}</ul>
    <div class="nav-right">
      <span class="nav-user">Hola, <span>${user}</span></span>
      <button class="btn-logout" onclick="logout()">🚪 Salir</button>
    </div>
  </nav>`;
}

// ===== TOAST =====
function showToast(msg, color = '#38bdf8') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.borderColor = color;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ===== FORMAT =====
function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatMoney(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}
