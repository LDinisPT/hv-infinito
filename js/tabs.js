// ============================================================
// TABS — navegação entre separadores (Hoje · Mês · Médico · Mais)
// ============================================================
function showTab(name){
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'tab-' + name);
  });
  document.querySelectorAll('.tabbar-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  try { window.scrollTo({top:0, behavior:'instant'}); } catch(e){ window.scrollTo(0,0); }
  safeSet('lastTab', name);
}

function initTabs(){
  document.getElementById('tabbar').addEventListener('click', e => {
    const btn = e.target.closest('.tabbar-btn');
    if(btn && btn.dataset.tab) showTab(btn.dataset.tab);
  });
  // Abre sempre no "Hoje" (conforme definido)
  showTab('hoje');
}
