// ============================================================
// MEDICAÇÃO — lembrete diário com a hora ajustada ao turno
//   Manhã  05-13  →  14:00
//   Tarde  13-21  →  12:00
//   Noite  21-05  →  14:00
//   Folga / Férias →  14:00
// (as horas são configuráveis no separador Mais)
// ============================================================

const MED_DEFAULTS = { '5':'14:00', '13':'12:00', '21':'14:00', 'F':'14:00' };
const MED_ORDER = ['5','13','21','F'];
const MED_LBL = {
  '5':  {emo:'🐓', nome:'Manhã',  desc:'05h - 13h'},
  '13': {emo:'☀️', nome:'Tarde',  desc:'13h - 21h'},
  '21': {emo:'🌙', nome:'Noite',  desc:'21h - 05h'},
  'F':  {emo:'🏖️', nome:'Folga',  desc:'e férias'}
};

function medPad2(n){ return String(n).padStart(2,'0'); }

// Seletor de hora em formato 24h (o <input type="time"> nativo segue a
// língua do telemóvel e nalguns mostra AM/PM — aqui somos nós a mandar).
function medHoraPicker(shift, hhmm){
  const [hh, mm] = hhmm.split(':');
  const horas = Array.from({length:24}, (_,i) => medPad2(i));
  const mins = Array.from({length:12}, (_,i) => medPad2(i*5));
  if(!mins.includes(mm)) mins.push(mm), mins.sort();
  return `<span class="med-picker">
    <select class="med-sel" data-shift="${shift}" data-part="h" aria-label="Hora">
      ${horas.map(h => `<option value="${h}"${h===hh?' selected':''}>${h}</option>`).join('')}
    </select><span class="med-sep">:</span>
    <select class="med-sel" data-shift="${shift}" data-part="m" aria-label="Minutos">
      ${mins.map(m => `<option value="${m}"${m===mm?' selected':''}>${m}</option>`).join('')}
    </select><span class="med-h24">h</span>
  </span>`;
}
function medDateKey(d){ return `${d.getFullYear()}-${medPad2(d.getMonth()+1)}-${medPad2(d.getDate())}`; }

function getMedEnabled(){ return safeGet('medOn') === '1'; }

function getMedTimes(){
  let t = {};
  try { t = JSON.parse(safeGet('medTimes') || '{}'); } catch(e){ t = {}; }
  return Object.assign({}, MED_DEFAULTS, t);
}
function setMedTime(shift, hhmm){
  const t = getMedTimes();
  t[shift] = hhmm;
  safeSet('medTimes', JSON.stringify(t));
}

// Turno da equipa numa data (X/férias contam como folga para a medicação)
function medShiftOf(d){
  const s = getShift(curTeam, d.getFullYear(), d.getMonth(), d.getDate());
  return (s === '5' || s === '13' || s === '21') ? s : 'F';
}
// Hora do lembrete numa data
function medTimeOf(d){ return getMedTimes()[medShiftOf(d)]; }

// A medicação segue o dia do calendário (12h/14h caem sempre dentro
// do dia de escala, que vai das 05h às 05h), por isso usamos new Date().
function medHoje(){
  const now = new Date();
  const shift = medShiftOf(now);
  const hhmm = getMedTimes()[shift];
  const [hh, mm] = hhmm.split(':').map(Number);
  const alvo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
  return { now, shift, hhmm, alvo, key: medDateKey(now) };
}

// ---- Marcar como tomada ----
function medTomouHoje(){ return safeGet('medTaken') === medDateKey(new Date()); }
function medMarcarTomada(){
  safeSet('medTaken', medDateKey(new Date()));
  safeSet('medTakenAt', formatTime(new Date()));
  renderMedAviso();
}
function medDesmarcar(){
  safeSet('medTaken', '');
  renderMedAviso();
}

// ============================================================
// Cartão no separador Hoje
// ============================================================
function renderMedAviso(){
  const box = document.getElementById('med-aviso');
  if(!box) return;
  if(!getMedEnabled()){ box.innerHTML = ''; return; }

  const { now, shift, hhmm, alvo } = medHoje();
  const lbl = MED_LBL[shift];

  if(medTomouHoje()){
    const at = safeGet('medTakenAt') || hhmm;
    box.innerHTML = `<div class="med-card med-done">
      <span class="med-txt">💊 <b>Medicação tomada</b> às <b class="med-hora">${at}</b> ✓</span>
      <button class="med-btn med-undo" id="med-undo">↺</button>
    </div>`;
    document.getElementById('med-undo').onclick = medDesmarcar;
    return;
  }

  const diffMin = Math.round((alvo - now) / 60000);
  let estado, cls;
  if(diffMin > 0){
    const h = Math.floor(diffMin/60), m = diffMin%60;
    estado = 'faltam ' + (h ? `${h}h${medPad2(m)}` : `${m} min`);
    cls = '';
  } else if(diffMin > -120){
    estado = 'está na hora!';
    cls = ' med-agora';
  } else {
    const h = Math.floor(-diffMin/60);
    estado = `atrasado ${h}h`;
    cls = ' med-tarde';
  }

  box.innerHTML = `<div class="med-card${cls}">
    <span class="med-txt">💊 <b>Medicação</b> às <b class="med-hora">${hhmm}</b>
      <span class="med-sub">${lbl.emo} ${lbl.nome} · ${estado}</span></span>
    <button class="med-btn" id="med-ok">✓ Tomei</button>
  </div>`;
  document.getElementById('med-ok').onclick = medMarcarTomada;
}

// ============================================================
// Notificações do telemóvel (com a app aberta ou em segundo plano)
// ============================================================
function medNotifSuportado(){ return typeof Notification !== 'undefined'; }
function medNotifAtiva(){ return medNotifSuportado() && Notification.permission === 'granted' && safeGet('medNotif') === '1'; }

async function medPedirNotificacoes(){
  if(!medNotifSuportado()){ alert('Este telemóvel/navegador não permite notificações. Usa o botão do calendário — funciona sempre.'); return; }
  let p = Notification.permission;
  if(p !== 'granted') { try { p = await Notification.requestPermission(); } catch(e){} }
  if(p === 'granted'){
    safeSet('medNotif','1');
    medMostrarNotificacao('💊 Avisos ligados', 'Vais ser avisado à hora da medicação.');
  } else {
    safeSet('medNotif','0');
    alert('Os avisos ficaram bloqueados nas definições do telemóvel. Podes usar o botão do calendário em alternativa.');
  }
  renderMedConfig();
}

function medMostrarNotificacao(titulo, corpo){
  const opts = { body: corpo, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'medicacao', renotify: true };
  try {
    if(navigator.serviceWorker && navigator.serviceWorker.ready){
      navigator.serviceWorker.ready.then(r => r.showNotification(titulo, opts)).catch(()=>{ new Notification(titulo, opts); });
    } else { new Notification(titulo, opts); }
  } catch(e){ try { new Notification(titulo, opts); } catch(e2){} }
}

function medVerificar(){
  renderMedAviso();
  if(!getMedEnabled() || !medNotifAtiva()) return;
  const { now, hhmm, alvo, key } = medHoje();
  if(medTomouHoje()) return;
  if(now < alvo) return;
  if((now - alvo) > 3*3600000) return;          // já passaram +3h, não vale a pena
  if(safeGet('medNotified') === key) return;    // já avisou hoje
  safeSet('medNotified', key);
  medMostrarNotificacao('💊 Hora da medicação', `São ${hhmm} — não te esqueças do comprimido.`);
}

// ============================================================
// Config no separador Mais
// ============================================================
function renderMedConfig(){
  const box = document.getElementById('med-config');
  if(!box) return;
  const on = getMedEnabled();
  const times = getMedTimes();
  const { hhmm, shift } = medHoje();
  const notifOn = medNotifAtiva();

  box.innerHTML = `
    <div class="med-row">
      <span class="med-label">Lembrete de medicação</span>
      <button class="med-toggle${on?' on':''}" id="med-toggle"><span class="med-knob"></span></button>
    </div>
    <div class="med-body" style="display:${on?'block':'none'}">
      <div class="med-time-big">${hhmm}</div>
      <div class="med-hoje-sub">hoje · ${MED_LBL[shift].emo} ${MED_LBL[shift].nome}</div>

      <div class="med-secao">Hora por turno</div>
      ${MED_ORDER.map(s => `
        <div class="med-linha">
          <span class="med-turno"><b>${MED_LBL[s].emo} ${MED_LBL[s].nome}</b><span>${MED_LBL[s].desc}</span></span>
          ${medHoraPicker(s, times[s])}
        </div>`).join('')}
      <button class="med-reset" id="med-reset">↺ Repor horas de origem</button>

      <div class="med-secao">Como queres ser avisado</div>
      <button class="med-acao${notifOn?' ativa':''}" id="med-notif">${notifOn?'🔔 Avisos no telemóvel ligados':'🔕 Ligar avisos no telemóvel'}</button>
      <button class="med-acao med-cal" id="med-export">📅 Adicionar 90 dias ao calendário</button>
      <div class="med-note">Os <b>avisos no telemóvel</b> funcionam com a app instalada e aberta ou em segundo plano.<br>
      O <b>calendário</b> é o mais seguro: cria os lembretes já com a hora certa de cada dia (12h nas Tardes, 14h no resto) para os próximos 3 meses, e toca mesmo com a app fechada. Repete de vez em quando para renovar.</div>
    </div>`;

  document.getElementById('med-toggle').onclick = () => {
    safeSet('medOn', on ? '0' : '1');
    renderMedConfig();
    renderMedAviso();
  };
  if(on){
    box.querySelectorAll('.med-sel').forEach(sel => {
      sel.onchange = () => {
        const sh = sel.dataset.shift;
        const [hh, mm] = getMedTimes()[sh].split(':');
        setMedTime(sh, sel.dataset.part === 'h' ? `${sel.value}:${mm}` : `${hh}:${sel.value}`);
        renderMedConfig(); renderMedAviso();
      };
    });
    document.getElementById('med-reset').onclick = () => {
      safeSet('medTimes', JSON.stringify(MED_DEFAULTS));
      renderMedConfig(); renderMedAviso();
    };
    document.getElementById('med-notif').onclick = () => {
      if(medNotifAtiva()){ safeSet('medNotif','0'); renderMedConfig(); }
      else medPedirNotificacoes();
    };
    document.getElementById('med-export').onclick = downloadMedICS;
  }
}

// ============================================================
// Exportar .ics (90 dias, hora certa em cada dia)
// ============================================================
function generateMedICS(){
  const start = new Date(); start.setHours(0,0,0,0);
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Verallia Turnos//Medicacao//PT\r\nCALSCALE:GREGORIAN\r\n';
  let count = 0;
  for(let i=0;i<90;i++){
    const d = new Date(start); d.setDate(d.getDate()+i);
    const shift = medShiftOf(d);
    const [hh, mm] = getMedTimes()[shift].split(':');
    const ymd = `${d.getFullYear()}${medPad2(d.getMonth()+1)}${medPad2(d.getDate())}`;
    const dt = `${ymd}T${hh}${mm}00`;
    ics += 'BEGIN:VEVENT\r\n';
    ics += `UID:med-${ymd}-${curTeam}@verallia-turnos\r\n`;
    ics += `DTSTAMP:${ymd}T000000\r\n`;
    ics += `DTSTART:${dt}\r\n`;
    ics += `DTEND:${dt}\r\n`;
    ics += 'SUMMARY:💊 Medicação\r\n';
    ics += `DESCRIPTION:${MED_LBL[shift].nome} (${MED_LBL[shift].desc})\r\n`;
    ics += 'BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:PT0M\r\nDESCRIPTION:Hora da medicação\r\nEND:VALARM\r\n';
    ics += 'END:VEVENT\r\n';
    count++;
  }
  ics += 'END:VCALENDAR\r\n';
  return { ics, count };
}

function downloadMedICS(){
  const { ics, count } = generateMedICS();
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `medicacao-${curTeam}.ics`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

// ============================================================
function initMedicacao(){
  renderMedConfig();
  renderMedAviso();
  setInterval(medVerificar, 30000);
  document.addEventListener('visibilitychange', () => { if(!document.hidden) medVerificar(); });
}
