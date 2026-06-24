// ============================================================
// MÊS — calendário, feriados
// ============================================================
function goToToday(){
  curYear = todayY;
  curMonth = todayM;
  const yl = document.getElementById('year-lbl');
  if(yl) yl.textContent = curYear;
  renderCalendar();
  renderFeriados();
  renderStats();
  // scroll suave até ao topo
  window.scrollTo({top:0, behavior:'smooth'});
}

// ---- Popup "Ver outra data" ----

function renderFeriados() {
  const daysInMonth = new Date(curYear, curMonth+1, 0).getDate();
  const items = [];
  const shiftColors = {'5':'#FFE600','13':'#00BFFF','21':'#00FFB4','F':'#A8D870','X':'#FFD166'};
  for(let d=1;d<=daysInMonth;d++){
    const fer = getFeriadoLocal(d, curMonth);
    if(fer){
      const s = getShift(curTeam, curYear, curMonth, d);
      const isX = s==='X';
      items.push(`<div class="fer-item">
        <span class="fer-day">${d}</span>
        <span class="fer-name">${fer}</span>
        <span class="fer-shift" style="color:${shiftColors[s]||''}">${isX?'Férias':s==='F'?'Folga':SHIFT_NUM_LBL[s]}</span>
      </div>`);
    }
  }
  const itemsEl = document.getElementById('fer-items');
  if(itemsEl) itemsEl.innerHTML = items.length > 0 ? items.join('') : '<div style="color:rgba(255,255,255,0.35);font-size:12px;">Sem feriados este mês</div>';
}


function renderCalendar() {
  const mns = (typeof MONTH_NAMES !== 'undefined' ? MONTH_NAMES : MONTH_NAMES_PT);
  document.getElementById('month-title').textContent = mns[curMonth] + ' ' + curYear;
  const yearData = (SCHEDULES[curYear]||{})[curTeam]||[];
  const data = yearData[curMonth]||[];
  const firstDow = new Date(curYear, curMonth, 1).getDay();
  const quinzenaDays = getQuinzenaDays(curTeam, curYear);
  const tbody = document.getElementById('cal-body');
  tbody.innerHTML = '';
  let cells = [];
  for(let i=0;i<firstDow;i++) cells.push(null);
  const daysInMonth = new Date(curYear, curMonth+1, 0).getDate();
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  while(cells.length%7) cells.push(null);
  for(let r=0;r<cells.length/7;r++){
    const tr = document.createElement('tr');
    for(let c=0;c<7;c++){
      const td = document.createElement('td');
      const day = cells[r*7+c];
      if(day){
        const row = data.find(x=>x[0]===day);
        const shift = row ? row[2] : 'F';
        const isToday = curYear===todayY && curMonth===todayM && day===todayD;
        const hasFer = !!getFeriadoLocal(day, curMonth);
        const isX = shift==='X';
        const isQuinzena = shift==='F' && quinzenaDays.has(`${curMonth}-${day}`);
        const cls = SHIFT_CLS[shift]||'dc-f';
        const aus = (typeof getAusencia==='function') ? getAusencia(curYear, curMonth, day) : null;
        const div = document.createElement('div');
        div.className = `day-cell ${cls}${hasFer?' has-fer':''}${aus?' has-aus':''}`;
        let faixaHTML, dayLbl;
        if(aus){
          const inf = AUSENCIA_INFO[aus.tipo]||AUSENCIA_INFO.outro;
          div.style.background = inf.cor;
          div.style.color = inf.txt;
          faixaHTML = '';
          dayLbl = `${inf.emoji} ${inf.nome}`;
        } else {
          faixaHTML = isX
            ? '<div class="faixa faixa-x"><span>FÉRIAS</span></div>'
            : hasFer ? '<div class="faixa faixa-fer"><span>FERIADO</span></div>' : '';
          const emoji = SHIFT_EMOJI[shift] || '';
          const label = shift==='F' ? 'Folga' : SHIFT_NUM_LBL[shift];
          dayLbl = emoji ? `${emoji} ${label}` : label;
        }
        div.innerHTML = `${faixaHTML}<span class="day-num">${day}</span><span class="day-lbl">${dayLbl}</span>`;
        if(isToday){
          const wrap = document.createElement('div');
          wrap.className = 'today-wrap';
          wrap.appendChild(div);
          td.appendChild(wrap);
        } else {
          td.appendChild(div);
        }
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

