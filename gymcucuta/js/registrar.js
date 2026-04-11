checkAuth();
document.getElementById('navbar-container').innerHTML = buildNavbar('registrar.html');

// set default date to today
document.getElementById('r_inicio').value = new Date().toISOString().split('T')[0];

function renderSidebar() {
  const s = DB.getStats();
  document.getElementById('regStats').innerHTML = `
    <div class="reg-stat-item"><span class="reg-stat-label">Total miembros</span><span class="reg-stat-val">${s.total}</span></div>
    <div class="reg-stat-item"><span class="reg-stat-label">Activos</span><span class="reg-stat-val" style="color:#4ade80">${s.activos}</span></div>
    <div class="reg-stat-item"><span class="reg-stat-label">Inactivos</span><span class="reg-stat-val" style="color:#f87171">${s.inactivos}</span></div>
    <div class="reg-stat-item"><span class="reg-stat-label">Ingresos</span><span class="reg-stat-val" style="font-size:0.95rem">${formatMoney(s.ingresos)}</span></div>
  `;
  const personas = DB.getPersonas().slice(-4).reverse();
  document.getElementById('ultimosReg').innerHTML = personas.length ? personas.map(p => `
    <div class="reg-member-mini">
      <div class="reg-avatar">${p.nombre.charAt(0).toUpperCase()}</div>
      <div><div class="reg-member-name">${p.nombre}</div><div class="reg-member-plan">${p.plan} · ${p.estado}</div></div>
    </div>`).join('') : '<p style="color:var(--text-muted);font-size:0.85rem">Sin registros aún.</p>';
}

function registrarPersona() {
  const nombre = document.getElementById('r_nombre').value.trim();
  const documento = document.getElementById('r_documento').value.trim();
  const mensualidad = document.getElementById('r_mensualidad').value;
  const plan = document.getElementById('r_plan').value;
  if (!nombre || !documento) { showToast('⚠️ Nombre y documento son obligatorios', '#fbbf24'); return; }

  const persona = {
    id: Date.now(),
    nombre,
    documento,
    nacimiento: document.getElementById('r_nacimiento').value,
    genero: document.getElementById('r_genero').value,
    telefono: document.getElementById('r_telefono').value,
    email: document.getElementById('r_email').value,
    direccion: document.getElementById('r_direccion').value,
    plan,
    mensualidad: parseFloat(mensualidad) || 0,
    inicio: document.getElementById('r_inicio').value,
    entrenador: document.getElementById('r_entrenador').value,
    objetivo: document.getElementById('r_objetivo').value,
    estado: document.getElementById('r_estado').value,
    peso: document.getElementById('r_peso').value,
    altura: document.getElementById('r_altura').value,
    emergencia: document.getElementById('r_emergencia').value,
    observaciones: document.getElementById('r_obs').value,
    fechaRegistro: new Date().toISOString()
  };

  const personas = DB.getPersonas();
  personas.push(persona);
  DB.setPersonas(personas);

  showToast(`✅ ${nombre} registrado exitosamente`);
  limpiarForm();
  renderSidebar();
}

function limpiarForm() {
  ['r_nombre','r_documento','r_nacimiento','r_telefono','r_email','r_direccion',
   'r_mensualidad','r_entrenador','r_peso','r_altura','r_emergencia','r_obs']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('r_inicio').value = new Date().toISOString().split('T')[0];
}


renderSidebar();


import { supabase } from './supabase.js'

const form = document.querySelector('#formRegistro')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const nombre = document.querySelector('#nombre').value
  const edad = document.querySelector('#edad').value
  const plan_id = document.querySelector('#plan').value

  const { error } = await supabase
    .from('personas')
    .insert([
      { nombre, edad, plan_id }
    ])

    
  if (error) {
    console.error(error)
    alert('Error al guardar')
  } else {
    alert('Guardado correctamente 🔥')
    form.reset()
  }
})
