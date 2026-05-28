// ============================================================
// models/ContenidoModel.js — Videos y Beneficios del Inicio
// Requiere tablas: gym_videos, gym_beneficios en Supabase
// ============================================================
import { supabase } from '../services/supabase.js'

export const ContenidoModel = {

  // ── VIDEOS ────────────────────────────────────────────────

  async getVideos() {
    const { data, error } = await supabase
      .from('gym_videos')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data || []).map(v => ({ ...v, desc: v.descripcion }))
  },

  async insertVideo(payload) {
    const { data, error } = await supabase
      .from('gym_videos')
      .insert([{ 
        titulo:      payload.titulo,
        url:         payload.url,
        tag:         payload.tag,
        descripcion: payload.desc,
        created_at:  new Date().toISOString()
      }])
      .select()
      .single()
    if (error) throw error
    return { ...data, desc: data.descripcion }
  },

  async deleteVideo(id) {
    const { error } = await supabase
      .from('gym_videos').delete().eq('id', id)
    if (error) throw error
  },

  // ── BENEFICIOS ────────────────────────────────────────────

  async getBeneficios() {
    const { data, error } = await supabase
      .from('gym_beneficios')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data || []).map(b => ({ ...b, desc: b.descripcion }))
  },

  async insertBeneficio(payload) {
    const { data, error } = await supabase
      .from('gym_beneficios')
      .insert([{
        titulo:      payload.titulo,
        descripcion: payload.desc,
        created_at:  new Date().toISOString()
      }])
      .select()
      .single()
    if (error) throw error
    return { ...data, desc: data.descripcion }
  },

  async deleteBeneficio(id) {
    const { error } = await supabase
      .from('gym_beneficios').delete().eq('id', id)
    if (error) throw error
  }
}
