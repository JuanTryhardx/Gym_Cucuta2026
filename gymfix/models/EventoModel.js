// ============================================================
// models/EventoModel.js
// ============================================================
import { supabase } from '../services/supabase.js'

export const EventoModel = {

  async getAll() {
    const { data, error } = await supabase
      .from('eventos').select('*').order('fecha', { ascending: true })
    if (error) throw error
    return data || []
  },

  async getProximos(limit = 3) {
    const hoy = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('eventos').select('*')
      .gte('fecha', hoy).order('fecha', { ascending: true }).limit(limit)
    return data || []
  },

  async insert(payload) {
    const { error } = await supabase.from('eventos').insert([payload])
    if (error) throw error
  },

  async delete(id) {
    const { error } = await supabase.from('eventos').delete().eq('id', id)
    if (error) throw error
  }
}
