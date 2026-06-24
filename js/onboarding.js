// ============================================================
// ONBOARDING — ecrã de boas-vindas na primeira utilização
// ============================================================
let onbTeam = null;

function onbCheckValid(){
  const nameInput = document.getElementById('onb-name');
  const startBtn = document.getElementById('onb-start');
  if(!nameInput || !startBtn) return;
  const ok = nameInput.value.trim().length > 0 && onbTeam;
  startBtn.disabled = !ok;
  startBtn.classList.toggle('ready', ok);
}

function initOnboarding(){
  const overlay = document.getElementById('onb-overlay');
  if(!overlay) return;
  const nameInput = document.getElementById('onb-name');
  const startBtn = document.getElementById('onb-start');
  onbTeam = safeGet('team') || null;

  overlay.querySelectorAll('.onb-team').forEach(b => {
    b.onclick = () => {
      onbTeam = b.dataset.team;
      overlay.querySelectorAll('.onb-team').forEach(x => x.classList.toggle('sel', x===b));
      onbCheckValid();
    };
  });
  nameInput.addEventListener('input', onbCheckValid);
  nameInput.addEventListener('keydown', e => { if(e.key === 'Enter' && !startBtn.disabled) startBtn.click(); });
  startBtn.onclick = () => {
    const nome = nameInput.value.trim();
    if(!nome || !onbTeam) return;
    safeSet('userName', nome);
    safeSet('team', onbTeam);
    if(typeof marcarTodasNovidadesVistas === 'function') marcarTodasNovidadesVistas();
    overlay.style.display = 'none';
    applyUserName(nome);
    setTeam(onbTeam);
    showTab('hoje');
  };

  if(safeGet('userName')){
    overlay.style.display = 'none';
  } else {
    overlay.style.display = 'flex';
    onbCheckValid();
  }
}

function applyUserName(nome){
  const hello = document.getElementById('tb-hello');
  if(hello) hello.textContent = nome ? `Olá ${nome} 👋` : 'Olá 👋';
}

function resetOnboarding(){
  const overlay = document.getElementById('onb-overlay');
  if(!overlay) return;
  const nameInput = document.getElementById('onb-name');
  if(nameInput) nameInput.value = safeGet('userName') || '';
  onbTeam = curTeam;
  overlay.querySelectorAll('.onb-team').forEach(x => x.classList.toggle('sel', x.dataset.team === curTeam));
  overlay.style.display = 'flex';
  onbCheckValid();
}
