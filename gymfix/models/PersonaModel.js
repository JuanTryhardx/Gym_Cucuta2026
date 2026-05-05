// ============================================================
// models/PersonaModel.js
// CRUD sobre la tabla "personas" en Supabase.
// Estructura optimizada para Alto Rendimiento - Gym Cúcuta
// ============================================================
import { supabase } from '../services/supabase.js'

export const PersonaModel = {

    /**
     * Obtiene todos los miembros con todos sus campos
     */
    async getAll() {
        const { data, error } = await supabase
            .from('personas')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) {
            console.error("Error en PersonaModel.getAll:", error.message);
            throw error;
        }
        return data || [];
    },

    /**
     * Obtiene un miembro específico por ID
     */
    async getById(id) {
        const { data, error } = await supabase
            .from('personas')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            console.error(`Error al buscar ID ${id}:`, error.message);
            throw error;
        }
        return data;
    },

    /**
     * Verificaciones rápidas para duplicados (Email/Documento)
     */
    async getByEmail(email) {
        const { data } = await supabase
            .from('personas')
            .select('id')
            .eq('email', email);
        return data || [];
    },

    async getByDocumento(documento) {
        const { data } = await supabase
            .from('personas')
            .select('id')
            .eq('documento', documento);
        return data || [];
    },

    /**
     * OPTIMIZADO: Obtiene solo los campos necesarios para los gráficos de Informes
     */
    async getStats() {
        const { data, error } = await supabase
            .from('personas')
            .select('estado, mensualidad, fecha_registro, plan_id, objetivo');
        
        if (error) {
            console.error("Error en PersonaModel.getStats:", error.message);
            return [];
        }
        return data || [];
    },

    /**
     * Obtiene los últimos registros para el dashboard de inicio
     */
    async getUltimos(limit = 5) {
        const { data, error } = await supabase
            .from('personas')
            .select('nombre, estado, fecha_registro')
            .order('fecha_registro', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error("Error en PersonaModel.getUltimos:", error.message);
            return [];
        }
        return data || [];
    },

    // --- OPERACIONES DE ESCRITURA ---

    async insert(payload) {
        const { error } = await supabase.from('personas').insert([payload]);
        if (error) {
            console.error("Error al insertar miembro:", error.message);
            throw error;
        }
    },

    async update(id, payload) {
        const { error } = await supabase
            .from('personas')
            .update(payload)
            .eq('id', id);
        
        if (error) {
            console.error(`Error al actualizar ID ${id}:`, error.message);
            throw error;
        }
    },

    async delete(id) {
        const { error } = await supabase
            .from('personas')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error(`Error al eliminar ID ${id}:`, error.message);
            throw error;
        }
    }
}
