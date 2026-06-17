// ============================================================
// APP — inicialização, setTeam, listeners
// ============================================================

function setTeam(t){
  curTeam = t;
  safeSet('team', t);
  const sel = document.getElementById('team-select');
  if(sel){ sel.value = t; sel.className = 'team-select sel-' + t; }
  renderHoje();
  renderCiclo();
  renderCalendar();
  renderFeriados();
  renderMedico();
  renderStats();
  renderQuinzena();
  if(typeof renderAlarmAviso === 'function') renderAlarmAviso();
  // Definições
  const dn = document.getElementById('def-name');
  const dt = document.getElementById('def-team');
  if(dn) dn.textContent = safeGet('userName') || '—';
  if(dt) dt.textContent = 'Equipa ' + t;
}

function initApp(){
  // Saudação "Olá nome" na topbar
  applyUserName(safeGet('userName'));

  // Definições (separador Mais)
  const defReconfig = document.getElementById('def-reconfig');
  if(defReconfig) defReconfig.onclick = resetOnboarding;

  // Seletor de equipa (dropdown)
  const sel = document.getElementById('team-select');
  if(sel) sel.addEventListener('change', e => setTeam(e.target.value));

  // Navegação ano/mês (separador Mês)
  const yl = () => document.getElementById('year-lbl');
  const setYL = () => { if(yl()) yl().textContent = curYear; };
  document.getElementById('prev-yr').onclick = ()=>{curYear--;setYL();renderCalendar();renderFeriados();renderStats();};
  document.getElementById('next-yr').onclick = ()=>{curYear++;setYL();renderCalendar();renderFeriados();renderStats();};
  document.getElementById('prev-mo').onclick = ()=>{if(curMonth===0){curMonth=11;curYear--;}else curMonth--;setYL();renderCalendar();renderFeriados();};
  document.getElementById('next-mo').onclick = ()=>{if(curMonth===11){curMonth=0;curYear++;}else curMonth++;setYL();renderCalendar();renderFeriados();};

  // Botão Hoje (separador Mês) + Ver data (separador Hoje)
  const btnHoje = document.getElementById('btn-hoje-mes');
  if(btnHoje) btnHoje.onclick = goToToday;
  const btnVerData = document.getElementById('btn-ver-data');
  if(btnVerData) btnVerData.onclick = openDatePopup;

  // Popup Ver data
  document.getElementById('date-input').addEventListener('change', e => showDateResult(e.target.value));
  document.getElementById('date-close').onclick = closeDatePopup;
  document.getElementById('date-overlay').addEventListener('click', e => {
    if(e.target.id === 'date-overlay') closeDatePopup();
  });

  setYL();

  // Instalação PWA
  window.addEventListener('beforeinstallprompt', e=>{
    e.preventDefault(); deferredPrompt=e;
    const bar = document.getElementById('install-bar');
    if(bar) bar.classList.add('show');
  });
  const ib = document.getElementById('install-btn');
  if(ib) ib.onclick = async()=>{
    if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; document.getElementById('install-bar').classList.remove('show'); }
  };

  // Render inicial
  setTeam(curTeam);
  renderEventosGrupo();
  renderAlarmConfig();
  fetchWeather();

  // Relógio + atualização de turno
  setInterval(renderClock, 1000);
  let _lastShiftKey = getCurrentShiftKey();
  setInterval(() => {
    const k = getCurrentShiftKey();
    if(k !== _lastShiftKey){ _lastShiftKey = k; renderHoje(); }
  }, 30000);
  setInterval(fetchWeather, 1800000);

  // Separadores
  initTabs();

  // Onboarding (1ª vez)
  initOnboarding();

  // Mini manual (accordion)
  document.querySelectorAll('#manual .man-q').forEach(q => {
    q.onclick = () => q.parentElement.classList.toggle('open');
  });
}

let deferredPrompt;
document.addEventListener('DOMContentLoaded', initApp);
