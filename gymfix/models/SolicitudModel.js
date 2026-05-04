// ============================================================
// models/SolicitudModel.js
// CRUD sobre "solicitudes_entrenador".
// ============================================================
import { supabase } from '../services/supabase.js'

export const SolicitudModel = {

  async getAll() {
    const { data, error } = await supabase
      .from('solicitudes_entrenador').select('*')
      .order('fecha_solicitud', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getPendientes() {
    const { data, error } = await supabase
      .from('solicitudes_entrenador').select('*')
      .eq('estado', 'pendiente')
      .order('fecha_solicitud', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('solicitudes_entrenador').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async existePendiente(documento) {
    const { data } = await supabase
      .from('solicitudes_entrenador').select('id')
      .eq('documento', documento).eq('estado', 'pendiente')
    return (data || []).length > 0
  },

  async insert(payload) {
    const { error } = await supabase
      .from('solicitudes_entrenador').insert([payload])
    if (error) throw error
  },

  async updateEstado(id, estado) {
    const { data, error } = await supabase
      .from('solicitudes_entrenador')
      .update({ estado, fecha_resolucion: new Date().toISOString() })
      .eq('id', id).select()
    if (error) throw error
    return data
  }
}
