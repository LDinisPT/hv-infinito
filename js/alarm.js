// ============================================================
// ALARM — despertador para turnos de Manhã (via calendário .ics)
// ============================================================
function getAlarmEnabled(){ return safeGet('alarmOn') === '1'; }
function getAlarmTime(){ return safeGet('alarmTime') || '04:15'; }
function pad2(n){ return String(n).padStart(2,'0'); }

const ALARM_PRESETS = ['03:30','03:45','04:00','04:15','04:30'];
const ALARM_HORAS = ['03','04','05'];
const ALARM_MINS = ['00','15','30','45'];

// ---- Config no separador Mais ----
function renderAlarmConfig(){
  const box = document.getElementById('alarm-config');
  if(!box) return;
  const on = getAlarmEnabled();
  const time = getAlarmTime();
  const [hh, mm] = time.split(':');
  box.innerHTML = `
    <div class="al-row">
      <span class="al-label">Despertador p/ Manhãs</span>
      <button class="al-toggle${on?' on':''}" id="al-toggle"><span class="al-knob"></span></button>
    </div>
    <div class="al-body" style="display:${on?'block':'none'}">
      <div class="al-time-big">${time}</div>
      <div class="al-sub">Atalhos</div>
      <div class="al-chips">
        ${ALARM_PRESETS.map(p=>`<button class="al-chip${p===time?' sel':''}" data-set="${p}">${p}</button>`).join('')}
      </div>
      <div class="al-sub">Hora</div>
      <div class="al-chips">
        ${ALARM_HORAS.map(h=>`<button class="al-chip${h===hh?' sel':''}" data-hh="${h}">${h}</button>`).join('')}
      </div>
      <div class="al-sub">Minutos</div>
      <div class="al-chips">
        ${ALARM_MINS.map(m=>`<button class="al-chip${m===mm?' sel':''}" data-mm="${m}">${m}</button>`).join('')}
      </div>
      <button class="al-export" id="al-export">📅 Adicionar Manhãs ao calendário</button>
      <div class="al-note">Cria alarmes no teu calendário (iOS/Android) para os próximos 2 meses de turnos de Manhã. A app não toca sozinha — o calendário é que dispara o alarme.</div>
    </div>`;

  document.getElementById('al-toggle').onclick = () => {
    safeSet('alarmOn', on ? '0' : '1');
    renderAlarmConfig();
    renderAlarmAviso();
  };
  if(on){
    box.querySelectorAll('.al-chip').forEach(b => b.onclick = () => {
      const [h,m] = getAlarmTime().split(':');
      if(b.dataset.set) safeSet('alarmTime', b.dataset.set);
      else if(b.dataset.hh) safeSet('alarmTime', `${b.dataset.hh}:${m}`);
      else if(b.dataset.mm) safeSet('alarmTime', `${h}:${b.dataset.mm}`);
      renderAlarmConfig(); renderAlarmAviso();
    });
    document.getElementById('al-export').onclick = downloadMorningICS;
  }
}

// ---- Aviso no separador Hoje (quando amanhã for Manhã) ----
function renderAlarmAviso(){
  const box = document.getElementById('alarm-aviso');
  if(!box) return;
  if(!getAlarmEnabled()){ box.innerHTML = ''; return; }
  const ref = getShiftRefDate();
  const tom = new Date(ref); tom.setDate(tom.getDate()+1);
  const amanhaManha = getShift(curTeam, tom.getFullYear(), tom.getMonth(), tom.getDate()) === '5';
  if(amanhaManha){
    box.innerHTML = `<div class="aa-card">
      <span class="aa-txt">⏰ <b class="aa-turno">☀️ Turno da Manhã</b> · acordar às <b class="aa-hora">${getAlarmTime()}</b></span>
      <button class="aa-btn" id="aa-btn">📅</button>
    </div>`;
    document.getElementById('aa-btn').onclick = downloadMorningICS;
  } else {
    box.innerHTML = '';
  }
}

// ---- Geração do .ics (turnos de Manhã dos próximos 2 meses) ----
function generateMorningICS(){
  const [hh, mm] = getAlarmTime().split(':');
  const start = new Date(); start.setHours(0,0,0,0);
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Verallia Turnos//PT\r\nCALSCALE:GREGORIAN\r\n';
  let count = 0;
  for(let i=0;i<62;i++){
    const d = new Date(start); d.setDate(d.getDate()+i);
    const y=d.getFullYear(), mo=d.getMonth(), day=d.getDate();
    if(getShift(curTeam, y, mo, day) === '5'){
      const ymd = `${y}${pad2(mo+1)}${pad2(day)}`;
      const dt = `${ymd}T${hh}${mm}00`;
      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:wake-${ymd}-${curTeam}@verallia-turnos\r\n`;
      ics += `DTSTAMP:${ymd}T000000\r\n`;
      ics += `DTSTART:${dt}\r\n`;
      ics += `DTEND:${dt}\r\n`;
      ics += 'SUMMARY:\u23F0 Acordar \u00B7 Turno Manh\u00E3\r\n';
      ics += 'BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:PT0M\r\nDESCRIPTION:Turno Manh\u00E3 \u00E0s 05:00\r\nEND:VALARM\r\n';
      ics += 'END:VEVENT\r\n';
      count++;
    }
  }
  ics += 'END:VCALENDAR\r\n';
  return { ics, count };
}

function downloadMorningICS(){
  const { ics, count } = generateMorningICS();
  if(count === 0){ alert('Não há turnos de Manhã nos próximos 2 meses para a equipa ' + curTeam + '.'); return; }
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `despertador-manhas-${curTeam}.ics`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}
