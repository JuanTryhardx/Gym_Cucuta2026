// ============================================================
// InicioController.js — Roles: Admin ve y edita todo
//   Admin    → stats + noticias + videos + beneficios (edita todo)
//   Entrenador → stats parciales + noticias + videos + beneficios (solo lee)
//   Cliente  → noticias + videos + beneficios (solo lee)
// ============================================================
import { Auth } from '../services/auth.js'
import { buildNavbar, formatMoney, formatDate, showLoader, hideLoader,
         swalConfirm, swalError, swalSuccess, isAdmin, isEntrenador, isCliente, getUserRol } from '../services/ui.js'
import { PersonaModel } from '../models/PersonaModel.js'
import { EventoModel }  from '../models/EventoModel.js'
import { NoticiaModel } from '../models/NoticiaModel.js'

export const InicioController = {

  async init() {
    Auth.requireAuth()
    const rol = getUserRol()
    document.getElementById('navbar-container').innerHTML = buildNavbar('inicio.html')

    // ── Permisos por rol ────────────────────────────────────
    const canEdit    = isAdmin()                  // Solo admin edita
    const canPublish = isAdmin()                  // Solo admin publica/elimina noticias
    const seeStats   = !isCliente()               // Admin y entrenador ven stats
    const seeIngresos = isAdmin()                 // Solo admin ve $$ ingresos

    // Botón publicar noticias
    const btnPublicar = document.getElementById('btnPublicar')
    if (btnPublicar) btnPublicar.style.display = canPublish ? 'flex' : 'none'

    // Stats section
    const statsSection = document.getElementById('statsSection')
    if (statsSection) statsSection.style.display = seeStats ? 'block' : 'none'

    // Acciones rápidas según rol
    this._renderAccionesRapidas(rol)

    // Handlers
    window.openNoticiaModal  = () => {
      if (!canPublish) return
      document.getElementById('noticiaModal').style.display = 'flex'
    }
    window.closeNoticiaModal = () => {
      document.getElementById('noticiaModal').style.display = 'none'
      document.getElementById('formNuevaNoticia')?.reset()
    }
    window.publicarNoticia = () => canPublish ? this.publicarNoticia() : null
    window.eliminarNoticia = (id) => canPublish ? this.eliminarNoticia(id) : null

    // Handlers para edición de videos/beneficios (solo admin)
    window.openVideoModal     = ()    => canEdit ? this.openVideoModal()     : null
    window.closeVideoModal    = ()    => this.closeVideoModal()
    window.guardarVideo       = ()    => canEdit ? this.guardarVideo()       : null
    window.eliminarVideo      = (idx) => canEdit ? this.eliminarVideo(idx)   : null
    window.openBeneficioModal = ()    => canEdit ? this.openBeneficioModal() : null
    window.closeBeneficioModal= ()    => this.closeBeneficioModal()
    window.guardarBeneficio   = ()    => canEdit ? this.guardarBeneficio()   : null
    window.eliminarBeneficio  = (idx) => canEdit ? this.eliminarBeneficio(idx): null

    showLoader('Cargando...')
    const tasks = [this.renderNoticias(), this.renderEventos()]
    if (seeStats) tasks.push(this.renderStats(seeIngresos))
    await Promise.all(tasks)

    // Sección motivacional visible para TODOS (con o sin edición)
    this._renderSeccionMotivacional(canEdit)
    hideLoader()
  },

  // ── Acciones rápidas por rol ──────────────────────────────
  _renderAccionesRapidas(rol) {
    const container = document.getElementById('quickActionsContainer')
    if (!container) return
    const acciones = {
      admin: [
        { href: 'registrar.html',    icon: '', label: 'Registrar Persona' },
        { href: 'personas.html',     icon: '', label: 'Ver Miembros'      },
        { href: 'informes.html',     icon: '', label: 'Ver Informes'      },
        { href: 'eventos.html',      icon: '', label: 'Eventos'           },
        { href: 'validaciones.html', icon: '', label: 'Validaciones'      },
        { href: 'soporte.html',      icon: '', label: 'Soporte'           },
      ],
      entrenador: [
        { href: 'mis-clientes.html', icon: '', label: 'Mis Clientes'     },
        { href: 'registrar.html',    icon: '', label: 'Registrar Cliente' },
        { href: 'eventos.html',      icon: '', label: 'Eventos'          },
        { href: 'soporte.html',      icon: '', label: 'Soporte'          },
      ],
      cliente: [
        { href: 'eventos.html', icon: '', label: 'Ver Eventos' },
        { href: 'soporte.html', icon: '', label: 'Soporte'     },
      ]
    }
    const items = acciones[rol] || acciones['cliente']
    container.innerHTML = items.map(a => `
      <a href="${a.href}" class="qa-btn">
        <span class="qa-icon">${a.icon}</span>
        <span>${a.label}</span>
      </a>`).join('')
  },

  // ── Stats (admin ve ingresos, entrenador no) ──────────────
  async renderStats(seeIngresos) {
    const el = document.getElementById('statsGrid')
    if (!el) return
    try {
      const data      = await PersonaModel.getStats()
      const total     = data.length
      const activos   = data.filter(p => p.estado === 'Activo').length
      const inactivos = total - activos
      const ingresos  = data.reduce((s, p) => s + (parseFloat(p.mensualidad) || 0), 0)
      const pct       = total > 0 ? Math.round((activos / total) * 100) : 0

      el.innerHTML = `
        <div class="stat-card stat-total">
          <div class="stat-label">Miembros Totales</div>
          <div class="stat-value">${total}</div>
          <div class="stat-bar-wrap"><div class="stat-bar" style="width:100%;background:rgba(56,189,248,0.5)"></div></div>
        </div>
        <div class="stat-card stat-activos">
          <div class="stat-label">Activos</div>
          <div class="stat-value" style="color:#4ade80">${activos}</div>
          <div class="stat-bar-wrap"><div class="stat-bar" style="width:${pct}%;background:#4ade80"></div></div>
          <div class="stat-sub">${pct}% del total</div>
        </div>
        <div class="stat-card stat-inactivos">
          <div class="stat-label">Inactivos</div>
          <div class="stat-value" style="color:#f87171">${inactivos}</div>
          <div class="stat-bar-wrap"><div class="stat-bar" style="width:${100-pct}%;background:#f87171"></div></div>
          <div class="stat-sub">${100-pct}% del total</div>
        </div>
        ${seeIngresos ? `
        <div class="stat-card stat-ingresos">
          <div class="stat-label">Ingresos Mensuales</div>
          <div class="stat-value" style="color:#3b82f6">${formatMoney(ingresos)}</div>
          <div class="stat-sub">Suma de mensualidades</div>
        </div>` : ''}`
    } catch(e) { console.error(e) }
  },

  // ── Noticias ────────────
  async renderNoticias() {
    const el = document.getElementById('noticiasLista')
    if (!el) return
    const canDelete = isAdmin()
    try {
      const data = await NoticiaModel.getAll()
      if (!data || data.length === 0) {
        el.innerHTML = `<div class="empty-feed">No hay publicaciones aún</div>`
        return
      }
      const tagMap = { novedad:'tag-novedad', actualización:'tag-actualizacion', importante:'tag-importante', motivacion:'tag-motivacion', salud:'tag-salud' }
      el.innerHTML = data.map((n, i) => {
        const tagClass = tagMap[(n.tipo||'novedad').toLowerCase()] || 'tag-novedad'
        const media    = n.url_media
          ? `<img src="${n.url_media}" alt="noticia" style="width:64px;height:64px;object-fit:cover;border-radius:10px;flex-shrink:0">`
          : ``
        const fecha = n.fecha ? new Date(n.fecha).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' }) : 'Reciente'
        return `
          <div class="noticia-item" style="animation-delay:${i*0.08}s">
            ${media}
            <div class="noticia-body">
              <div class="noticia-header-row">
                <span class="noticia-pill ${tagClass}">${n.tipo || 'Novedad'}</span>
                <span class="noticia-date">${fecha}</span>
              </div>
              <h4 class="noticia-titulo">${n.titulo}</h4>
              <p class="noticia-texto">${n.contenido}</p>
            </div>
            ${canDelete ? `<button onclick="eliminarNoticia('${n.id}')" class="btn-del-noticia" title="Eliminar">Eliminar</button>` : ''}
          </div>`
      }).join('')
    } catch(e) { console.error(e) }
  },

  async renderEventos() {
    const el = document.getElementById('proximosEventos')
    if (!el) return
    try {
      const data = await EventoModel.getProximos(3)
      if (!data || data.length === 0) {
        el.innerHTML = `<p style="color:#94a3b8;font-size:0.88rem;padding:10px 0">Sin eventos próximos.</p>`
        return
      }
      el.innerHTML = data.map(e => `
        <div class="evento-mini">
          <div class="evento-dot"></div>
          <div>
            <div class="evento-titulo">${e.titulo}</div>
            ${e.fecha ? `<div class="evento-fecha">${formatDate(e.fecha)}</div>` : ''}
          </div>
        </div>`).join('')
    } catch(e) { console.error(e) }
  },

  // ── Publicar / Eliminar noticias (solo admin) ─────────────
  async publicarNoticia() {
    const titulo    = document.getElementById('noticiaTitulo')?.value.trim()
    const contenido = document.getElementById('noticiaContenido')?.value.trim()
    const tipo      = document.getElementById('noticiaTipo')?.value || 'Novedad'
    const url_media = document.getElementById('noticiaUrlMedia')?.value.trim() || null
    if (!titulo || !contenido) { await swalError('Campos requeridos', 'Llena título y contenido.'); return }
    showLoader('Publicando...')
    try {
      await NoticiaModel.insert({ titulo, contenido, tipo, url_media, autor: 'Admin' })
      window.closeNoticiaModal()
      await this.renderNoticias()
      await swalSuccess('¡Publicado!', 'La noticia fue agregada correctamente.')
    } catch(e) { await swalError('Error', 'No se pudo publicar.') }
    finally { hideLoader() }
  },

  async eliminarNoticia(id) {
    const ok = await swalConfirm('¿Eliminar publicación?', 'Esta acción no se puede deshacer.', ' Eliminar')
    if (!ok) return
    showLoader('Eliminando...')
    try { await NoticiaModel.delete(id); await this.renderNoticias() }
    catch(e) { await swalError('Error', 'No se pudo eliminar.') }
    finally { hideLoader() }
  },

  // ── Sección motivacional — visible para TODOS ────────────
  // Admin ve botones de edición, el resto solo ve el contenido
  _renderSeccionMotivacional(canEdit) {
    const container = document.getElementById('clienteMotivacional')
    if (!container) return
    container.style.display = 'block'

    // Videos almacenados en memoria (en producción vendrían de BD)
    this._videos = this._videos || [
      { tag: 'Fuerza',   url: 'https://www.youtube.com/embed/IODxDxX7oi4', titulo: 'Rutina Completa de Fuerza',       desc: 'Entrena todos los grupos musculares con este circuito profesional.' },
      { tag: 'Cardio',   url: 'https://www.youtube.com/embed/UItWltVZZmE', titulo: 'HIIT de Alto Impacto',            desc: 'Quema calorías en 20 minutos con este entrenamiento de intervalos.' },
      { tag: 'Nutrición',url: 'https://www.youtube.com/embed/qWJ1SzGTVLA', titulo: 'Alimentación para Deportistas',   desc: 'Aprende qué comer antes y después de entrenar para mejores resultados.' },
    ]
    this._beneficios = this._beneficios || [
      { icon: '', titulo: 'Equipos de Última Generación',  desc: 'Acceso a más de 80 máquinas y equipos profesionales' },
      { icon: '', titulo: 'Entrenadores Certificados',    desc: 'Guía personalizada de expertos con experiencia comprobada' },
      { icon: '', titulo: 'Clases Grupales',                desc: 'Más de 20 clases semanales: yoga, crossfit, spinning y más' },
      { icon: '', titulo: 'Vestuarios Completos',           desc: 'Duchas, casilleros y zonas de descanso a tu disposición' },
    ]

    container.innerHTML = `
      <!-- Tarjetas motivacionales -->
      <div class="motivacional-grid">
        <div class="card motivacional-card">
          <div class="motiv-header">Tu Objetivo</div>
          <p class="motiv-text">Cada entrenamiento te acerca a la mejor versión de ti mismo. Hoy es un buen día para superar tus límites.</p>
          <div class="motiv-quote">"El dolor que sientes hoy es la fuerza que sentirás mañana."</div>
        </div>
        <div class="card motivacional-card">
          <div class="motiv-header">Consejo del Día</div>
          <p class="motiv-text">La hidratación es clave. Bebe al menos 2 litros de agua al día, especialmente antes y después de entrenar.</p>
          <div class="motiv-tips">
            <span class="tip-chip">Hidratación</span>
            <span class="tip-chip">Descanso</span>
            <span class="tip-chip">Nutrición</span>
          </div>
        </div>
      </div>

      <!-- Videos -->
      <div class="card videos-section">
        <div class="card-title-section">
          <span class="card-title-icon">▶️</span>
          <span>Videos de Entrenamiento</span>
          ${canEdit ? `<button class="btn-add-content" onclick="openVideoModal()" title="Agregar video">Agregar Video</button>` : ''}
        </div>
        <div class="videos-grid" id="videosGrid">
          ${this._renderVideosHTML(canEdit)}
        </div>
      </div>

      <!-- Beneficios -->
      <div class="card beneficios-section">
        <div class="card-title-section">
          
          <span>Beneficios de tu Membresía</span>
          ${canEdit ? `<button class="btn-add-content" onclick="openBeneficioModal()" title="Agregar beneficio">Agregar Beneficio</button>` : ''}
        </div>
        <div class="beneficios-grid" id="beneficiosGrid">
          ${this._renderBeneficiosHTML(canEdit)}
        </div>
      </div>

      <!-- Modal agregar video (solo admin) -->
      ${canEdit ? `
      <div id="videoModal" class="modal-overlay" style="display:none">
        <div class="modal-box" style="max-width:500px">
          <h3>▶️ Agregar Video</h3>
          <div class="form-group" style="margin-bottom:12px">
            <label>Título</label>
            <input id="v_titulo" placeholder="Ej: Rutina de piernas"/>
          </div>
          <div class="form-group" style="margin-bottom:12px">
            <label>URL embed YouTube</label>
            <input id="v_url" placeholder="https://www.youtube.com/embed/XXXX"/>
            <small style="color:#94a3b8;font-size:0.75rem;margin-top:4px;display:block">Usa el enlace de incrustación de YouTube</small>
          </div>
          <div class="form-row" style="margin-bottom:14px">
            <div class="form-group">
              <label>Etiqueta</label>
              <input id="v_tag" placeholder="Fuerza"/>
            </div>
            <div class="form-group">
              <label>Descripción</label>
              <input id="v_desc" placeholder="Breve descripción..."/>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="closeVideoModal()">Cancelar</button>
            <button class="btn-primary" onclick="guardarVideo()"> Guardar</button>
          </div>
        </div>
      </div>

      <!-- Modal agregar beneficio (solo admin) -->
      <div id="beneficioModal" class="modal-overlay" style="display:none">
        <div class="modal-box" style="max-width:460px">
          <h3>Agregar Beneficio</h3>
          <div class="form-row" style="margin-bottom:12px">
            <div class="form-group" style="max-width:80px">
              <label>Ícono (emoji)</label>
              <input id="b_icon" placeholder="Icono" style="text-align:center"/>
            </div>
            <div class="form-group">
              <label>Título</label>
              <input id="b_titulo" placeholder="Nombre del beneficio"/>
            </div>
          </div>
          <div class="form-group" style="margin-bottom:16px">
            <label>Descripción</label>
            <textarea id="b_desc" rows="2" placeholder="Breve descripción..."></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="closeBeneficioModal()">Cancelar</button>
            <button class="btn-primary" onclick="guardarBeneficio()"> Guardar</button>
          </div>
        </div>
      </div>` : ''}
    `
  },

  _renderVideosHTML(canEdit) {
    return this._videos.map((v, i) => `
      <div class="video-card">
        <div class="video-wrapper">
          <iframe src="${v.url}" title="${v.titulo}" frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
        </div>
        <div class="video-info">
          <div class="video-tag">${v.tag}</div>
          <div class="video-title">${v.titulo}</div>
          <div class="video-desc">${v.desc}</div>
          ${canEdit ? `<button class="btn-del-content" onclick="eliminarVideo(${i})" title="Eliminar video"> Eliminar</button>` : ''}
        </div>
      </div>`).join('')
  },

  _renderBeneficiosHTML(canEdit) {
    return this._beneficios.map((b, i) => `
      <div class="beneficio-item">
        <div class="bene-icon">${b.icon}</div>
        <div class="bene-titulo">${b.titulo}</div>
        <div class="bene-desc">${b.desc}</div>
        ${canEdit ? `<button class="btn-del-content" onclick="eliminarBeneficio(${i})" title="Eliminar">Eliminar</button>` : ''}
      </div>`).join('')
  },

  // ── Gestión videos (solo admin) ───────────────────────────
  openVideoModal() {
    document.getElementById('videoModal').style.display = 'flex'
  },
  closeVideoModal() {
    document.getElementById('videoModal').style.display = 'none'
    ;['v_titulo','v_url','v_tag','v_desc'].forEach(id => { const el = document.getElementById(id); if (el) el.value = '' })
  },
  async guardarVideo() {
    const titulo = document.getElementById('v_titulo').value.trim()
    const url    = document.getElementById('v_url').value.trim()
    const tag    = document.getElementById('v_tag').value.trim()
    const desc   = document.getElementById('v_desc').value.trim()
    if (!titulo || !url) { await swalError('Campos requeridos', 'Título y URL son obligatorios.'); return }
    this._videos.push({ titulo, url, tag: tag || 'Video', desc })
    this.closeVideoModal()
    document.getElementById('videosGrid').innerHTML = this._renderVideosHTML(true)
    await swalSuccess('¡Video agregado!', 'El video ya aparece en la sección.')
  },
  async eliminarVideo(idx) {
    const ok = await swalConfirm('¿Eliminar video?', 'Se quitará de la sección.', ' Eliminar')
    if (!ok) return
    this._videos.splice(idx, 1)
    document.getElementById('videosGrid').innerHTML = this._renderVideosHTML(true)
  },

  // ── Gestión beneficios (solo admin) ──────────────────────
  openBeneficioModal() {
    document.getElementById('beneficioModal').style.display = 'flex'
  },
  closeBeneficioModal() {
    document.getElementById('beneficioModal').style.display = 'none'
    ;['b_icon','b_titulo','b_desc'].forEach(id => { const el = document.getElementById(id); if (el) el.value = '' })
  },
  async guardarBeneficio() {
    const icon   = document.getElementById('b_icon').value.trim()
    const titulo = document.getElementById('b_titulo').value.trim()
    const desc   = document.getElementById('b_desc').value.trim()
    if (!titulo) { await swalError('Campo requerido', 'Escribe un título para el beneficio.'); return }
    this._beneficios.push({ icon: icon || '', titulo, desc })
    this.closeBeneficioModal()
    document.getElementById('beneficiosGrid').innerHTML = this._renderBeneficiosHTML(true)
    await swalSuccess('¡Beneficio agregado!', 'Ya aparece en la sección de membresía.')
  },
  async eliminarBeneficio(idx) {
    const ok = await swalConfirm('¿Eliminar beneficio?', 'Se quitará de la lista.', ' Eliminar')
    if (!ok) return
    this._beneficios.splice(idx, 1)
    document.getElementById('beneficiosGrid').innerHTML = this._renderBeneficiosHTML(true)
  },

  _videos: null,
  _beneficios: null
}

InicioController.init()
