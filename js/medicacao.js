// ============================================================
// MEDICAÇÃO — vários medicamentos por dia, com a hora ajustada ao turno
//
// Duas coisas separadas de propósito:
//   • MEDICAMENTOS — nome, quantidade e QUANDO se tomam
//   • HORÁRIOS     — a que horas é cada momento do dia em cada turno
// Assim a hora do almoço define-se UMA vez, e não uma vez por comprimido.
//
// Cada medicamento pode ser de três tipos:
//   'momento'   — seigue o turno (o normal): ao acordar / almoço / fim do dia
//   'fixa'      — sempre à mesma hora, aconteça o que acontecer
//   'intervalo' — de N em N horas a partir da 1ª toma (antibióticos)
//
// As tomas pertencem ao DIA DE ESCALA (05h→05h, como o resto da app),
// não ao dia do calendário. É isso que permite ter uma toma à 01:00 a
// meio do turno da Noite sem ela saltar para o dia seguinte.
// ============================================================

const MED_ORDER = ['5','13','21','F'];
const MED_LBL = {
  '5':  {emo:'🐓', nome:'Manhã',  desc:'05h - 13h'},
  '13': {emo:'☀️', nome:'Tarde',  desc:'13h - 21h'},
  '21': {emo:'🌙', nome:'Noite',  desc:'21h - 05h'},
  'F':  {emo:'🏖️', nome:'Folga',  desc:'e férias'}
};

// Os três momentos do dia. As horas de origem seguem a lógica dos turnos:
// na Manhã toma-se depois de sair (13h → 14h), na Tarde antes de entrar
// (12h), e na Noite tudo desliza porque se acorda a meio da tarde.
// A linha do almoço são as mesmas horas que o lembrete já usava quando
// só havia uma toma por dia — quem já o tinha ligado não nota diferença.
const MED_MOMENTOS = [
  { id:'acordar', emo:'🌅', nome:'Ao acordar', curto:'Acordar',    horas:{'5':'04:30','13':'08:00','21':'13:00','F':'09:00'} },
  { id:'almoco',  emo:'🍽️', nome:'Ao almoço',  curto:'Almoço',     horas:{'5':'14:00','13':'12:00','21':'14:00','F':'14:00'} },
  { id:'fim',     emo:'🌜', nome:'Fim do dia', curto:'Fim do dia', horas:{'5':'20:00','13':'21:30','21':'19:30','F':'20:00'} }
];
function medMomento(id){ return MED_MOMENTOS.find(m => m.id === id) || MED_MOMENTOS[1]; }

// Intervalos para antibióticos e afins
const MED_INTERVALOS = [6, 8, 12];

// Horário de trabalho de cada turno, para avisar quando uma hora fixa cai a
// meio do turno — é exatamente isso que os momentos do dia evitam.
const MED_TRABALHO = { '5':[5,13], '13':[13,21], '21':[21,29] };   // 29 = 05h do dia seguinte
function medTurnosEmQueTrabalha(hhmm){
  const [hh, mm] = hhmm.split(':').map(Number);
  const h = hh + mm/60;
  return MED_ORDER.filter(s => {
    const w = MED_TRABALHO[s];
    if(!w) return false;                       // na folga nunca há conflito
    return (h >= w[0] && h < w[1]) || (h + 24 >= w[0] && h + 24 < w[1]);
  });
}

function medPad2(n){ return String(n).padStart(2,'0'); }
function medDateKey(d){ return `${d.getFullYear()}-${medPad2(d.getMonth()+1)}-${medPad2(d.getDate())}`; }
function medHhmm(d){ return medPad2(d.getHours()) + ':' + medPad2(d.getMinutes()); }
function medEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ============================================================
// Estado
// ============================================================
function getMedEnabled(){ return safeGet('medOn') === '1'; }

// --- Horários (a que horas é cada momento em cada turno) ---
function getMedHorarios(){
  let g = {};
  try { g = JSON.parse(safeGet('medHorarios') || '{}'); } catch(e){ g = {}; }
  const out = {};
  MED_MOMENTOS.forEach(m => { out[m.id] = Object.assign({}, m.horas, (g && g[m.id]) || {}); });
  return out;
}
function setMedHorario(momentoId, shift, hhmm){
  const g = getMedHorarios();
  g[momentoId][shift] = hhmm;
  safeSet('medHorarios', JSON.stringify(g));
}
function medHorariosDeOrigem(){ safeSet('medHorarios', '{}'); }

// --- Medicamentos ---
function getMedMeds(){
  let a = [];
  try { a = JSON.parse(safeGet('medMeds') || '[]'); } catch(e){ a = []; }
  if(!Array.isArray(a)) a = [];
  return a.filter(x => x && x.id).map(x => ({
    id: x.id,
    nome: (x.nome || '').trim() || 'Medicação',
    qtd: Number(x.qtd) > 0 ? Number(x.qtd) : 1,
    tipo: ['momento','fixa','intervalo'].includes(x.tipo) ? x.tipo : 'momento',
    momento: MED_MOMENTOS.some(m => m.id === x.momento) ? x.momento : 'almoco',
    hora: /^\d{2}:\d{2}$/.test(x.hora || '') ? x.hora : '08:00',
    cada: MED_INTERVALOS.includes(Number(x.cada)) ? Number(x.cada) : 8
  }));
}
function setMedMeds(arr){ safeSet('medMeds', JSON.stringify(arr)); }

// Quem já usava a versão de uma toma só fica com esse medicamento criado,
// e as horas que tinha passam a ser as do momento "Ao almoço" — assim o
// lembrete continua a tocar exatamente à mesma hora que antes.
function medMigrar(){
  if(safeGet('medMeds')) return;
  const antigo = safeGet('medTimes');
  if(antigo){
    try {
      const t = JSON.parse(antigo);
      const g = getMedHorarios();
      MED_ORDER.forEach(s => { if(t[s]) g.almoco[s] = t[s]; });
      safeSet('medHorarios', JSON.stringify(g));
    } catch(e){}
  }
  setMedMeds([{ id:'m'+Date.now(), nome:'Medicação', qtd:1, tipo:'momento', momento:'almoco', hora:'08:00', cada:8 }]);
}

// ============================================================
// Dia de escala e horas
// ============================================================
function medDiaEscala(){ const d = getShiftRefDate(); d.setHours(0,0,0,0); return d; }

function medShiftOf(d){
  const s = getShift(curTeam, d.getFullYear(), d.getMonth(), d.getDate());
  return (s === '5' || s === '13' || s === '21') ? s : 'F';
}
function medHoraDe(momentoId, shift){ return getMedHorarios()[momentoId][shift]; }

// Coloca uma hora HH:MM no dia certo do calendário.
//
// Uma hora de madrugada tanto pode ser o despertar do próprio dia como a
// noite dentro já do dia seguinte — depende do turno. Por isso cada turno
// tem uma hora de corte: tudo o que for mais cedo do que ela pertence à
// madrugada do dia SEGUINTE.
//   Manhã (corte 0)  — levanta-se de madrugada para entrar às 05h, logo as
//                      04:30 são desse mesmo dia; nada roda.
//   Tarde/Folga (5)  — a madrugada é o fim da noite anterior.
//   Noite (12)       — o dia começa a meio da tarde: tudo o que for antes
//                      das 12h já é a madrugada seguinte, seja a 01:00 a
//                      meio do turno ou às 05:30 mal ele acaba.
function medQuandoHora(hhmm, dia, shift){
  const [hh, mm] = hhmm.split(':').map(Number);
  const corte = shift === '21' ? 12 : (shift === '5' ? 0 : 5);
  const d = new Date(dia);
  if(hh < corte) d.setDate(d.getDate() + 1);
  d.setHours(hh, mm, 0, 0);
  return d;
}
function medDataHora(momentoId, dia, shift){
  return medQuandoHora(medHoraDe(momentoId, shift), dia, shift);
}

// Todas as tomas de um medicamento num dia de escala.
// Um medicamento de intervalo dá VÁRIAS tomas: a 1ª à hora definida e as
// seguintes de N em N horas a contar dela (por isso passam a meia-noite
// naturalmente, sem precisar de regras extra).
// Cada toma leva uma "chave" própria, para se poder marcar uma a uma.
function medOcorrencias(m, dia, shift){
  if(m.tipo === 'intervalo'){
    const base = medQuandoHora(m.hora, dia, shift);
    const n = Math.floor(24 / m.cada);
    const out = [];
    for(let k=0;k<n;k++){
      const q = new Date(base.getTime() + k*m.cada*3600000);
      out.push({ chave:`${m.id}#${k}`, quando:q, hhmm:medHhmm(q), ordem:k+1, total:n });
    }
    return out;
  }
  const hhmm = (m.tipo === 'fixa') ? m.hora : medHoraDe(m.momento, shift);
  return [{ chave:m.id, quando:medQuandoHora(hhmm, dia, shift), hhmm, ordem:1, total:1 }];
}

// Descrição curta de um medicamento, para a lista
function medDescricao(m, shift){
  if(m.tipo === 'fixa')      return `🕐 Todos os dias às <b>${m.hora}</b>`;
  if(m.tipo === 'intervalo') return `💊 De ${m.cada} em ${m.cada}h · a partir das <b>${m.hora}</b>`;
  const mo = medMomento(m.momento);
  return `${mo.emo} ${mo.nome} · hoje às <b>${medHoraDe(m.momento, shift)}</b>`;
}

// ============================================================
// Tomadas
// ============================================================
function getMedTomadas(){
  let o = {};
  try { o = JSON.parse(safeGet('medTomadas') || '{}'); } catch(e){ o = {}; }
  return (o && typeof o === 'object') ? o : {};
}
function medMarcar(chave){
  const dia = medDateKey(medDiaEscala());
  const o = getMedTomadas();
  if(!o[dia]) o[dia] = {};
  o[dia][chave] = formatTime(new Date());
  safeSet('medTomadas', JSON.stringify(o));
  renderMedAviso(); renderMedConfig();
}
function medDesmarcar(chave){
  const dia = medDateKey(medDiaEscala());
  const o = getMedTomadas();
  if(o[dia]) delete o[dia][chave];
  safeSet('medTomadas', JSON.stringify(o));
  renderMedAviso(); renderMedConfig();
}
// Guarda só as últimas 2 semanas — não interessa histórico antigo
function medLimparAntigas(){
  const o = getMedTomadas();
  const limite = new Date(); limite.setDate(limite.getDate() - 14);
  let mudou = false;
  for(const k of Object.keys(o)){
    const [y,m,d] = k.split('-').map(Number);
    if(new Date(y, m-1, d) < limite){ delete o[k]; mudou = true; }
  }
  if(mudou) safeSet('medTomadas', JSON.stringify(o));
}

// Todas as tomas de hoje, de todos os medicamentos, por ordem de hora
function medDoDia(){
  const dia = medDiaEscala();
  const shift = medShiftOf(dia);
  const feitas = getMedTomadas()[medDateKey(dia)] || {};
  const out = [];
  getMedMeds().forEach(m => {
    medOcorrencias(m, dia, shift).forEach(o => {
      out.push({
        med: m, momento: medMomento(m.momento),
        chave: o.chave, quando: o.quando, hhmm: o.hhmm,
        ordem: o.ordem, totalDoMed: o.total,
        tomada: !!feitas[o.chave], tomadaAs: feitas[o.chave] || null
      });
    });
  });
  return out.sort((a,b) => a.quando - b.quando);
}

// Como se descreve a toma no cartão (conforme o tipo)
function medSubtitulo(x){
  if(x.med.tipo === 'intervalo') return `💊 ${x.ordem}ª de ${x.totalDoMed} · de ${x.med.cada} em ${x.med.cada}h`;
  if(x.med.tipo === 'fixa')      return `🕐 hora fixa`;
  return `${x.momento.emo} ${x.momento.nome}`;
}

// ============================================================
// Cartão no separador Hoje
// ============================================================
function renderMedAviso(){
  const box = document.getElementById('med-aviso');
  if(!box) return;
  if(!getMedEnabled()){ box.innerHTML = ''; return; }

  const lista = medDoDia();
  if(!lista.length){ box.innerHTML = ''; return; }

  const shift = medShiftOf(medDiaEscala());
  const lbl = MED_LBL[shift];
  const feitas = lista.filter(x => x.tomada).length;
  const pontos = lista.map(x =>
    `<span class="med-dot${x.tomada ? ' ok' : ''}" title="${medEsc(x.med.nome)} · ${x.hhmm}"></span>`).join('');

  if(feitas === lista.length){
    box.innerHTML = `<div class="med-card med-done">
      <span class="med-txt">💊 <b>Medicação em dia</b> — ${feitas} de ${lista.length} ✓</span>
      <button class="med-btn med-undo" id="med-undo">↺</button>
    </div>
    <div class="med-prog">${pontos}<span class="med-cont">${lbl.emo} ${lbl.nome}</span></div>`;
    const u = document.getElementById('med-undo');
    if(u) u.onclick = () => medDesmarcar(lista[lista.length-1].chave);
    return;
  }

  const prox = lista.find(x => !x.tomada);
  const now = new Date();
  const diffMin = Math.round((prox.quando - now) / 60000);
  let estado, cls = '';
  if(diffMin > 0){
    const h = Math.floor(diffMin/60), m = diffMin % 60;
    estado = 'faltam ' + (h ? `${h}h${medPad2(m)}` : `${m} min`);
  } else if(diffMin > -120){
    estado = 'está na hora!'; cls = ' med-agora';
  } else {
    estado = `atrasado ${Math.floor(-diffMin/60)}h`; cls = ' med-tarde';
  }
  const ordem = lista.indexOf(prox) + 1;

  box.innerHTML = `<div class="med-card${cls}">
    <span class="med-txt">💊 <b>${medEsc(prox.med.nome)}</b> · ${prox.med.qtd} comp.
      <span class="med-hora-l">${prox.hhmm}</span>
      <span class="med-sub">${medSubtitulo(prox)} · ${estado} · ${ordem}ª de ${lista.length}</span></span>
    <button class="med-btn" id="med-ok">✓ Tomei</button>
  </div>
  <div class="med-prog">${pontos}<span class="med-cont">${feitas} de ${lista.length} tomadas hoje</span></div>`;
  document.getElementById('med-ok').onclick = () => medMarcar(prox.chave);
}

// ============================================================
// Som e vibração
// Só toca com a app aberta (à frente ou em segundo plano com o separador
// vivo). Com a app fechada nada disto corre — aí é o calendário que toca.
// Os sons são gerados na hora (Web Audio), sem ficheiros a carregar.
// ============================================================
const MED_SONS = [
  { id:'bip',     emo:'🔔', nome:'Bip',     desc:'curto' },
  { id:'alarme',  emo:'⏰', nome:'Alarme',  desc:'dois tons' },
  { id:'sino',    emo:'🛎️', nome:'Sino',    desc:'campainha' },
  { id:'urgente', emo:'🚨', nome:'Urgente', desc:'insistente' }
];
function medSomAtivo(){ return safeGet('medSom') !== '0'; }
function medSomTipo(){
  const s = safeGet('medSomTipo');
  return MED_SONS.some(x => x.id === s) ? s : 'alarme';
}

let medAudio = null;
function medTom(t0, freq, dur, tipo, vol){
  const osc = medAudio.createOscillator(), g = medAudio.createGain();
  osc.type = tipo || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(medAudio.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}
function medTocarSom(forcar){
  if(!forcar && !medSomAtivo()) return;
  const id = forcar || medSomTipo();
  const vibra = {
    bip:[220,130,220], alarme:[300,150,300,150,300],
    sino:[500], urgente:[110,70,110,70,110,70,110]
  };
  try { if(navigator.vibrate) navigator.vibrate(vibra[id] || [250]); } catch(e){}
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    if(!medAudio) medAudio = new AC();
    if(medAudio.state === 'suspended') medAudio.resume();
    const t = medAudio.currentTime + 0.03;

    if(id === 'bip'){                       // três bips redondos
      [0, 0.30, 0.60].forEach(d => medTom(t+d, 880, 0.20, 'sine', 0.6));

    } else if(id === 'alarme'){             // dois tons alternados, como um despertador
      for(let i=0;i<8;i++) medTom(t + i*0.28, i%2 ? 784 : 1046, 0.23, 'square', 0.3);

    } else if(id === 'sino'){               // campainha: fundamental + harmónicos a decair
      [0, 0.8, 1.6].forEach(d => {
        medTom(t+d, 1046, 1.0, 'sine', 0.55);
        medTom(t+d, 2093, 0.65, 'sine', 0.2);
        medTom(t+d, 3140, 0.4,  'sine', 0.09);
      });

    } else {                                // urgente: rajada rápida e aguda
      for(let i=0;i<12;i++) medTom(t + i*0.14, 1200, 0.085, 'sawtooth', 0.24);
    }
  } catch(e){}
}

// ============================================================
// Notificações do telemóvel
// ============================================================
function medNotifSuportado(){ return typeof Notification !== 'undefined'; }
function medNotifAtiva(){ return medNotifSuportado() && Notification.permission === 'granted' && safeGet('medNotif') === '1'; }

function medPedirNotificacoes(){
  if(!medNotifSuportado()){ alert('Este telemóvel não suporta avisos do browser. Usa o calendário.'); return; }
  Notification.requestPermission().then(p => {
    if(p === 'granted'){ safeSet('medNotif','1'); medMostrarNotificacao('💊 Avisos ligados','Vais ser avisado a cada toma.'); }
    else alert('Os avisos ficaram bloqueados. Podes usar o calendário, que é mais fiável.');
    renderMedConfig();
  });
}
function medMostrarNotificacao(titulo, corpo){
  try { new Notification(titulo, { body: corpo, icon: 'icons/icon-192.png', tag: 'med', silent: false }); } catch(e){}
}

function medVerificar(){
  renderMedAviso();
  if(!getMedEnabled()) return;
  const dia = medDateKey(medDiaEscala());
  const now = new Date();
  let avisadas = [];
  try { avisadas = JSON.parse(safeGet('medNotificadas') || '[]'); } catch(e){ avisadas = []; }

  medDoDia().forEach(x => {
    if(x.tomada || now < x.quando) return;
    if((now - x.quando) > 3*3600000) return;      // +3h de atraso, já não vale a pena
    const marca = dia + '|' + x.chave;
    if(avisadas.includes(marca)) return;
    avisadas.push(marca);
    safeSet('medNotificadas', JSON.stringify(avisadas.slice(-60)));
    if(medNotifAtiva()) medMostrarNotificacao('💊 Hora da medicação', `${x.med.nome} · ${x.med.qtd} comp. (${x.hhmm})`);
    medTocarSom();                                 // não depende da permissão de notificações
  });
}

// ============================================================
// Config no separador Mais
// ============================================================
let medHorariosAbertos = false;

function medPickerHTML(momento, shift, hhmm){
  const [hh, mm] = hhmm.split(':');
  const horas = Array.from({length:24}, (_,i) => medPad2(i));
  const mins = Array.from({length:12}, (_,i) => medPad2(i*5));
  if(!mins.includes(mm)){ mins.push(mm); mins.sort(); }
  return `<span class="med-picker">
    <select class="med-sel" data-momento="${momento}" data-shift="${shift}" data-part="h" aria-label="Hora">
      ${horas.map(x => `<option value="${x}"${x===hh?' selected':''}>${x}</option>`).join('')}
    </select><span class="med-sep">:</span>
    <select class="med-sel" data-momento="${momento}" data-shift="${shift}" data-part="m" aria-label="Minutos">
      ${mins.map(x => `<option value="${x}"${x===mm?' selected':''}>${x}</option>`).join('')}
    </select></span>`;
}

function renderMedConfig(){
  const box = document.getElementById('med-config');
  if(!box) return;
  const on = getMedEnabled();

  const cabeca = `<div class="med-row">
      <span class="med-label">Lembrete de medicação</span>
      <button class="med-toggle${on?' on':''}" id="med-toggle"><span class="med-knob"></span></button>
    </div>`;

  function ligarToggle(){
    document.getElementById('med-toggle').onclick = () => {
      safeSet('medOn', on ? '0' : '1');
      if(!on) medMigrar();
      renderMedConfig(); renderMedAviso();
    };
  }

  if(!on){ box.innerHTML = cabeca; ligarToggle(); return; }

  const dia = medDiaEscala();
  const shiftHoje = medShiftOf(dia);
  const lista = medDoDia();
  const feitas = lista.filter(x => x.tomada).length;
  const meds = getMedMeds();
  const horarios = getMedHorarios();
  const notifOn = medNotifAtiva();
  const somOn = medSomAtivo();

  let h = cabeca + `<div class="med-body">`;

  if(lista.length){
    h += `<div class="med-resumo">${feitas} de ${lista.length} tomadas hoje ·
      ${MED_LBL[shiftHoje].emo} ${MED_LBL[shiftHoje].nome}</div>`;
  }

  // ---- Lista de medicamentos (uma linha por medicamento) ----
  h += `<div class="med-secao">Os meus medicamentos</div>`;
  if(!meds.length){
    h += `<div class="med-vazio">Ainda não tens medicamentos.<br>
      <small>Toca em "Adicionar medicamento" para o primeiro.</small></div>`;
  }
  meds.forEach(m => {
    const ocs = medOcorrencias(m, dia, shiftHoje);
    const feitasM = ocs.filter(o => lista.find(x => x.chave === o.chave && x.tomada)).length;
    const todas = feitasM === ocs.length;
    h += `<button class="med-item${todas?' med-item-ok':''}" data-edit="${m.id}">
      <span class="med-item-body">
        <span class="med-item-n">${medEsc(m.nome)}</span>
        <span class="med-item-s">${medDescricao(m, shiftHoje)}${ocs.length>1?` · ${feitasM}/${ocs.length} hoje`:(todas?' · ✓':'')}</span>
      </span>
      <span class="med-item-q">${m.qtd} comp.</span>
      <span class="med-item-e">✏️</span>
    </button>`;
  });
  h += `<button class="med-addbtn" id="med-add">➕ Adicionar medicamento</button>`;

  // ---- Horários ----
  h += `<div class="med-secao">Horários</div>
    <button class="med-fold${medHorariosAbertos?' aberto':''}" id="med-fold">
      <span>🕐 Horas de cada momento
        <small>a que horas é o acordar, o almoço e o fim do dia</small></span>
      <span class="med-fold-a">${medHorariosAbertos?'▴':'▾'}</span>
    </button>`;

  if(medHorariosAbertos){
    h += `<div class="med-tab">
      <div class="med-tr"><div class="med-th l">Momento</div>` +
      MED_ORDER.map(s => `<div class="med-th${s===shiftHoje?' agora':''}">${MED_LBL[s].emo}</div>`).join('') +
      `</div>`;
    MED_MOMENTOS.forEach(m => {
      h += `<div class="med-tr"><div class="med-td l">${m.emo} ${m.curto}</div>` +
        MED_ORDER.map(s => `<div class="med-td${s===shiftHoje?' agora':''}">${medPickerHTML(m.id, s, horarios[m.id][s])}</div>`).join('') +
        `</div>`;
    });
    h += `</div>
      <div class="med-tab-nota">A coluna do turno de hoje está marcada · isto não afeta os medicamentos de hora fixa nem os de intervalo</div>
      <button class="med-reset" id="med-reset">↺ Repor horas de origem</button>`;
  }

  // ---- Avisos ----
  h += `<div class="med-secao">Como queres ser avisado</div>
    <button class="med-acao${notifOn?' ativa':''}" id="med-notif">${notifOn?'🔔 Avisos no telemóvel ligados':'🔕 Ligar avisos no telemóvel'}</button>
    <button class="med-acao med-som${somOn?' ativa':''}" id="med-som">${somOn?'🔊 Som e vibração ligados':'🔇 Som e vibração desligados'}</button>`;
  if(somOn){
    h += `<div class="med-som-grid">` + MED_SONS.map(s =>
      `<button class="med-somb${s.id===medSomTipo()?' on':''}" data-som="${s.id}">
        <span class="e">${s.emo}</span><span class="n">${s.nome}</span><span class="d">${s.desc}</span>
      </button>`).join('') +
      `</div><div class="med-som-nota">Toca num som para o ouvires · o escolhido fica marcado</div>`;
  }
  h += `<button class="med-acao med-cal" id="med-export">📅 Adicionar 90 dias ao calendário</button>
    <div class="med-note">O <b>som e a vibração</b> só tocam com a app aberta (à frente ou em segundo plano).<br>
    Os <b>avisos no telemóvel</b> usam o som de notificação do sistema; no iPhone só funcionam com a app instalada no ecrã principal.<br>
    O <b>calendário</b> é o mais seguro: cria um lembrete por cada toma, já com a hora certa de cada dia conforme o turno, para os próximos 3 meses — e é o único que toca <b>com a app fechada</b>. Repete de vez em quando para renovar.</div>
  </div>`;

  box.innerHTML = h;
  ligarToggle();

  box.querySelectorAll('[data-edit]').forEach(b => { b.onclick = () => medAbrirForm(b.dataset.edit); });
  document.getElementById('med-add').onclick = () => medAbrirForm(null);
  document.getElementById('med-fold').onclick = () => { medHorariosAbertos = !medHorariosAbertos; renderMedConfig(); };

  box.querySelectorAll('.med-sel').forEach(sel => {
    sel.onchange = () => {
      const atual = getMedHorarios()[sel.dataset.momento][sel.dataset.shift];
      const [hh, mm] = atual.split(':');
      setMedHorario(sel.dataset.momento, sel.dataset.shift,
        sel.dataset.part === 'h' ? `${sel.value}:${mm}` : `${hh}:${sel.value}`);
      renderMedConfig(); renderMedAviso();
    };
  });
  const reset = document.getElementById('med-reset');
  if(reset) reset.onclick = () => {
    if(!confirm('Repor as horas de origem dos três momentos?')) return;
    medHorariosDeOrigem(); renderMedConfig(); renderMedAviso();
  };

  document.getElementById('med-notif').onclick = () => {
    if(medNotifAtiva()){ safeSet('medNotif','0'); renderMedConfig(); }
    else medPedirNotificacoes();
  };
  document.getElementById('med-som').onclick = () => {
    safeSet('medSom', medSomAtivo() ? '0' : '1');
    renderMedConfig();
    if(medSomAtivo()) medTocarSom();
  };
  box.querySelectorAll('.med-somb').forEach(b => {
    b.onclick = () => { safeSet('medSomTipo', b.dataset.som); medTocarSom(b.dataset.som); renderMedConfig(); };
  });
  document.getElementById('med-export').onclick = downloadMedICS;
}

// ============================================================
// Formulário de medicamento (abre por cima)
// ============================================================
let medForm = null;   // {id|null, nome, qtd, tipo, momento, hora, cada}

function medConstruirForm(){
  if(document.getElementById('medform')) return;
  const d = document.createElement('div');
  d.className = 'medform-overlay';
  d.id = 'medform';
  d.innerHTML = `<div class="medform-modal">
    <div class="medform-head">
      <div class="medform-title" id="medform-title">Novo medicamento</div>
      <button class="medform-x" id="medform-x">✕</button>
    </div>
    <label class="medform-lbl">Como se chama?</label>
    <input class="medform-input" id="medform-nome" maxlength="28" placeholder="ex: Metformina" autocomplete="off">
    <label class="medform-lbl">Quantos comprimidos?</label>
    <div class="medform-qrow">
      <button class="medform-qb" id="medform-menos">−</button>
      <span class="medform-qv" id="medform-qtd">1</span>
      <button class="medform-qb" id="medform-mais">+</button>
      <span class="medform-qu">comp.</span>
    </div>
    <label class="medform-lbl">Quando é que tomas?</label>
    <div class="medform-mgrid" id="medform-momentos"></div>
    <div class="medform-tipos" id="medform-tipos"></div>
    <div class="medform-extra" id="medform-extra"></div>
    <div class="medform-prev" id="medform-prev"></div>
    <div class="medform-msg" id="medform-msg"></div>
    <button class="medform-save" id="medform-save">Guardar</button>
    <button class="medform-del" id="medform-del">🗑 Apagar medicamento</button>
  </div>`;
  document.body.appendChild(d);
  d.addEventListener('click', e => { if(e.target === d) medFecharForm(); });
  document.getElementById('medform-x').onclick = medFecharForm;
  document.getElementById('medform-menos').onclick = () => { medForm.qtd = Math.max(1, medForm.qtd-1); medPintarForm(); };
  document.getElementById('medform-mais').onclick  = () => { medForm.qtd = Math.min(20, medForm.qtd+1); medPintarForm(); };
  document.getElementById('medform-nome').oninput  = e => { medForm.nome = e.target.value; };
  document.getElementById('medform-save').onclick  = medGuardarForm;
  document.getElementById('medform-del').onclick   = medApagarForm;
}

function medHoraSelectHTML(hhmm){
  const [hh, mm] = hhmm.split(':');
  const horas = Array.from({length:24}, (_,i) => medPad2(i));
  const mins = Array.from({length:12}, (_,i) => medPad2(i*5));
  if(!mins.includes(mm)){ mins.push(mm); mins.sort(); }
  return `<span class="medform-hora">
    <select id="medform-hh">${horas.map(x=>`<option${x===hh?' selected':''}>${x}</option>`).join('')}</select>
    <span>:</span>
    <select id="medform-mm">${mins.map(x=>`<option${x===mm?' selected':''}>${x}</option>`).join('')}</select>
  </span>`;
}

function medPintarForm(){
  document.getElementById('medform-qtd').textContent = medForm.qtd;

  // momentos do dia (seguem o turno)
  document.getElementById('medform-momentos').innerHTML = MED_MOMENTOS.map(m =>
    `<button class="medform-mb${medForm.tipo==='momento' && m.id===medForm.momento?' on':''}" data-m="${m.id}">
      <span class="e">${m.emo}</span><span class="n">${m.nome}</span></button>`).join('');
  // hora fixa / intervalo
  document.getElementById('medform-tipos').innerHTML =
    `<button class="medform-tb${medForm.tipo==='fixa'?' on':''}" data-t="fixa">🕐 Hora fixa</button>
     <button class="medform-tb${medForm.tipo==='intervalo'?' on':''}" data-t="intervalo">💊 De N em N horas</button>`;

  document.querySelectorAll('.medform-mb').forEach(b => {
    b.onclick = () => { medForm.tipo='momento'; medForm.momento = b.dataset.m; medPintarForm(); };
  });
  document.querySelectorAll('.medform-tb').forEach(b => {
    b.onclick = () => { medForm.tipo = b.dataset.t; medPintarForm(); };
  });

  // controlos extra conforme o tipo
  const extra = document.getElementById('medform-extra');
  if(medForm.tipo === 'fixa'){
    extra.innerHTML = `<div class="medform-linha"><span>A que horas?</span>${medHoraSelectHTML(medForm.hora)}</div>`;
  } else if(medForm.tipo === 'intervalo'){
    extra.innerHTML = `<div class="medform-linha"><span>De quantas em quantas horas?</span>
        <span class="medform-cada">${MED_INTERVALOS.map(n =>
          `<button class="medform-cb${n===medForm.cada?' on':''}" data-c="${n}">${n}h</button>`).join('')}</span></div>
      <div class="medform-linha"><span>1ª toma às</span>${medHoraSelectHTML(medForm.hora)}</div>`;
    extra.querySelectorAll('.medform-cb').forEach(b => {
      b.onclick = () => { medForm.cada = Number(b.dataset.c); medPintarForm(); };
    });
  } else {
    extra.innerHTML = '';
  }
  extra.querySelectorAll('select').forEach(s => {
    s.onchange = () => {
      medForm.hora = document.getElementById('medform-hh').value + ':' + document.getElementById('medform-mm').value;
      medPintarForm();
    };
  });

  // previsão + aviso de conflito com o turno
  const dia = medDiaEscala(), shift = medShiftOf(dia);
  const ocs = medOcorrencias({ ...medForm, id:'prev' }, dia, shift);
  const horasTxt = ocs.map(o => o.hhmm).join(' · ');
  let prev = `Hoje (${MED_LBL[shift].emo} ${MED_LBL[shift].nome}) seria às <b>${horasTxt}</b>`;
  if(medForm.tipo === 'momento') prev += `<br><small>a hora muda sozinha conforme o turno</small>`;
  else prev += `<br><small>esta hora é sempre a mesma, não muda com o turno</small>`;
  document.getElementById('medform-prev').innerHTML = prev;

  const aviso = document.getElementById('medform-msg');
  if(medForm.tipo === 'momento'){ aviso.className = 'medform-msg'; aviso.textContent = ''; }
  else {
    const conflitos = new Set();
    ocs.forEach(o => medTurnosEmQueTrabalha(o.hhmm).forEach(s => conflitos.add(s)));
    if(conflitos.size){
      aviso.className = 'medform-msg medform-conflito';
      aviso.innerHTML = `⚠️ Em dias de ${[...conflitos].map(s => MED_LBL[s].emo+' '+MED_LBL[s].nome).join(' e ')} ` +
        `estás a trabalhar a essa hora. Podes guardar à mesma, ou escolher um momento do dia em cima — esses acompanham o turno.`;
    } else { aviso.className = 'medform-msg'; aviso.textContent = ''; }
  }
}

function medAbrirForm(id){
  medConstruirForm();
  const m = id ? getMedMeds().find(x => x.id === id) : null;
  medForm = m ? { id:m.id, nome:m.nome, qtd:m.qtd, tipo:m.tipo, momento:m.momento, hora:m.hora, cada:m.cada }
              : { id:null, nome:'', qtd:1, tipo:'momento', momento:'almoco', hora:'08:00', cada:8 };
  document.getElementById('medform-title').textContent = m ? 'Editar medicamento' : 'Novo medicamento';
  document.getElementById('medform-nome').value = medForm.nome;
  document.getElementById('medform-del').style.display = m ? 'block' : 'none';
  medPintarForm();
  document.getElementById('medform').classList.add('open');
  if(!m) setTimeout(() => document.getElementById('medform-nome').focus(), 120);
}
function medFecharForm(){
  const el = document.getElementById('medform');
  if(el) el.classList.remove('open');
  medForm = null;
}
function medGuardarForm(){
  if(!medForm) return;
  const nome = (medForm.nome || '').trim();
  if(!nome){
    const msg = document.getElementById('medform-msg');
    msg.className = 'medform-msg'; msg.textContent = '⚠️ Falta o nome do medicamento.';
    document.getElementById('medform-nome').focus();
    return;
  }
  const arr = getMedMeds();
  const dados = { nome, qtd:medForm.qtd, tipo:medForm.tipo, momento:medForm.momento, hora:medForm.hora, cada:medForm.cada };
  if(medForm.id){
    const m = arr.find(x => x.id === medForm.id);
    if(m) Object.assign(m, dados);
  } else {
    arr.push(Object.assign({ id:'m'+Date.now() }, dados));
  }
  setMedMeds(arr);
  medFecharForm();
  renderMedConfig(); renderMedAviso();
}
function medApagarForm(){
  if(!medForm || !medForm.id) return;
  if(!confirm(`Apagar "${medForm.nome}"?`)) return;
  setMedMeds(getMedMeds().filter(x => x.id !== medForm.id));
  medFecharForm();
  renderMedConfig(); renderMedAviso();
}

// ============================================================
// Exportar .ics — um aviso por cada toma, 90 dias
// ============================================================
function generateMedICS(){
  const meds = getMedMeds();
  const inicio = medDiaEscala();
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Verallia Turnos//Medicacao//PT\r\nCALSCALE:GREGORIAN\r\n';
  let count = 0;
  for(let i=0;i<90;i++){
    const dia = new Date(inicio); dia.setDate(dia.getDate()+i);
    const shift = medShiftOf(dia);
    meds.forEach(m => {
      medOcorrencias(m, dia, shift).forEach(o => {
        const q = o.quando;
        const ymd = `${q.getFullYear()}${medPad2(q.getMonth()+1)}${medPad2(q.getDate())}`;
        const dt = `${ymd}T${medPad2(q.getHours())}${medPad2(q.getMinutes())}00`;
        ics += 'BEGIN:VEVENT\r\n';
        ics += `UID:med-${o.chave.replace('#','-')}-${ymd}-${curTeam}@verallia-turnos\r\n`;
        ics += `DTSTAMP:${ymd}T000000\r\n`;
        ics += `DTSTART:${dt}\r\nDTEND:${dt}\r\n`;
        ics += `SUMMARY:💊 ${m.nome} (${m.qtd})\r\n`;
        ics += `DESCRIPTION:${m.qtd} comp. · ${MED_LBL[shift].nome} (${MED_LBL[shift].desc})\r\n`;
        ics += 'BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:PT0M\r\nDESCRIPTION:Hora da medicação\r\nEND:VALARM\r\n';
        ics += 'END:VEVENT\r\n';
        count++;
      });
    });
  }
  ics += 'END:VCALENDAR\r\n';
  return { ics, count };
}

function downloadMedICS(){
  const { ics, count } = generateMedICS();
  if(!count){ alert('Ainda não tens medicamentos para exportar.'); return; }
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `medicacao-${curTeam}.ics`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

// ============================================================
function initMedicacao(){
  if(getMedEnabled()) medMigrar();
  medLimparAntigas();
  renderMedConfig();
  renderMedAviso();
  setInterval(medVerificar, 30000);
  document.addEventListener('visibilitychange', () => { if(!document.hidden) medVerificar(); });
}
