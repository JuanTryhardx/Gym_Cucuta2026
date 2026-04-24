// ===== SOLICITUDES.JS =====
// Panel de administración de solicitudes de entrenadores.
// Se carga desde inicio.html como módulo adicional.
// NO modifica ningún código existente de inicio.js.

import { supabase } from './supabase.js'
import { showToast } from './app.js'

// ── Renderizar bloque de solicitudes en el dashboard ──────────────────────
export async function renderSolicitudesPanel () {
  const container = document.getElementById('solicitudesPanel')
  if (!container) return

  const { data, error } = await supabase
    .from('solicitudes_entrenador')
    .select('*')
    .eq('estado', 'pendiente')
    .order('fecha_solicitud', { ascending: false })

  if (error) {
    container.innerHTML = '<p style="color:#f87171;font-size:0.85rem">Error al cargar solicitudes.</p>'
    return
  }

  // Badge en la tarjeta
  const badge = document.getElementById('solicitudesBadge')
  if (badge) {
    badge.textContent = data.length > 0 ? data.length : ''
    badge.style.display = data.length > 0 ? 'inline-flex' : 'none'
  }

  if (!data.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;text-align:center;padding:12px 0">No hay solicitudes pendientes. ✅</p>'
    return
  }

  container.innerHTML = data.map(s => `
    <div class="solicitud-item" id="sol-${s.id}">
      <div class="solicitud-info">
        <div class="solicitud-nombre">${s.nombre}</div>
        <div class="solicitud-meta">
          <span>📄 ${s.documento}</span>
          ${s.email ? `<span>📧 ${s.email}</span>` : ''}
          ${s.telefono ? `<span>📞 ${s.telefono}</span>` : ''}
        </div>
        <div class="solicitud-especialidad">🎯 ${s.especialidad}</div>
        ${s.motivacion ? `<div class="solicitud-motivacion">"${s.motivacion}"</div>` : ''}
        <div class="solicitud-fecha">Recibida: ${new Date(s.fecha_solicitud).toLocaleDateString('es-CO', {day:'2-digit',month:'short',year:'numeric'})}</div>
      </div>
      <div class="solicitud-acciones">
        <button class="btn-aprobar" onclick="aprobarEntrenador(${s.id})">✅ Aprobar</button>
        <button class="btn-rechazar" onclick="rechazarSolicitud(${s.id})">❌ Rechazar</button>
      </div>
    </div>
  `).join('')
}

// ── Aprobar: crea entrenador + marca solicitud aprobada ───────────────────
window.aprobarEntrenador = async function (id) {
  if (!confirm('¿Aprobar esta solicitud y crear el entrenador?')) return

  const { data: sol, error: errGet } = await supabase
    .from('solicitudes_entrenador')
    .select('*')
    .eq('id', id)
    .single()

  if (errGet || !sol) {
    showToast('❌ No se pudo obtener la solicitud', '#f87171')
    return
  }

  // 1. Insertar en tabla entrenadores (estructura existente)
  const { error: errInsert } = await supabase
    .from('entrenadores')
    .insert([{
      nombre:       sol.nombre,
      especialidad: sol.especialidad,
      telefono:     sol.telefono || null,
      email:        sol.email || null,
    }])

  if (errInsert) {
    console.error('Error creando entrenador:', errInsert)
    showToast('❌ Error al crear el entrenador', '#f87171')
    return
  }

  // 2. Actualizar estado de la solicitud
  const { error: errUpdate } = await supabase
    .from('solicitudes_entrenador')
    .update({ estado: 'aprobado', fecha_resolucion: new Date().toISOString() })
    .eq('id', id)

  if (errUpdate) {
    console.error('Error actualizando solicitud:', errUpdate)
  }

  showToast(`✅ ${sol.nombre} aprobado como entrenador`)
  renderSolicitudesPanel()
}

// ── Rechazar solicitud ────────────────────────────────────────────────────
window.rechazarSolicitud = async function (id) {
  if (!confirm('¿Rechazar esta solicitud?')) return

  const { error } = await supabase
    .from('solicitudes_entrenador')
    .update({ estado: 'rechazado', fecha_resolucion: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    showToast('❌ Error al rechazar', '#f87171')
    return
  }

  showToast('🚫 Solicitud rechazada', '#fbbf24')
  renderSolicitudesPanel()
}

// ── Auto-init cuando el módulo se carga ────────────────────────────────────
renderSolicitudesPanel()
