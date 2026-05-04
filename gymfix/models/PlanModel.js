// ============================================================
// models/PlanModel.js
// ============================================================
import { supabase } from '../services/supabase.js'

export const PlanModel = {

  async getAll() {
    const { data, error } = await supabase
      .from('planes').select('id, nombre, precio').order('precio')
    if (error) throw error
    return data || []
  }
}
