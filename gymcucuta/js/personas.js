checkAuth();
document.getElementById('navbar-container').innerHTML = buildNavbar('personas.html');

function getFiltered() {
  const q = document.getElementById('buscar').value.toLowerCase();
  const est = document.getElementById('filtroEstado').value;
  const plan = document.getElementById('filtroPlan').value;
  return DB.getPersonas().filter(p => {
    const matchQ = !q || p.nombre.toLowerCase().includes(q) || (p.documento||'').includes(q);
    const matchEst = !est || p.estado === est;
    const matchPlan = !plan || p.plan === plan;
    return matchQ && matchEst && matchPlan;
  });
}

function badgeEstado(e) {
  const map = { Activo: 'active', Inactivo: 'inactive', Pendiente: 'pending' };
  return `<span class="badge badge-${map[e]||'pending'}">${e}</span>`;
}

function render() {
  const lista = getFiltered();
  const tbody = document.getElementById('tablaPersonas');
  const empty = document.getElementById('emptyMsg');
  document.getElementById('countLabel').textContent = `Mostrando ${lista.length} miembro(s)`;

  if (!lista.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = lista.sort((a,b)=> a.nombre.localeCompare(b.nombre)).map(p => `
    <tr>
      <td>
        <div class="member-name-cell">
          <div class="mem-avatar">${p.nombre.charAt(0).toUpperCase()}</div>
          <div><div class="mem-name">${p.nombre}</div><div class="mem-email">${p.email||'-'}</div></div>
        </div>
      </td>
      <td>${p.documento||'-'}</td>
      <td>${p.telefono||'-'}</td>
      <td>${p.plan||'-'}</td>
      <td>${formatMoney(p.mensualidad||0)}</td>
      <td>${formatDate(p.inicio)}</td>
      <td>${badgeEstado(p.estado||'Pendiente')}</td>
      <td style="display:flex;gap:6px">
        <button class="btn-edit" onclick="openEdit(${p.id})">✏️ Editar</button>
        <button class="btn-del" onclick="eliminar(${p.id})">🗑️</button>
      </td>
    </tr>`).join('');
}

['buscar','filtroEstado','filtroPlan'].forEach(id => document.getElementById(id).addEventListener('input', render));

function eliminar(id) {
  if (!confirm('¿Eliminar este miembro?')) return;
  DB.setPersonas(DB.getPersonas().filter(p => p.id !== id));
  render();
  showToast('🗑️ Miembro eliminado', '#f87171');
}

function openEdit(id) {
  const p = DB.getPersonas().find(x => x.id === id);
  if (!p) return;
  document.getElementById('e_id').value = p.id;
  document.getElementById('e_nombre').value = p.nombre||'';
  document.getElementById('e_documento').value = p.documento||'';
  document.getElementById('e_telefono').value = p.telefono||'';
  document.getElementById('e_email').value = p.email||'';
  document.getElementById('e_plan').value = p.plan||'Mensual';
  document.getElementById('e_mensualidad').value = p.mensualidad||0;
  document.getElementById('e_estado').value = p.estado||'Activo';
  document.getElementById('e_objetivo').value = p.objetivo||'General';
  document.getElementById('e_entrenador').value = p.entrenador||'';
  document.getElementById('e_peso').value = p.peso||'';
  document.getElementById('e_altura').value = p.altura||'';
  document.getElementById('e_obs').value = p.observaciones||'';
  document.getElementById('editModal').style.display = 'flex';
}

function closeEdit() { document.getElementById('editModal').style.display = 'none'; }

function guardarEdicion() {
  const id = parseInt(document.getElementById('e_id').value);
  const personas = DB.getPersonas();
  const idx = personas.findIndex(p => p.id === id);
  if (idx === -1) return;
  personas[idx] = {
    ...personas[idx],
    nombre: document.getElementById('e_nombre').value,
    documento: document.getElementById('e_documento').value,
    telefono: document.getElementById('e_telefono').value,
    email: document.getElementById('e_email').value,
    plan: document.getElementById('e_plan').value,
    mensualidad: parseFloat(document.getElementById('e_mensualidad').value)||0,
    estado: document.getElementById('e_estado').value,
    objetivo: document.getElementById('e_objetivo').value,
    entrenador: document.getElementById('e_entrenador').value,
    peso: document.getElementById('e_peso').value,
    altura: document.getElementById('e_altura').value,
    observaciones: document.getElementById('e_obs').value
  };
  DB.setPersonas(personas);
  closeEdit();
  render();
  showToast('✅ Cambios guardados');
}

render();

import { supabase } from './supabase.js'

async function cargarPersonas() {
  const { data, error } = await supabase
    .from('personas')
    .select('*')

  if (error) {
    console.error(error)
    return
  }

  const tbody = document.getElementById('tablaPersonas')
  const emptyMsg = document.getElementById('emptyMsg')
  const countLabel = document.getElementById('countLabel')

  if (!data || data.length === 0) {
    emptyMsg.style.display = 'block'
    tbody.innerHTML = ''
    countLabel.textContent = '0 miembros'
    return
  }

  emptyMsg.style.display = 'none'
  countLabel.textContent = `${data.length} miembros`

  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.nombre}</td>
      <td>-</td>
      <td>-</td>
      <td>${p.plan_id}</td>
      <td>-</td>
      <td>-</td>
      <td>Activo</td>
      <td>
        <button onclick="eliminar(${p.id})">🗑️</button>
      </td>
    </tr>
  `).join('')
}

// eliminar persona
window.eliminar = async function(id) {
  const confirmacion = confirm('¿Eliminar esta persona?')

  if (!confirmacion) return

  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('Error al eliminar')
  } else {
    alert('Eliminado correctamente')
    cargarPersonas()
  }
}

// ejecutar al cargar
cargarPersonas()
