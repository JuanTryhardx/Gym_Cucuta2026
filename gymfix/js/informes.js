import { checkAuth, buildNavbar, formatMoney, supabase } from './app.js'

checkAuth()
document.getElementById('navbar-container').innerHTML = buildNavbar('informes.html')

const PLANES = { 1:'Mensual', 2:'Trimestral', 3:'Semestral', 4:'Anual', 5:'Clase suelta' }
const COLORS  = ['#38bdf8','#0ea5e9','#4ade80','#fbbf24','#c084fc','#f87171','#34d399','#fb923c']
let todasPersonas = []

async function cargarDatos() {
  const { data } = await supabase.from('personas').select('*')
  todasPersonas = data || []
  renderAll()
}

function getPersonasFiltradas() {
  const periodo = document.getElementById('periodoSelect').value
  if (periodo === 'todo') return todasPersonas
  const desde = new Date()
  if (periodo === 'mes')  desde.setMonth(desde.getMonth()-1)
  if (periodo === 'año')  desde.setFullYear(desde.getFullYear()-1)
  return todasPersonas.filter(p => p.fecha_registro && new Date(p.fecha_registro) >= desde)
}

function drawDonut(canvasId, data, labels, colors) {
  const canvas = document.getElementById(canvasId); if (!canvas) return
  const ctx = canvas.getContext('2d'); canvas.width=180; canvas.height=180
  const total = data.reduce((a,b)=>a+b,0)
  if (!total) { ctx.fillStyle='#334155'; ctx.beginPath(); ctx.arc(90,90,70,0,Math.PI*2); ctx.fill(); return }
  let start = -Math.PI/2
  data.forEach((val,i) => {
    const slice = (val/total)*Math.PI*2
    ctx.beginPath(); ctx.moveTo(90,90); ctx.arc(90,90,70,start,start+slice); ctx.closePath()
    ctx.fillStyle=colors[i%colors.length]; ctx.fill(); start+=slice
  })
  ctx.beginPath(); ctx.arc(90,90,40,0,Math.PI*2); ctx.fillStyle='#0d1424'; ctx.fill()
  ctx.fillStyle='#e2e8f0'; ctx.font='bold 22px Rajdhani,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
  ctx.fillText(total,90,90)
}

function buildLegend(legendId, labels, data, colors) {
  const el = document.getElementById(legendId); if (!el) return
  el.innerHTML = labels.map((l,i) => `
    <div class="legend-item"><div class="legend-dot" style="background:${colors[i%colors.length]}"></div>
    <span>${l}: <b style="color:#e2e8f0">${data[i]}</b></span></div>`).join('')
}

function drawBar(canvasId, labels, data, color) {
  const canvas = document.getElementById(canvasId); if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.parentElement.offsetWidth||600; const H=220
  canvas.width=W; canvas.height=H
  const max=Math.max(...data,1); const pad={top:20,bottom:36,left:36,right:10}
  const bw=(W-pad.left-pad.right)/labels.length
  ctx.strokeStyle='rgba(56,189,248,0.1)'; ctx.lineWidth=1
  for (let i=0;i<=4;i++) {
    const y=pad.top+(H-pad.top-pad.bottom)*(1-i/4)
    ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(W-pad.right,y); ctx.stroke()
    ctx.fillStyle='#64748b'; ctx.font='10px Nunito,sans-serif'; ctx.fillText(Math.round(max*i/4),2,y+4)
  }
  labels.forEach((lbl,i) => {
    const x=pad.left+i*bw+bw*0.1; const barW=bw*0.8
    const barH=((data[i]||0)/max)*(H-pad.top-pad.bottom); const y=H-pad.bottom-barH
    const grad=ctx.createLinearGradient(0,y,0,H-pad.bottom)
    grad.addColorStop(0,color); grad.addColorStop(1,color+'40')
    ctx.fillStyle=grad; ctx.beginPath(); ctx.roundRect(x,y,barW,barH,[4,4,0,0]); ctx.fill()
    if (data[i]>0) { ctx.fillStyle='#e2e8f0'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center'; ctx.fillText(data[i],x+barW/2,y-5) }
    ctx.fillStyle='#64748b'; ctx.font='10px Nunito,sans-serif'; ctx.textAlign='center'; ctx.fillText(lbl.slice(0,6),x+barW/2,H-pad.bottom+14)
  })
}

window.renderAll = function () {
  const personas = getPersonasFiltradas()
  const todas    = todasPersonas
  const activos  = todas.filter(p=>p.estado==='Activo').length
  const ingresos = todas.reduce((s,p)=>s+(parseFloat(p.mensualidad)||0),0)

  document.getElementById('kpiGrid').innerHTML = `
    <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Total Miembros</div><div class="stat-value">${todas.length}</div></div>
    <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Activos</div><div class="stat-value" style="color:#4ade80">${activos}</div></div>
    <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Ingresos Proyectados</div><div class="stat-value" style="font-size:1.3rem">${formatMoney(ingresos)}</div></div>
    <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-label">En período</div><div class="stat-value">${personas.length}</div></div>`

  const estados=['Activo','Inactivo','Pendiente']
  const estData=estados.map(e=>todas.filter(p=>p.estado===e).length)
  drawDonut('chartEstado',estData,estados,['#4ade80','#f87171','#fbbf24'])
  buildLegend('legendEstado',estados,estData,['#4ade80','#f87171','#fbbf24'])

  const planesKeys=Object.keys(PLANES); const planesNames=Object.values(PLANES)
  const planData=planesKeys.map(k=>todas.filter(p=>String(p.plan_id)===k).length)
  const pfN=planesNames.filter((_,i)=>planData[i]>0); const pfD=planData.filter(v=>v>0)
  drawDonut('chartPlan',pfD,pfN,COLORS); buildLegend('legendPlan',pfN,pfD,COLORS)

  const meses=[]; const mesData=[]
  for (let i=5;i>=0;i--) {
    const d=new Date(); d.setMonth(d.getMonth()-i)
    meses.push(d.toLocaleString('es',{month:'short'}))
    const y=d.getFullYear(),mo=d.getMonth()
    mesData.push(todas.filter(p=>{ if(!p.fecha_registro)return false; const r=new Date(p.fecha_registro); return r.getFullYear()===y&&r.getMonth()===mo }).length)
  }
  drawBar('chartCrecimiento',meses,mesData,'#38bdf8')

  const objs=['Pérdida de peso','Ganancia muscular','Mantenimiento','Resistencia','Rehabilitación','General']
  const objData=objs.map(o=>todas.filter(p=>p.objetivo===o).length)
  const ojF=objs.filter((_,i)=>objData[i]>0); const odF=objData.filter(v=>v>0)
  drawDonut('chartObjetivos',odF,ojF,COLORS.slice(2)); buildLegend('legendObjetivos',ojF,odF,COLORS.slice(2))

  const totalIng=ingresos||1
  document.getElementById('tablaPlanes').innerHTML=planesKeys.map((k,i)=>{
    const cnt=planData[i]; const ing=todas.filter(p=>String(p.plan_id)===k).reduce((s,p)=>s+(parseFloat(p.mensualidad)||0),0)
    const pct=((ing/totalIng)*100).toFixed(1)
    return `<tr><td>${planesNames[i]}</td><td>${cnt}</td><td>${formatMoney(ing)}</td>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:6px;background:rgba(56,189,248,0.12);border-radius:3px">
          <div style="width:${pct}%;height:100%;background:var(--blue-mid);border-radius:3px"></div>
        </div><span style="font-size:0.82rem;color:var(--text-muted)">${pct}%</span>
      </div></td></tr>`
  }).join('')
}

cargarDatos()
window.addEventListener('resize', renderAll)
