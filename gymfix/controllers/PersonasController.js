// ============================================================
// controllers/PersonasController.js
// ============================================================
import { Auth }         from '../services/auth.js'
import { showToast, buildNavbar, formatMoney, formatDate } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'

export const PersonasController = {

  async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('personas.html')
    await this.cargarPersonas()

    document.getElementById('buscarInput')?.addEventListener('input', e => {
      this._filtrar(e.target.value)
    })

    window.openEdit   = (id) => this.openEdit(id)
    window.eliminar   = (id) => this.eliminar(id)
    window.closeEdit  = ()   => this.closeEdit()
    window.guardarEdicion = () => this.guardarEdicion()
  },

  async cargarPersonas() {
    try {
      const data = await PersonaModel.getAll()
      this._data = data
      this._renderTabla(data)
    } catch(e) {
      console.error(e)
      showToast('❌ Error al cargar datos', '#f87171')
    }
  },

  _filtrar(texto) {
    const q = texto.toLowerCase()
    const filtrado = this._data.filter(p =>
      (p.nombre    || '').toLowerCase().includes(q) ||
      (p.documento || '').toLowerCase().includes(q) ||
      (p.email     || '').toLowerCase().includes(q)
    )
    this._renderTabla(filtrado)
  },

  _renderTabla(data) {
    const tbody    = document.getElementById('tablaPersonas')
    const emptyMsg = document.getElementById('emptyMsg')
    const count    = document.getElementById('countLabel')

    if (!data || data.length === 0) {
      tbody.innerHTML = ''
      emptyMsg.style.display = 'block'
      count.textContent = '0 miembros'
      return
    }

    emptyMsg.style.display = 'none'
    count.textContent = `${data.length} miembros`

    tbody.innerHTML = data.map(p => `
      <tr>
        <td>
          <div style="display:flex;gap:10px;align-items:center">
            <div style="background:#38bdf8;color:#000;border-radius:50%;width:35px;height:35px;
                        display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0">
              ${p.nombre ? p.nombre.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <div style="font-weight:bold">${p.nombre || '-'}</div>
              <div style="font-size:12px;color:#aaa">${p.email || '-'}</div>
            </div>
          </div>
        </td>
        <td>${p.documento || '-'}</td>
        <td>${p.telefono  || '-'}</td>
        <td>${p.plan_id   || '-'}</td>
        <td>${formatMoney(p.mensualidad || 0)}</td>
        <td>${formatDate(p.fecha_inicio)}</td>
        <td>${p.estado    || 'Activo'}</td>
        <td>
          <button onclick="openEdit(${p.id})">✏️</button>
          <button onclick="eliminar(${p.id})">🗑️</button>
        </td>
      </tr>`).join('')
  },

  async eliminar(id) {
    if (!confirm('¿Eliminar esta persona?')) return
    try {
      await PersonaModel.delete(id)
      showToast('🗑️ Eliminado correctamente')
      await this.cargarPersonas()
    } catch(e) {
      console.error(e)
      showToast('❌ Error al eliminar', '#f87171')
    }
  },

  async openEdit(id) {
    try {
      const p = await PersonaModel.getById(id)
      const fields = {
        e_id: p.id, e_nombre: p.nombre, e_documento: p.documento,
        e_telefono: p.telefono, e_email: p.email, e_plan: p.plan_id || 1,
        e_mensualidad: p.mensualidad || 0, e_estado: p.estado || 'Activo',
        e_objetivo: p.objetivo || 'General', e_entrenador: p.entrenador || '',
        e_peso: p.peso || '', e_altura: p.altura || '', e_obs: p.observaciones || ''
      }
      Object.entries(fields).forEach(([k, v]) => {
        const el = document.getElementById(k)
        if (el) el.value = v
      })
      document.getElementById('editModal').style.display = 'flex'
    } catch(e) {
      console.error(e)
      showToast('❌ Error al cargar datos', '#f87171')
    }
  },

  async guardarEdicion() {
    const id = document.getElementById('e_id').value
    const payload = {
      nombre: document.getElementById('e_nombre').value,
      documento: document.getElementById('e_documento').value,
      telefono: document.getElementById('e_telefono').value,
      email: document.getElementById('e_email').value,
      plan_id: document.getElementById('e_plan').value,
      mensualidad: parseFloat(document.getElementById('e_mensualidad').value) || 0,
      estado: document.getElementById('e_estado').value,
      objetivo: document.getElementById('e_objetivo').value,
      entrenador: document.getElementById('e_entrenador').value,
      peso: parseFloat(document.getElementById('e_peso').value) || null,
      altura: parseFloat(document.getElementById('e_altura').value) || null,
      observaciones: document.getElementById('e_obs').value
    }
    try {
      await PersonaModel.update(id, payload)
      showToast('✅ Cambios guardados correctamente')
      this.closeEdit()
      await this.cargarPersonas()
    } catch(e) {
      console.error(e)
      showToast('❌ Error al guardar', '#f87171')
    }
  },

  closeEdit() {
    document.getElementById('editModal').style.display = 'none'
  },

  _data: []
}
