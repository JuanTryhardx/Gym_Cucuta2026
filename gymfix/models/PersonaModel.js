// ============================================================
// models/PersonaModel.js
// CRUD sobre la tabla "personas" en Supabase.
// ============================================================
import { supabase } from '../services/supabase.js'

export const PersonaModel = {

  async getAll() {
    const { data, error } = await supabase
      .from('personas').select('*').order('id', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('personas').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async getByEmail(email) {
    const { data } = await supabase
      .from('personas').select('id').eq('email', email)
    return data || []
  },

  async getByDocumento(documento) {
    const { data } = await supabase
      .from('personas').select('id').eq('documento', documento)
    return data || []
  },

  async getStats() {
    const { data } = await supabase
      .from('personas').select('estado, mensualidad, fecha_registro')
    return data || []
  },

  async getUltimos(limit = 5) {
    const { data } = await supabase
      .from('personas')
      .select('nombre, estado, fecha_registro')
      .order('id', { ascending: false })
      .limit(limit)
    return data || []
  },

  async insert(payload) {
    const { error } = await supabase.from('personas').insert([payload])
    if (error) throw error
  },

  async update(id, payload) {
    const { error } = await supabase
      .from('personas').update(payload).eq('id', id)
    if (error) throw error
  },

  async delete(id) {
    const { error } = await supabase
      .from('personas').delete().eq('id', id)
    if (error) throw error
  }
}
