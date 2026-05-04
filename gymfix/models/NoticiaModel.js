// ============================================================
// models/NoticiaModel.js
// ============================================================
import { supabase } from '../services/supabase.js'

export const NoticiaModel = {

  async getAll() {
    const { data, error } = await supabase
      .from('noticias').select('*').order('fecha', { ascending: false })
    if (error) throw error
    return data || []
  },

  async insert(payload) {
    const { error } = await supabase.from('noticias').insert([payload])
    if (error) throw error
  },

  async delete(id) {
    const { error } = await supabase.from('noticias').delete().eq('id', id)
    if (error) throw error
  }
}
