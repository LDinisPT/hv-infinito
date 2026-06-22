// ============================================================
// HOJE — card de hoje, ciclo, quinzena, ver-data
// ============================================================
function renderCiclo() {
  const card = document.getElementById('ciclo-card');
  if(!card) return;

  const yearData = (SCHEDULES[curYear]||{})[curTeam]||[];
  const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];

  // Find current block (consecutive same-type days containing today)
  // First flatten all days
  const allDays = [];
  for(let m=0; m<12; m++) {
    for(let d=1; d<=monthDays[m]; d++) {
      const row = (yearData[m]||[]).find(r=>r[0]===d);
      const shift = row ? row[2] : 'F';
      allDays.push({m, d, shift, date: new Date(curYear, m, d)});
    }
  }

  // Find today index
  const todayIdx = allDays.findIndex(x => x.m===todayM && x.d===todayD);
  if(todayIdx < 0) { card.innerHTML = ''; return; }

  const todayShift = allDays[todayIdx].shift;

  // Group shift type: F and X both = 'folga'
  const grp = s => (s==='F'||s==='X') ? 'F' : s;
  const todayGrp = grp(todayShift);

  // Find block start
  let start = todayIdx;
  while(start > 0 && grp(allDays[start-1].shift) === todayGrp) start--;

  // Find block end
  let end = todayIdx;
  while(end < allDays.length-1 && grp(allDays[end+1].shift) === todayGrp) end++;

  const total = end - start + 1;
  const done = todayIdx - start; // days passed (not including today)
  const remain = end - todayIdx; // days remaining (not including today)

  // RESTAM conta o dia de hoje enquanto o turno de hoje não terminar.
  // Manhã termina 13h, Tarde 21h, Noite 05h (dia seguinte). Folga conta hoje.
  let turnoTerminou = false;
  if(todayGrp !== 'F'){
    const fim = new Date(allDays[todayIdx].date);
    if(todayShift === '5') fim.setHours(13,0,0,0);
    else if(todayShift === '13') fim.setHours(21,0,0,0);
    else if(todayShift === '21'){ fim.setDate(fim.getDate()+1); fim.setHours(5,0,0,0); }
    turnoTerminou = new Date() >= fim;
  }
  const remainShow = (total - done) - (turnoTerminou ? 1 : 0);

  // Find next block
  let nextShift = null;
  let nextCount = 0;
  if(end+1 < allDays.length) {
    const nGrp = grp(allDays[end+1].shift);
    let ni = end+1;
    while(ni < allDays.length && grp(allDays[ni].shift) === nGrp) { nextCount++; ni++; }
    nextShift = allDays[end+1].shift;
  }

  const SHIFT_INFO = {
    '5':  { emoji:'🐓', label:'Manhã 05h-13h',  color:'#FFE600', bg:'rgba(255,230,0,0.15)' },
    '13': { emoji:'☀️', label:'Tarde 13h-21h',  color:'#00BFFF', bg:'rgba(0,191,255,0.15)' },
    '21': { emoji:'🌙', label:'Noite 21h-05h',  color:'#00FFB4', bg:'rgba(0,255,180,0.15)' },
    'F':  { emoji:'🌿', label:'Folga',           color:'#A8D870', bg:'rgba(168,216,112,0.15)' },
  };
  const NEXT_COLORS = {'5':'#FFE600','13':'#00BFFF','21':'#00FFB4','F':'rgba(168,216,112,0.7)','X':'rgba(168,216,112,0.7)'};

  const info = SHIFT_INFO[todayGrp==='F'?'F':todayShift] || SHIFT_INFO['F'];
  const nextInfo = nextShift ? SHIFT_INFO[grp(nextShift)==='F'?'F':nextShift] : null;

  // Build dots
  let dotsHTML = '';
  for(let i=0; i<total; i++) {
    if(i < done) {
      dotsHTML += `<div class="ciclo-dot ciclo-dot-done"></div>`;
    } else if(i === done) {
      if(turnoTerminou){
        // hoje, mas o turno já terminou → cortado (✓) com borda da cor do dia
        dotsHTML += `<div class="ciclo-dot ciclo-dot-done ciclo-dot-today-done" style="border-color:${info.color};"></div>`;
      } else {
        dotsHTML += `<div class="ciclo-dot ciclo-dot-today" style="background:${info.bg};border-color:${info.color};"><span style="color:${info.color}">${i+1}</span></div>`;
      }
    } else {
      dotsHTML += `<div class="ciclo-dot ciclo-dot-future"><span>${i+1}</span></div>`;
    }
  }

  const nextHTML = nextInfo
    ? `<div class="ciclo-next-val" style="color:${nextInfo.color}">${nextInfo.emoji} ${nextInfo.label.split(' ')[0]} · ${nextCount} dias</div>`
    : `<div class="ciclo-next-val" style="color:rgba(255,255,255,0.3)">—</div>`;

  card.innerHTML = `
    <div class="ciclo-header">
      <div>
        <div class="ciclo-title" style="color:${info.color}">${info.emoji} ${info.label}</div>
        <div class="ciclo-sub">Bloco atual · ${total} dias</div>
      </div>
      <div class="ciclo-right">
        <div class="ciclo-num" style="color:${info.color}">${remainShow}</div>
        <div class="ciclo-sub2">RESTAM</div>
      </div>
    </div>
    <div class="ciclo-dots">${dotsHTML}</div>
    <div class="ciclo-next">
      <div class="ciclo-next-lbl">A seguir</div>
      ${nextHTML}
    </div>`;
}

function renderClock() {
  const now = new Date();
  const t = formatTime(now);
  const el = document.getElementById('clock-time');
  if(el) el.textContent = t;
  const dayEl = document.getElementById('clock-day');
  if(dayEl){
    const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    dayEl.textContent = `${dias[now.getDay()]}, ${now.getDate()} ${meses[now.getMonth()]}`;
  }
  if(typeof updateShiftProgress === 'function') updateShiftProgress();
}


function renderQuinzena() {
  const card = document.getElementById('quinzena-card');
  if(!card) return;
  const yearData = (SCHEDULES[curYear]||{})[curTeam]||[];
  const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
  
  // Find next big rest (14 consecutive F days)
  const today = new Date(todayY, todayM, todayD);
  let found = null;
  let dayCount = 0;
  
  for(let m=0; m<12; m++) {
    const days = monthDays[m];
    for(let d=1; d<=days; d++) {
      const date = new Date(curYear, m, d);
      const row = (yearData[m]||[]).find(r=>r[0]===d);
      const shift = row ? row[2] : 'F';
      if(date >= today && shift === 'F') {
        // Count consecutive F
        let count = 0;
        let mm = m, dd = d;
        while(mm < 12) {
          const r2 = (yearData[mm]||[]).find(r=>r[0]===dd);
          if(!r2 || r2[2] !== 'F') break;
          count++;
          dd++;
          if(dd > monthDays[mm]) { dd=1; mm++; }
        }
        if(count >= 12) {
          found = {date, count, daysUntil: Math.round((date - today) / 86400000)};
          break;
        }
      }
    }
    if(found) break;
  }
  
  const mns = typeof MONTH_NAMES !== 'undefined' ? MONTH_NAMES : MONTH_NAMES_PT;

  // Check if currently inside quinzena
  if(curYear === todayY && isInsideQuinzena(curTeam, curYear)) {
    const rem = getRemainingQuinzenaDays(curTeam, curYear);
    const returnDate = new Date(curYear, rem.returnM, rem.returnD);
    card.innerHTML = `<div class="rainbow-card" style="width:100%;">
      <div class="rainbow-text">
        <span class="c1">E</span><span class="c2">S</span><span class="c3">T</span><span class="c4">A</span><span class="c5">S</span>&nbsp;<span class="c6">D</span><span class="c1">E</span>&nbsp;<span class="c2">F</span><span class="c3">E</span><span class="c4">R</span><span class="c5">I</span><span class="c6">A</span><span class="c1">S</span>&nbsp;<span class="c2">🏖️</span>
      </div>
      <div class="rainbow-sub">Ainda tens ${rem.days} dias · Volta a ${returnDate.getDate()} ${mns[returnDate.getMonth()]}</div>
    </div>`;
    return;
  }

  if(found) {
    const daysLeft = found.daysUntil;
    const MAX = 45; // referência: ~45 dias atrás = barra no início (vermelho)
    const pct = Math.max(4, Math.min(100, Math.round((MAX - daysLeft) / MAX * 100)));
    card.innerHTML = `
      <div class="q-row">
        <div class="q-left">
          <div class="q-lbl">Próxima quinzena</div>
          <div class="q-val">${found.date.getDate()} ${mns[found.date.getMonth()]} · ${found.count} dias</div>
        </div>
        <div class="q-days">
          <div class="q-num">${daysLeft}</div>
          <div class="q-sub">${daysLeft===1?'AMANHÃ':'DIAS'}</div>
        </div>
      </div>
      <div class="q-bar">
        <div class="q-bar-grad"></div>
        <div class="q-bar-mask" style="left:${pct}%;"></div>
        <div class="q-bar-lightwrap" style="width:${pct}%;"><div class="q-bar-light"></div></div>
      </div>`;
  } else {
    card.innerHTML = '';
  }
}


// ===== EQUIPAS HOJE =====
// Dia de turno: roda às 05:00, não à meia-noite.
// Entre 00:00 e 04:59 a Noite (21h-05h) ainda está em curso,
// por isso "hoje" continua a ser o dia em que essa Noite começou.

function gridForDate(tt, mineTeam){
  const items = [
    {lbl:'🐓 Manhã', team:tt.M||'—', cls:'m', hrs:'05-13'},
    {lbl:'☀️ Tarde', team:tt.T||'—', cls:'t', hrs:'13-21'},
    {lbl:'🌙 Noite', team:tt.N||'—', cls:'n', hrs:'21-05'},
  ];
  return `<div class="teams-today-grid">
        ${items.map(it => `
          <div class="tt-item${it.team===mineTeam?' tt-mine':''}">
            <span class="tt-shift">${it.lbl}</span>
            <span class="tt-team tt-team-${it.cls}">${it.team}</span>
            <span class="tt-hours">${it.hrs}</span>
          </div>`).join('')}
      </div>`;
}

function showDateResult(val){
  const box = document.getElementById('date-result');
  if(!val){ box.innerHTML = '<div class="date-result-empty">Escolhe uma data acima.</div>'; return; }
  const [y, mo, d] = val.split('-').map(Number);
  const moIdx = mo - 1;
  const date = new Date(y, moIdx, d);
  const wdays = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const mns = (typeof MONTH_NAMES !== 'undefined' ? MONTH_NAMES : MONTH_NAMES_PT);
  const fer = getFeriado(y, moIdx, d);
  const tt = getTeamsForDate(y, moIdx, d);
  box.innerHTML = `
    <div class="date-result-head">
      <div class="date-result-day">${wdays[date.getDay()]}, ${d} ${mns[moIdx]} ${y}</div>
      ${fer?`<div class="date-result-fer">⭐ ${fer}</div>`:''}
    </div>
    ${gridForDate(tt, curTeam)}`;
}

function openDatePopup(){
  const inp = document.getElementById('date-input');
  // pré-preenche com hoje se vazio
  if(!inp.value){
    inp.value = `${todayY}-${String(todayM+1).padStart(2,'0')}-${String(todayD).padStart(2,'0')}`;
  }
  showDateResult(inp.value);
  document.getElementById('date-overlay').classList.add('show');
}
function closeDatePopup(){ document.getElementById('date-overlay').classList.remove('show'); }


function teamsGridHTML(tt, cur, showHours){
  if(showHours === undefined) showHours = true;
  const items = [
    {k:'M', emoji:'🐓', team:tt.M||'—', cls:'m', hrs:'05-13'},
    {k:'T', emoji:'☀️', team:tt.T||'—', cls:'t', hrs:'13-21'},
    {k:'N', emoji:'🌙', team:tt.N||'—', cls:'n', hrs:'21-05'},
  ];
  return `<div class="teams-today-grid">
        ${items.map(it => `
          <div class="tt-item${cur && it.k===cur?' tt-active':''}">
            <span class="tt-teamline"><span class="tt-emoji">${it.emoji}</span><span class="tt-team tt-team-${it.cls}">${it.team}</span></span>
            ${showHours?`<span class="tt-hours">${it.hrs}</span>`:''}
          </div>`).join('')}
      </div>`;
}

function teamsHTMLToday(){
  const cur = getCurrentShiftKey();
  const wd = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const ref = getShiftRefDate();
  const refTom = new Date(ref); refTom.setDate(refTom.getDate()+1);
  const lblHoje = `${wd[ref.getDay()]} ${ref.getDate()}`;
  const lblAmanha = `${wd[refTom.getDay()]} ${refTom.getDate()}`;
  return `
    <div class="teams-today">
      <div class="teams-today-title">Equipas hoje · ${lblHoje}</div>
      ${teamsGridHTML(getTeamsFor(0), cur)}
      <div class="teams-today-title" style="margin-top:10px;">Equipas amanhã · ${lblAmanha}</div>
      ${teamsGridHTML(getTeamsFor(1), null)}
    </div>`;
}

function renderTodayCard() {
  const t = new Date(todayY, todayM, todayD);
  const fer = getFeriadoLocal(todayD, todayM);
  const wdays = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const mns = (typeof MONTH_NAMES !== 'undefined' ? MONTH_NAMES : MONTH_NAMES_PT);
  const now = new Date();
  const greeting = getGreeting();
  const clockStr = formatTime(now);
  document.getElementById('today-card').innerHTML = `
    <div class="today-top-row">
      <div class="today-left">
        <div class="today-greeting" style="font-size:16px;font-weight:600;color:rgba(255,255,255,0.85);letter-spacing:.05em;">${greeting} · <span style="display:inline-block;vertical-align:top;">Equipa ${curTeam}<br><span style="font-size:12px;color:#4aab6a;letter-spacing:.12em;text-transform:uppercase;font-weight:600;">Selecionada</span></span></div>
        <div class="today-clock" id="clock-time" style="font-size:42px;">${clockStr}</div>
        <div class="today-date" style="margin-top:2px;">${wdays[t.getDay()]}, ${todayD} ${mns[todayM]}</div>
        ${fer?`<div class="today-fer" style="color:#EF9F27;font-size:11px;">${fer}</div>`:''}
      </div>
      <div class="today-right" id="weather-widget" style="transform:scale(1.1);transform-origin:top right;white-space:nowrap;">
        <div class="weather-row"><span class="w-icon">⛅</span><span class="w-temp">--°</span></div>
        <div class="w-city">Figueira da Foz</div>
      </div>
    </div>
    <div class="today-actions">
      <button class="today-action-btn" id="btn-ver-data-card">🔍 Ver outra data</button>
    </div>
    ${teamsHTMLToday()}`;
}

// ===== EVENTOS GRUPO CULTURAL E DESPORTIVO =====
// data: 'YYYY-MM-DD' ou null para "a definir"
