// ============================================================
// CORE — estado, helpers, cálculos partilhados
// ============================================================

const TEAM_COLORS = {A:'m',B:'t',C:'c',D:'n',E:'x'};

const today = new Date();
const todayY = today.getFullYear();
const todayD = today.getDate(), todayM = today.getMonth();

function safeGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function safeSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
let curTeam = safeGet('team') || 'A';
let curYear = todayY;
let curMonth = todayM;

const SHIFT_CLS = {'5':'dc-m','13':'dc-t','21':'dc-n','F':'dc-f','X':'dc-x'};
const SHIFT_NUM_LBL = {'5':'05h','13':'13h','21':'21h','F':'Folga','X':'Férias'};
const SHIFT_EMOJI = {'5':'☀️','13':'🌊','21':'🌙','F':'','X':''};
const SHIFT_DESC = {'5':'Manhã 05-13','13':'Tarde 13-21','21':'Noite 21-05','F':'Dia de folga','X':'Férias + Feriado'};
const STAT_COLORS = {'5':'#FFE600','13':'#00BFFF','21':'#00FFB4'};

function getTeamCls(team) {
  const map = {A:'m',B:'t',C:'c',D:'n',E:'x'};
  return map[team]||'m';
}


function getQuinzenaDays(team, year) {
  const yearData = (SCHEDULES[year]||{})[team]||[];
  const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
  const quinzena = new Set();
  
  for(let m=0; m<12; m++) {
    for(let d=1; d<=monthDays[m]; d++) {
      const row = (yearData[m]||[]).find(r=>r[0]===d);
      const shift = row ? row[2] : 'F';
      if(shift === 'F') {
        // Count consecutive F days
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
          // Mark all these days as quinzena
          let mm2 = m, dd2 = d;
          for(let i=0; i<count; i++) {
            quinzena.add(`${mm2}-${dd2}`);
            dd2++;
            if(dd2 > monthDays[mm2]) { dd2=1; mm2++; }
          }
        }
      }
    }
  }
  return quinzena;
}

const RAINBOW_CLS = ['dc-q1','dc-q2','dc-q3','dc-q4','dc-q5','dc-q6','dc-q7'];

function getGreeting() {
  const h = new Date().getHours();
  if(h >= 6 && h < 12) return 'Bom dia';
  if(h >= 12 && h < 20) return 'Boa tarde';
  return 'Boa noite';
}

function formatTime(d) {
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}


function isInsideQuinzena(team, year) {
  const quinzenaDays = getQuinzenaDays(team, year);
  return quinzenaDays.has(`${todayM}-${todayD}`);
}

function getRemainingQuinzenaDays(team, year) {
  const quinzenaDays = getQuinzenaDays(team, year);
  const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
  let count = 0;
  let m = todayM, d = todayD;
  while(m < 12) {
    if(!quinzenaDays.has(`${m}-${d}`)) break;
    count++;
    d++;
    if(d > monthDays[m]) { d=1; m++; }
  }
  return { days: count, returnM: m, returnD: d };
}


function getShiftRefDate(){
  const d = new Date();
  if(d.getHours() < 5){
    d.setDate(d.getDate() - 1);
  }
  return d;
}

function getTeamsFor(dayOffset){
  // Que equipa faz M, T, N no dia de turno (0=hoje, 1=amanhã)
  const d = getShiftRefDate();
  d.setDate(d.getDate() + dayOffset);
  const res = {};
  for(const tm of ['A','B','C','D','E']){
    const s = getShift(tm, d.getFullYear(), d.getMonth(), d.getDate());
    if(s==='5') res.M = tm;
    else if(s==='13') res.T = tm;
    else if(s==='21') res.N = tm;
  }
  return res;
}

// Turnos de uma data exata (sem o recuo das 05h) — para o popup "Ver data"
function getTeamsForDate(y, mo, d){
  const res = {};
  for(const tm of ['A','B','C','D','E']){
    const s = getShift(tm, y, mo, d);
    if(s==='5') res.M = tm;
    else if(s==='13') res.T = tm;
    else if(s==='21') res.N = tm;
  }
  return res;
}


function getCurrentShiftKey(){
  // Que turno está a decorrer agora: M (05-13), T (13-21), N (21-05)
  const h = new Date().getHours();
  if(h >= 5 && h < 13) return 'M';
  if(h >= 13 && h < 21) return 'T';
  return 'N';
}


const MONTH_NAMES_PT = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];



function getFeriadoLocal(day, month) {
  return getFeriado(curYear, month, day);
}

