checkAuth();
document.getElementById('navbar-container').innerHTML = buildNavbar('informes.html');

const COLORS = ['#38bdf8','#0ea5e9','#4ade80','#fbbf24','#c084fc','#f87171','#34d399','#fb923c'];

function getPersonasFiltradas() {
  const periodo = document.getElementById('periodoSelect').value;
  const todas = DB.getPersonas();
  if (periodo === 'todo') return todas;
  const ahora = new Date();
  const desde = new Date();
  if (periodo === 'mes') desde.setMonth(ahora.getMonth() - 1);
  else if (periodo === 'año') desde.setFullYear(ahora.getFullYear() - 1);
  return todas.filter(p => p.fechaRegistro && new Date(p.fechaRegistro) >= desde);
}

function drawDonut(canvasId, data, labels, colors) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  canvas.width = 180; canvas.height = 180;
  const total = data.reduce((a, b) => a + b, 0);
  if (!total) { ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(90,90,70,0,Math.PI*2); ctx.fill(); return; }
  let start = -Math.PI / 2;
  data.forEach((val, i) => {
    const slice = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(90, 90);
    ctx.arc(90, 90, 70, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    start += slice;
  });
  // hole
  ctx.beginPath();
  ctx.arc(90, 90, 40, 0, Math.PI * 2);
  ctx.fillStyle = '#0d1424';
  ctx.fill();
  // center text
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 22px Rajdhani, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, 90, 90);
}

function buildLegend(legendId, labels, data, colors) {
  const el = document.getElementById(legendId);
  el.innerHTML = labels.map((l, i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${colors[i % colors.length]}"></div>
      <span>${l}: <b style="color:#e2e8f0">${data[i]}</b></span>
    </div>`).join('');
}

function drawBar(canvasId, labels, data, color) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.offsetWidth || 600;
  const H = 220;
  canvas.width = W; canvas.height = H;
  const max = Math.max(...data, 1);
  const pad = { top: 20, bottom: 36, left: 36, right: 10 };
  const bw = (W - pad.left - pad.right) / labels.length;

  // grid lines
  ctx.strokeStyle = 'rgba(56,189,248,0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (H - pad.top - pad.bottom) * (1 - i / 4);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Nunito, sans-serif';
    ctx.fillText(Math.round(max * i / 4), 2, y + 4);
  }

  labels.forEach((lbl, i) => {
    const x = pad.left + i * bw + bw * 0.1;
    const barW = bw * 0.8;
    const barH = ((data[i] || 0) / max) * (H - pad.top - pad.bottom);
    const y = H - pad.bottom - barH;

    // gradient bar
    const grad = ctx.createLinearGradient(0, y, 0, H - pad.bottom);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '40');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    // value
    if (data[i] > 0) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data[i], x + barW / 2, y - 5);
    }

    // label
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lbl.slice(0, 6), x + barW / 2, H - pad.bottom + 14);
  });
}

function renderAll() {
  const personas = DB.getPersonasFiltradas ? DB.getPersonasFiltradas() : getPersonasFiltradas();
  const todas = DB.getPersonas();
  const activos = todas.filter(p => p.estado === 'Activo').length;
  const ingresos = todas.reduce((s, p) => s + (parseFloat(p.mensualidad) || 0), 0);

  // KPIs
  document.getElementById('kpiGrid').innerHTML = `
    <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Total Miembros</div><div class="stat-value">${todas.length}</div></div>
    <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Activos</div><div class="stat-value" style="color:#4ade80">${activos}</div></div>
    <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Ingresos Proyectados</div><div class="stat-value" style="font-size:1.3rem">${formatMoney(ingresos)}</div></div>
    <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-label">En período</div><div class="stat-value">${personas.length}</div></div>
  `;

  // Donut estado
  const estados = ['Activo', 'Inactivo', 'Pendiente'];
  const estData = estados.map(e => todas.filter(p => p.estado === e).length);
  drawDonut('chartEstado', estData, estados, ['#4ade80', '#f87171', '#fbbf24']);
  buildLegend('legendEstado', estados, estData, ['#4ade80', '#f87171', '#fbbf24']);

  // Donut planes
  const planes = ['Mensual', 'Trimestral', 'Semestral', 'Anual', 'Clase suelta'];
  const planData = planes.map(pl => todas.filter(p => p.plan === pl).length);
  const planesConData = planes.filter((_, i) => planData[i] > 0);
  const planDataFilt = planData.filter(v => v > 0);
  drawDonut('chartPlan', planDataFilt, planesConData, COLORS);
  buildLegend('legendPlan', planesConData, planDataFilt, COLORS);

  // Bar crecimiento - últimos 6 meses
  const meses = [];
  const mesData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString('es', { month: 'short' });
    const y = d.getFullYear(), m = d.getMonth();
    const count = todas.filter(p => {
      if (!p.fechaRegistro) return false;
      const reg = new Date(p.fechaRegistro);
      return reg.getFullYear() === y && reg.getMonth() === m;
    }).length;
    meses.push(label);
    mesData.push(count);
  }
  drawBar('chartCrecimiento', meses, mesData, '#38bdf8');

  // Donut objetivos
  const objs = ['Pérdida de peso', 'Ganancia muscular', 'Mantenimiento', 'Resistencia', 'Rehabilitación', 'General'];
  const objData = objs.map(o => todas.filter(p => p.objetivo === o).length);
  const objsFilt = objs.filter((_, i) => objData[i] > 0);
  const objDataFilt = objData.filter(v => v > 0);
  drawDonut('chartObjetivos', objDataFilt, objsFilt, COLORS.slice(2));
  buildLegend('legendObjetivos', objsFilt, objDataFilt, COLORS.slice(2));

  // Tabla planes
  const totalIng = ingresos || 1;
  document.getElementById('tablaPlanes').innerHTML = planes.map((pl, i) => {
    const cnt = planData[i];
    const ing = todas.filter(p => p.plan === pl).reduce((s, p) => s + (parseFloat(p.mensualidad)||0), 0);
    const pct = totalIng > 0 ? ((ing / totalIng) * 100).toFixed(1) : '0.0';
    return `<tr><td>${pl}</td><td>${cnt}</td><td>${formatMoney(ing)}</td><td>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:6px;background:rgba(56,189,248,0.12);border-radius:3px">
          <div style="width:${pct}%;height:100%;background:var(--blue-mid);border-radius:3px"></div>
        </div>
        <span style="font-size:0.82rem;color:var(--text-muted)">${pct}%</span>
      </div>
    </td></tr>`;
  }).join('');
}

// Alias for filter
DB.getPersonasFiltradas = getPersonasFiltradas;

renderAll();
window.addEventListener('resize', renderAll);
