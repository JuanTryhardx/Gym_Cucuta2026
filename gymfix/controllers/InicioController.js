import { Auth } from '../services/auth.js'
import { buildNavbar, formatMoney, formatDate } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'
import { EventoModel } from '../models/EventoModel.js'
import { NoticiaModel } from '../models/NoticiaModel.js'

export const InicioController = {
    async init() {
    Auth.requireAuth()
    document.getElementById('navbar-container').innerHTML = buildNavbar('inicio.html')
    
    // Forzamos a que las ventanas de modales se abran y cierren mapeando los IDs correctos
    window.openNoticiaModal = () => {
      const modal = document.getElementById('noticiaModal')
      if (modal) modal.style.display = 'flex'
    }
    window.closeNoticiaModal = () => {
      const modal = document.getElementById('noticiaModal')
      if (modal) {
        modal.style.display = 'none'
        document.getElementById('formNuevaNoticia')?.reset()
      }
    }
    
    // Mapeamos los disparadores globales de forma explícita
    window.publicarNoticia = () => this.publicarNoticia()
    window.eliminarNoticia = (id) => this.eliminarNoticia(id)

    await Promise.all([this.renderStats(), this.renderNoticias(), this.renderEventos()])
  },

  async publicarNoticia() {
    const titulo = document.getElementById('noticiaTitulo')?.value.trim()
    const contenido = document.getElementById('noticiaContenido')?.value.trim()
    const tipo = document.getElementById('noticiaTipo')?.value || 'Novedad'
    const url_media = document.getElementById('noticiaUrlMedia')?.value.trim() || null
    
    if (!titulo || !contenido) {
      alert("Por favor, llena los campos obligatorios.")
      return
    }

    try {
      // Intentamos la inserción mandando los datos limpios
      await NoticiaModel.insert({ 
        titulo, 
        contenido,
        tipo,
        url_media,
        autor: 'Admin'
      })
      
      window.closeNoticiaModal()
      await this.renderNoticias() // Refrescamos el feed estilo Figma de inmediato
    } catch (e) {
      alert("Error al guardar la publicación en Supabase. Revisa las columnas de tu tabla.")
      console.error("Detalle del fallo:", e)
    }
  },

  async eliminarNoticia(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return
    try {
      await NoticiaModel.delete(id)
      await this.renderNoticias()
    } catch (e) {
      alert("No se pudo eliminar la noticia.")
      console.error(e)
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
    if (!el) return
    try {
      const data = await NoticiaModel.getAll()
      if (!data || data.length === 0) {
        el.innerHTML = `<p style="color: #9ca3af; padding: 20px; text-align: center;">No hay publicaciones disponibles.</p>`
        return
      }
      
      el.innerHTML = data.map((n, index) => {
        // 1. Validar el tipo de categoría para asignar la clase CSS de la etiqueta
        const tipoOriginal = (n.tipo || 'novedad').toLowerCase()
        let tagClass = 'tag-novedad'
        if (tipoOriginal === 'actualizacion') tagClass = 'tag-actualizacion'
        if (tipoOriginal === 'importante') tagClass = 'tag-importante'
        if (tipoOriginal === 'motivacion') tagClass = 'tag-motivacion'
        if (tipoOriginal === 'salud' || tipoOriginal === 'comida') tagClass = 'tag-salud'

        // 2. Gestionar la miniatura multimedia de la izquierda
        // Si tiene un enlace de imagen en la base de datos lo pinta, sino pone un icono por defecto
        const mediaHtml = n.url_media 
          ? `<img src="${n.url_media}" alt="noticia">`
          : `<i class="${tipoOriginal === 'motivacion' ? 'fas fa-play-circle' : 'fas fa-dumbbell'}"></i>`

        // 3. Formatear la fecha de creación de forma limpia
        const fechaFormateada = n.fecha 
          ? new Date(n.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
          : 'Reciente'
        const delay = index * 0.1;
        
        // 4. Retornar la tarjeta horizontal idéntica al Figma
    return `
    <div class="noticia-item-premium" style="animation-delay: ${delay}s;">
    <!-- Bloque Izquierdo: Imagen Panorámica -->
    <div class="noticia-media-wrapper">
      ${mediaHtml}
    </div>

    <!-- Bloque Central: Textos -->
    <div class="noticia-body-content">
      <h4 class="noticia-premium-title">${n.titulo}</h4>
      <p class="noticia-premium-text">${n.contenido}</p>
      <span class="noticia-premium-date">${fechaFormateada}</span>
    </div>

    <!-- Bloque Derecho: Etiqueta de Categoría -->
    <div style="display: flex; flex-direction: column; align-items: flex-end;">
      <span class="noticia-pill-tag ${tagClass}">${n.tipo || 'Novedad'}</span>
    </div>

    <!-- Botón de Borrado Absoluto en Esquina -->
    <button onclick="eliminarNoticia('${n.id}')" class="btn-delete-noticia" title="Eliminar Publicación">
      🗑️
    </button>

  </div>`

      }).join('')
    } catch(e) { 
      console.error("Error renderizando feed estilo Figma:", e) 
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
    const tipo = document.getElementById('noticiaTipo').value
    const url_media = document.getElementById('noticiaUrlMedia').value.trim()
    
    if(!titulo || !contenido) return

    try {
      // Enviamos el objeto completo mapeando la nueva columna de Supabase
      await NoticiaModel.insert({ 
        titulo, 
        contenido,
        tipo,
        url_media: url_media || null,
        autor: 'Admin'
      })
      window.closeNoticiaModal()
      await this.renderNoticias() 
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
