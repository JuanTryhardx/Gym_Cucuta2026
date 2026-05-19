import { Auth } from '../services/auth.js'
import { buildNavbar, formatMoney, formatDate } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'
import { EventoModel } from '../models/EventoModel.js'
import { NoticiaModel } from '../models/NoticiaModel.js'

export const InicioController = {
    async init() {
    // 1. Validar sesión de usuario
    Auth.requireAuth()
    
    // 2. Renderizar barra de navegación común
    document.getElementById('navbar-container').innerHTML = buildNavbar('inicio.html')
    
    // 3. Modales de interfaz
    window.openNoticiaModal = () => document.getElementById('noticiaModal').style.display = 'flex'
    window.closeNoticiaModal = () => {
      document.getElementById('noticiaModal').style.display = 'none'
      document.getElementById('formNuevaNoticia').reset()
    }

    // 🔥 FIX AQUÍ: Vinculación directa y explícita de la eliminación en el ámbito global
    window.eliminarNoticia = async (id) => {
      if (confirm("¿Estás seguro de que deseas eliminar esta publicación?")) {
        try {
          // Llama directamente al modelo importado
          await NoticiaModel.delete(id)
          
          // Forzamos al controlador a volver a consultar Supabase y redibujar la lista
          await this.renderNoticias() 
        } catch (e) {
          alert("Error: No se pudo eliminar el registro de Supabase.")
          console.error("Detalle del fallo al borrar:", e)
        }
      }
    }

    // 4. Escuchar el envío del formulario de nueva noticia
    const formNoticia = document.getElementById('formNuevaNoticia')
    if (formNoticia) {
      formNoticia.addEventListener('submit', async (e) => {
        e.preventDefault()
        await this.publicarNoticia()
      })
    }
    
    // 5. Cargar módulos iniciales
    await Promise.all([this.renderStats(), this.renderNoticias(), this.renderEventos()])
  },


    async renderStats() {
    try {
      const data = await PersonaModel.getStats()
      const total = data.length
      const activos = data.filter(p => p.estado === 'Activo').length
      // Calculamos automáticamente los miembros que no están activos
      const inactivos = total - activos 
      const ingresos = data.reduce((s, p) => s + (parseFloat(p.mensualidad) || 0), 0)
      
      document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
          <div class="stat-label">Miembros Totales</div>
          <div class="stat-value">${total}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Miembros Activos</div>
          <div class="stat-value" style="color:#4ade80">${activos}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Miembros Inactivos</div>
          <div class="stat-value" style="color:#ef4444">${inactivos}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ingresos Mensuales</div>
          <div class="stat-value" style="color:#3b82f6">${formatMoney(ingresos)}</div>
        </div>`
    } catch(e) { 
      console.error(e) 
    }
  },

    async renderNoticias() {
    const el = document.getElementById('noticiasLista')
    try {
      const data = await NoticiaModel.getAll()
      if (!data || data.length === 0) {
        el.innerHTML = `<p style="color: #aaa; padding: 15px; text-align: center;">No hay actualizaciones publicadas.</p>`
        return
      }
      
      // Inyectamos la estructura con el botón de eliminación al lado derecho
      el.innerHTML = data.map(n => `
        <div class="noticia-item" style="border-bottom: 1px solid rgba(255,255,255,0.06); padding: 12px 0; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div class="noticia-title" style="font-weight: 600; color: #fff; margin-bottom: 4px;">${n.titulo}</div>
            <div class="noticia-content" style="color: #9ca3af; font-size: 0.95rem;">${n.contenido}</div>
          </div>
          <button onclick="eliminarNoticia('${n.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px 8px;" title="Eliminar Noticia">
            🗑️
          </button>
        </div>
      `).join('')
    } catch(e) { 
      console.error("Error cargando noticias:", e) 
    }
  },


  async renderEventos() {
    const el = document.getElementById('proximosEventos')
    try {
      const data = await EventoModel.getProximos(3)
      if (!data || data.length === 0) {
        el.innerHTML = `<p style="color: #aaa; font-size: 0.9rem;">No hay eventos programados.</p>`
        return
      }
      el.innerHTML = data.map(e => `
        <div class="evento-mini" style="background: #222; padding: 10px; border-radius: 4px; margin-bottom: 8px; border-left: 4px solid var(--primary-color, #00ff66);">
          <h4 style="margin: 0; font-size: 0.95rem; color: #fff;">${e.titulo}</h4>
          ${e.fecha ? `<small style="color: #aaa; font-size: 0.8rem;"><i class="fas fa-calendar-day" style="margin-right: 4px;"></i>${formatDate(e.fecha)}</small>` : ''}
        </div>
      `).join('')
    } catch(e) { 
      console.error("Error cargando eventos:", e) 
    }
  },
  async publicarNoticia() {
    const titulo = document.getElementById('noticiaTitulo').value.trim()
    const contenido = document.getElementById('noticiaContenido').value.trim()
    
    if(!titulo || !contenido) return

    try {
      // AJUSTE: Agregamos 'tipo' y 'autor' exigidos por tu base de datos en Supabase
      await NoticiaModel.insert({ 
        titulo, 
        contenido,
        tipo: 'update', // Tipo por defecto para las publicaciones del dashboard
        autor: 'Admin'   // Autor que la publica de manera predeterminada
      })
      
      window.closeNoticiaModal()
      await this.renderNoticias() // Recarga el listado de noticias en la pantalla
    } catch (e) {
      alert("Error al guardar la publicación en Supabase.")
      console.error(e)
    }
  },



  // NUEVO MÉTODO: Permite purgar registros obsoletos directamente de la interfaz
  async eliminarNoticia(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return
    try {
      await NoticiaModel.delete(id)
      await this.renderNoticias()
    } catch (e) {
      alert("No se pudo eliminar la noticia.")
      console.error(e)
    }
  }
}

// DISPARADOR AUTOMÁTICO PARA QUE FUNCIONE YA
InicioController.init();
