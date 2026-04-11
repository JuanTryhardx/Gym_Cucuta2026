import { checkAuth, buildNavbar, showToast, formatMoney, formatDate, supabase } from './app.js'

checkAuth()
document.getElementById('navbar-container').innerHTML = buildNavbar('personas.html')

const PLANES = { 1: 'Mensual', 2: 'Trimestral', 3: 'Semestral', 4: 'Anual', 5: 'Clase suelta' }
let todasPersonas = []

async function cargarPersonas() {
  const tbody = document.getElementById('tablaPersonas')
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:30px">Cargando...</td></tr>'
  const { data, error } = await supabase.from('personas').select('*').order('id', { ascending: false })
  if (error) { console.error(error); showToast('❌ Error al cargar', '#f87171'); return }
  todasPersonas = data || []
  aplicarFiltros()
}

function aplicarFiltros() {
  const buscar = document.getElementById('buscar').value.toLowerCase()
  const estado = document.getElementById('filtroEstado').value
  const plan   = document.getElementById('filtroPlan').value
  const lista  = todasPersonas.filter(p => {
    const matchBuscar = !buscar || (p.nombre||'').toLowerCase().includes(buscar) || (p.documento||'').toLowerCase().includes(buscar)
    const matchEstado = !estado || p.estado === estado
    const planNombre  = PLANES[p.plan_id] || ''
    const matchPlan   = !plan || planNombre === plan
    return matchBuscar && matchEstado && matchPlan
  })
  renderTabla(lista)
}

function renderTabla(lista) {
  const tbody      = document.getElementById('tablaPersonas')
  const emptyMsg   = document.getElementById('emptyMsg')
  const countLabel = document.getElementById('countLabel')
  countLabel.textContent = `${lista.length} miembro${lista.length !== 1 ? 's' : ''}`
  if (!lista.length) { emptyMsg.style.display = 'block'; tbody.innerHTML = ''; return }
  emptyMsg.style.display = 'none'
  tbody.innerHTML = lista.map(p => {
    const iniciales  = (p.nombre||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
    const planNombre = PLANES[p.plan_id] || p.plan_id || '-'
    const estadoCls  = { 'Activo':'badge-active','Inactivo':'badge-inactive','Pendiente':'badge-pending' }[p.estado] || 'badge-pending'
    return `<tr>
      <td><div class="member-name-cell">
        <div class="mem-avatar">${iniciales}</div>
        <div><div class="mem-name">${p.nombre||'-'}</div><div class="mem-email">${p.email||''}</div></div>
      </div></td>
      <td>${p.documento||'-'}</td>
      <td>${p.telefono||'-'}</td>
      <td>${planNombre}</td>
      <td>${formatMoney(p.mensualidad)}</td>
      <td>${p.fecha_inicio ? formatDate(p.fecha_inicio) : '-'}</td>
      <td><span class="badge ${estadoCls}">${p.estado||'-'}</span></td>
      <td style="display:flex;gap:6px">
        <button class="btn-edit" onclick="abrirEditar(${p.id})">✏️ Editar</button>
        <button class="btn-del"  onclick="eliminar(${p.id})">🗑️</button>
      </td>
    </tr>`
  }).join('')
}

window.eliminar = async function (id) {
  if (!confirm('¿Eliminar este miembro? Esta acción no se puede deshacer.')) return
  const { error } = await supabase.from('personas').delete().eq('id', id)
  if (error) { showToast('❌ Error al eliminar', '#f87171'); return }
  showToast('🗑️ Miembro eliminado', '#f87171')
  cargarPersonas()
}

window.abrirEditar = function (id) {
  const p = todasPersonas.find(x => x.id === id)
  if (!p) return
  document.getElementById('e_id').value          = p.id
  document.getElementById('e_nombre').value      = p.nombre       || ''
  document.getElementById('e_documento').value   = p.documento    || ''
  document.getElementById('e_telefono').value    = p.telefono     || ''
  document.getElementById('e_email').value       = p.email        || ''
  document.getElementById('e_mensualidad').value = p.mensualidad  || ''
  document.getElementById('e_entrenador').value  = p.entrenador   || ''
  document.getElementById('e_peso').value        = p.peso         || ''
  document.getElementById('e_altura').value      = p.altura       || ''
  document.getElementById('e_obs').value         = p.observaciones|| ''
  const setSelect = (id, val) => {
    const el = document.getElementById(id)
    if (!el) return
    for (let opt of el.options) { if (opt.value === String(val) || opt.text === String(val)) { el.value = opt.value; break } }
  }
  setSelect('e_plan', p.plan_id)
  setSelect('e_estado', p.estado)
  setSelect('e_objetivo', p.objetivo)
  document.getElementById('editModal').style.display = 'flex'
}

window.closeEdit = function () { document.getElementById('editModal').style.display = 'none' }

window.guardarEdicion = async function () {
  const id = document.getElementById('e_id').value
  const updates = {
    nombre:        document.getElementById('e_nombre').value.trim(),
    documento:     document.getElementById('e_documento').value.trim(),
    telefono:      document.getElementById('e_telefono').value.trim(),
    email:         document.getElementById('e_email').value.trim(),
    plan_id:       document.getElementById('e_plan').value,
    mensualidad:   parseFloat(document.getElementById('e_mensualidad').value) || 0,
    estado:        document.getElementById('e_estado').value,
    objetivo:      document.getElementById('e_objetivo').value,
    entrenador:    document.getElementById('e_entrenador').value.trim(),
    peso:          parseFloat(document.getElementById('e_peso').value) || null,
    altura:        parseFloat(document.getElementById('e_altura').value) || null,
    observaciones: document.getElementById('e_obs').value.trim(),
  }
  if (!updates.nombre || !updates.documento) { showToast('⚠️ Nombre y documento son obligatorios', '#fbbf24'); return }
  const { error } = await supabase.from('personas').update(updates).eq('id', id)
  if (error) { console.error(error); showToast('❌ Error al guardar', '#f87171'); return }
  showToast('✅ Cambios guardados')
  closeEdit()
  cargarPersonas()
}

document.getElementById('buscar').addEventListener('input', aplicarFiltros)
document.getElementById('filtroEstado').addEventListener('change', aplicarFiltros)
document.getElementById('filtroPlan').addEventListener('change', aplicarFiltros)

cargarPersonas()
