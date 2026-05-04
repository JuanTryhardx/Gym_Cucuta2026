// ============================================================
// models/TicketModel.js
// ============================================================
import { supabase } from '../services/supabase.js'

export const TicketModel = {

  async getAll() {
    const { data, error } = await supabase
      .from('tickets').select('*').order('fecha', { ascending: false })
    if (error) throw error
    return data || []
  },

  async insert(payload) {
    const { error } = await supabase.from('tickets').insert([payload])
    if (error) throw error
  }
}
