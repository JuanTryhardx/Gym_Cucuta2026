import { Auth }         from '../services/auth.js'
import { showToast, showLoader, hideLoader, swalConfirm, swalSuccess, swalError, buildNavbar, formatMoney, formatDate } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'

export const PersonasController = {

  async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('personas.html')

    showLoader('Cargando miembros...')
    await this.cargarPersonas()
    hideLoader()

    document.getElementById('buscar')?.addEventListener('input', e => {
      this._filtrar(e.target.value)
    })

    document.getElementById('filtroEstado')?.addEventListener('change', e => {
      this._filtrarEstado(e.target.value)
    })

    // Botones de exportación
    document.getElementById('btnExportPDF')?.addEventListener('click', () => this.exportarPDF())
    document.getElementById('btnExportExcel')?.addEventListener('click', () => this.exportarExcel())

    window.openEdit         = (id) => this.openEdit(id)
    window.eliminar         = (id) => this.eliminar(id)
    window.closeEdit        = ()   => this.closeEdit()
    window.guardarEdicion   = ()   => this.guardarEdicion()
  },

  async cargarPersonas() {
    try {
      const data = await PersonaModel.getAll()
      this._data = data
      this._renderTabla(data)
    } catch(e) {
      console.error(e)
      await swalError('Error al cargar datos', 'No se pudieron obtener los miembros.')
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

  _filtrarEstado(estado) {
    if (!estado) { this._renderTabla(this._data); return }
    this._renderTabla(this._data.filter(p => (p.estado || 'Activo') === estado))
  },

  _estadoBadge(estado) {
    const map = {
      'Activo':    { cls: 'badge-activo',    label: 'Activo'    },
      'Inactivo':  { cls: 'badge-inactivo',  label: 'Inactivo'  },
      'Pendiente': { cls: 'badge-pendiente', label: 'Pendiente' },
    }
    const s = map[estado] || map['Activo']
    return `<span class="status-badge ${s.cls}">${s.label}</span>`
  },

  _planLabel(plan_id) {
    const planes = { 1: 'Mensual', 2: 'Trimestral', 3: 'Semestral', 4: 'Anual' }
    return planes[plan_id] || plan_id || '-'
  },

  // === NUEVA FUNCIÓN AGREGADA ===
  _calcularDiasRestantes(fechaInicioStr, planId) {

    // === NUEVA VALIDACIÓN: Si no hay fecha o no hay plan válido, no calcula ===
    if (!fechaInicioStr || !planId || planId === '-') {
      return '<span class="text-muted">-</span>';
    }

    // Mapeo de días según el tipo de plan
    const duracionPlanes = { 1: 30, 2: 90, 3: 180, 4: 365 };
    const diasDelPlan = duracionPlanes[planId] || 30; // 30 por defecto

    const fechaInicio = new Date(fechaInicioStr);
    const fechaVencimiento = new Date(fechaInicio);
    
    // Le sumamos los días correspondientes del plan
    fechaVencimiento.setDate(fechaInicio.getDate() + diasDelPlan);
    
    const hoy = new Date();
    
    // Calcular diferencia en días
    const diferenciaTiempo = fechaVencimiento - hoy;
    const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
    
    if (diasRestantes > 5) {
      return `<span style="color: #38bdf8; font-weight: bold;">${diasRestantes} días</span>`;
    } else if (diasRestantes > 0 && diasRestantes <= 5) {
      return `<span style="color: #f59e0b; font-weight: bold;">${diasRestantes} días (Por vencer)</span>`;
    } else {
      return `<span style="color: #ef4444; font-weight: bold;">Vencido</span>`;
    }
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
    count.textContent = `${data.length} miembro${data.length !== 1 ? 's' : ''} encontrado${data.length !== 1 ? 's' : ''}`

    tbody.innerHTML = data.map((p, i) => `
      <tr style="animation-delay:${i * 0.04}s">
        <td>
          <div class="member-cell">
            <div class="mem-avatar">${p.nombre ? p.nombre.charAt(0).toUpperCase() : '?'}</div>
            <div class="mem-info">
              <div class="mem-name">${p.nombre || '-'}</div>
              <div class="mem-email">${p.email || '-'}</div>
            </div>
          </div>
        </td>
        <td class="td-doc"><span class="doc-chip">${p.documento || '-'}</span></td>
        <td>${p.telefono || '-'}</td>
        <td><span class="plan-chip">${this._planLabel(p.plan_id)}</span></td>
        <td class="td-money">${formatMoney(p.mensualidad || 0)}</td>
        <td class="td-date">${formatDate(p.fecha_inicio)}</td>
        
        <td>${this._calcularDiasRestantes(p.fecha_inicio, p.plan_id)}</td>
        
        <td>${this._estadoBadge(p.estado)}</td>
        <td class="td-actions">
          <button class="btn-edit" onclick="openEdit(${p.id})" title="Editar">Editar</button>
          <button class="btn-del"  onclick="eliminar(${p.id})" title="Eliminar">Eliminar</button>
        </td>
      </tr>`).join('')
  },

  async eliminar(id) {
    const ok = await swalConfirm('¿Eliminar miembro?', 'Esta acción no se puede deshacer.', ' Sí, eliminar')
    if (!ok) return
    showLoader('Eliminando...')
    try {
      await PersonaModel.delete(id)
      await this.cargarPersonas()
      await swalSuccess('¡Eliminado!', 'El miembro fue eliminado correctamente.')
    } catch(e) {
      console.error(e)
      await swalError('Error al eliminar', 'No se pudo eliminar el registro.')
    } finally { hideLoader() }
  },

  async openEdit(id) {
    showLoader('Cargando datos...')
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
      await swalError('Error', 'No se pudieron cargar los datos del miembro.')
    } finally { hideLoader() }
  },

  async guardarEdicion() {
    const id = document.getElementById('e_id').value
    const payload = {
      nombre:        document.getElementById('e_nombre').value,
      documento:     document.getElementById('e_documento').value,
      telefono:      document.getElementById('e_telefono').value,
      email:         document.getElementById('e_email').value,
      plan_id:       document.getElementById('e_plan').value,
      mensualidad:   parseFloat(document.getElementById('e_mensualidad').value) || 0,
      estado:        document.getElementById('e_estado').value,
      objetivo:      document.getElementById('e_objetivo').value,
      entrenador:    document.getElementById('e_entrenador').value,
      peso:          parseFloat(document.getElementById('e_peso').value) || null,
      altura:        parseFloat(document.getElementById('e_altura').value) || null,
      observaciones: document.getElementById('e_obs').value
    }
    showLoader('Guardando cambios...')
    try {
      await PersonaModel.update(id, payload)
      this.closeEdit()
      await this.cargarPersonas()
      await swalSuccess('¡Guardado!', 'Los cambios fueron aplicados correctamente.')
    } catch(e) {
      console.error(e)
      await swalError('Error al guardar', 'No se pudieron guardar los cambios.')
    } finally { hideLoader() }
  },

  closeEdit() {
    document.getElementById('editModal').style.display = 'none'
  },

  // Exportar PDF 
  exportarPDF() {
    if (!this._data || this._data.length === 0) {
      swalError('Sin datos', 'No hay miembros para exportar.')
      return
    }
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // Header
    doc.setFillColor(10, 15, 26)
    doc.rect(0, 0, 297, 297, 'F')
    doc.setFillColor(13, 31, 53)
    doc.rect(0, 0, 297, 28, 'F')
    doc.setFontSize(18)
    doc.setTextColor(56, 189, 248)
    doc.setFont('helvetica', 'bold')
    doc.text('APP GYM CÚCUTA — Listado de Miembros', 14, 17)
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')} | Total: ${this._data.length} miembros`, 14, 24)

    const cols = ['Nombre', 'Documento', 'Teléfono', 'Plan', 'Mensualidad', 'Inicio', 'Estado']
    const rows = this._data.map(p => [
      p.nombre || '-',
      p.documento || '-',
      p.telefono || '-',
      this._planLabel(p.plan_id),
      formatMoney(p.mensualidad || 0),
      formatDate(p.fecha_inicio),
      p.estado || 'Activo'
    ])

    doc.autoTable({
      head: [cols], body: rows, startY: 34,
      styles: { fillColor: [17, 24, 39], textColor: [226, 232, 240], fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [31, 41, 55] },
      margin: { left: 14, right: 14 }
    })

    doc.save(`gymfix_miembros_${Date.now()}.pdf`)
    swalSuccess('PDF exportado', 'El archivo se descargó correctamente.')
  },

  // Exportar Excel
  exportarExcel() {
    if (!this._data || this._data.length === 0) {
      swalError('Sin datos', 'No hay miembros para exportar.')
      return
    }
    const XLSX = window.XLSX
    const rows = this._data.map(p => ({
      'Nombre':      p.nombre || '',
      'Documento':   p.documento || '',
      'Teléfono':    p.telefono || '',
      'Email':       p.email || '',
      'Plan':        this._planLabel(p.plan_id),
      'Mensualidad': p.mensualidad || 0,
      'Inicio':      formatDate(p.fecha_inicio),
      'Estado':      p.estado || 'Activo',
      'Objetivo':    p.objetivo || '',
      'Entrenador':  p.entrenador || '',
      'Peso (kg)':   p.peso || '',
      'Altura (cm)': p.altura || '',
      'Observaciones': p.observaciones || ''
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Miembros')

    // Ajustar anchos de columna
    ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length, 14) }))

    XLSX.writeFile(wb, `gymfix_miembros_${Date.now()}.xlsx`)
    swalSuccess('Excel exportado', 'El archivo se descargó correctamente.')
  },

  _data: []
}
