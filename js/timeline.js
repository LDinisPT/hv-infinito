// ============================================================
// TIMELINE — separador Hoje: 2 dias + linha do tempo até domingo
// ============================================================

const TL_SHIFT = {
  '5':  {emoji:'🐓', nome:'Manhã', hrs:'05-13', cls:'m', dot:'#FFE600'},
  '13': {emoji:'☀️', nome:'Tarde', hrs:'13-21', cls:'t', dot:'#00BFFF'},
  '21': {emoji:'🌙', nome:'Noite', hrs:'21-05', cls:'n', dot:'#00FFB4'},
  'F':  {emoji:'🌿', nome:'Folga', hrs:'',      cls:'f', dot:'#A8D870'},
  'X':  {emoji:'🏖️', nome:'Férias', hrs:'',     cls:'x', dot:'#FFD166'},
};
const TL_WD = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const WD_FULL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
// Cores da cromoterapia (planetas): Dom-Sol, Seg-Lua, Ter-Marte, Qua-Mercúrio, Qui-Júpiter, Sex-Vénus, Sáb-Saturno
const WD_COLOR = ['#FFC83D','#E8E8F0','#FF5A5A','#4ADE80','#5AA9FF','#FF7FB6','#B07FFF'];

// ---- Cabeçalho + 2 dias (hoje + amanhã com 3 equipas) ----
// ---- Progresso do turno em curso (% e tempo restante) ----
function getShiftProgress(shiftKey){
  if(!shiftKey) return null;
  const now = new Date();
  let mins = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  let start, end;
  if(shiftKey === 'M'){ start=5*60;  end=13*60; }
  else if(shiftKey === 'T'){ start=13*60; end=21*60; }
  else if(shiftKey === 'N'){ start=21*60; end=29*60; if(mins < 5*60) mins += 24*60; }
  else return null;
  const total = end - start, elapsed = mins - start;
  if(elapsed < 0 || elapsed > total) return null;
  const pct = Math.max(0, Math.min(100, Math.round(elapsed/total*100)));
  const remain = Math.max(0, Math.round(end - mins));
  const h = Math.floor(remain/60), m = remain%60;
  const txt = h>0 ? `${h}h${String(m).padStart(2,'0')}m` : `${m}m`;
  return { pct, txt };
}

// ---- HTML dos 3 turnos (colunas), com barra no turno em curso ----
function turnosHTML(tt, cur, withProgress){
  const items = [
    {k:'M', emoji:'🐓', team:tt.M||'—', cls:'manha', hrs:'05-13'},
    {k:'T', emoji:'☀️', team:tt.T||'—', cls:'tarde', hrs:'13-21'},
    {k:'N', emoji:'🌙', team:tt.N||'—', cls:'noite', hrs:'21-05'},
  ];
  return `<div class="dd-turnos">${items.map(it=>{
    const ativo = withProgress && cur===it.k;
    let extra = '';
    if(ativo){
      const p = getShiftProgress(cur);
      if(p) extra = `<div class="dd-progress"><div class="dd-bar" style="width:${p.pct}%"></div></div><div class="dd-live">${p.pct}% · ⏳${p.txt}</div>`;
      extra += `<div class="dd-sweep"><div class="dd-sweep-light"></div></div>`;
    }
    return `<div class="dd-turno${ativo?' ativo':''}">${it.emoji} <span class="dd-eq ${it.cls}">${it.team}</span><div class="dd-hora">${it.hrs}</div>${extra}</div>`;
  }).join('')}</div>`;
}

function renderDoisDias(){
  const box = document.getElementById('dois-dias');
  if(!box) return;
  const cur = getCurrentShiftKey();
  const ref = getShiftRefDate();
  const refTom = new Date(ref); refTom.setDate(refTom.getDate()+1);
  const corHoje = WD_COLOR[ref.getDay()];
  const corAmanha = WD_COLOR[refTom.getDay()];
  const lblHoje = `${WD_FULL[ref.getDay()]} ${ref.getDate()}`;
  const lblAmanha = `${WD_FULL[refTom.getDay()]} ${refTom.getDate()}`;
  const ferHoje = getFeriado(ref.getFullYear(), ref.getMonth(), ref.getDate());

  // evento do grupo hoje ou amanhã
  const refDay = new Date(ref); refDay.setHours(0,0,0,0);
  const refTomDay = new Date(refTom); refTomDay.setHours(0,0,0,0);
  const evMap = eventosNoIntervalo(refDay, refTomDay);
  const evHoje = evMap[`${refDay.getFullYear()}-${refDay.getMonth()}-${refDay.getDate()}`];

  box.innerHTML = `
    <div class="dd-row dd-today">
      <div class="dd-label">HOJE<br><b style="color:${corHoje}">${lblHoje}</b>${ferHoje?`<br><span class="dd-fer">⭐ ${ferHoje}</span>`:''}</div>
      ${turnosHTML(getTeamsFor(0), cur, true)}
    </div>
    ${evHoje ? `<div class="dd-evento">🏆 ${evHoje}</div>` : ''}
    <div class="dd-row">
      <div class="dd-label">AMANHÃ<br><b style="color:${corAmanha}">${lblAmanha}</b></div>
      ${turnosHTML(getTeamsFor(1), null, false)}
    </div>`;
  renderClock();
}

// Atualiza só a barra de progresso (chamado a cada segundo pelo relógio)
function updateShiftProgress(){
  const cur = getCurrentShiftKey();
  const p = cur ? getShiftProgress(cur) : null;
  const bar = document.querySelector('.dd-turno.ativo .dd-bar');
  const live = document.querySelector('.dd-turno.ativo .dd-live');
  if(bar && p) bar.style.width = p.pct + '%';
  if(live && p) live.textContent = `${p.pct}% · ⏳${p.txt}`;
}

// ---- Dias da timeline: de hoje até domingo (se domingo, semana seguinte) ----
function getTimelineDays(){
  const start = getShiftRefDate();
  start.setHours(0,0,0,0);
  const dow = start.getDay();           // 0=domingo
  const count = (dow === 0) ? 8 : (8 - dow);
  const days = [];
  const d = new Date(start);
  for(let i=0;i<count;i++){ days.push(new Date(d)); d.setDate(d.getDate()+1); }
  return days;
}

// ---- Eventos do grupo dentro de um intervalo ----
function eventosNoIntervalo(ini, fim){
  if(typeof EVENTOS_GRUPO === 'undefined') return {};
  const map = {};
  EVENTOS_GRUPO.forEach(ev => {
    if(!ev.data) return;
    const [y,m,d] = ev.data.split('-').map(Number);
    const dt = new Date(y, m-1, d); dt.setHours(0,0,0,0);
    if(dt >= ini && dt <= fim){
      const key = `${y}-${m-1}-${d}`;
      map[key] = ev.nome;
    }
  });
  return map;
}

// ---- Render da timeline ----
function renderTimeline(){
  const box = document.getElementById('timeline');
  if(!box) return;
  const days = getTimelineDays();
  if(!days.length){ box.innerHTML = ''; return; }
  const ref = getShiftRefDate(); ref.setHours(0,0,0,0);
  const evMap = eventosNoIntervalo(days[0], days[days.length-1]);

  let html = '<div class="tl-title">Próximos dias</div><div class="tl-wrap">';
  days.forEach(dt => {
    const y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
    const shift = getShift(curTeam, y, m, d);
    const info = TL_SHIFT[shift] || TL_SHIFT['F'];
    const isHoje = dt.getTime() === ref.getTime();
    const fer = getFeriado(y, m, d);

    const dotCls = isHoje ? 'tl-dot tl-dot-hoje' : 'tl-dot';
    const itemCls = 'tl-item tl-' + info.cls + (isHoje ? ' tl-hoje' : '') + (fer ? ' tl-fer' : '');
    const dateCls = isHoje ? 'tl-date tl-date-hoje' : 'tl-date';

    html += `
      <div class="tl-row">
        <div class="${dateCls}"><span class="tl-wd">${TL_WD[dt.getDay()]}</span><span class="tl-dnum">${d}</span></div>
        <div class="${dotCls}" style="--dot:${isHoje ? 'var(--c-verde)' : info.dot}"></div>
        <div class="${itemCls}">
          <span class="tl-shift">${info.emoji} ${info.nome}${isHoje?' · hoje':''}${fer?` · ⭐ ${fer}`:''}</span>
          ${info.hrs?`<span class="tl-hrs">${info.hrs}</span>`:''}
        </div>
      </div>`;

    // evento do grupo nesse dia
    const evKey = `${y}-${m}-${d}`;
    if(evMap[evKey]){
      html += `
        <div class="tl-row tl-row-ev">
          <div class="tl-dot tl-dot-ev" style="--dot:var(--c-evento)"></div>
          <div class="tl-item tl-ev"><span class="tl-shift">🏆 ${evMap[evKey]}</span></div>
        </div>`;
    }
  });
  html += '</div>';
  box.innerHTML = html;
}

function renderHoje(){
  renderDoisDias();
}
