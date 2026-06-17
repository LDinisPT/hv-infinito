// ============================================================
// MÉDICO — posto médico
// ============================================================
function renderMedico() {
  const card = document.getElementById('medico-card');
  if(!card) return;
  
  // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  const todayDow = today.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  
  const schedule = [
    { dow:1, name:'2ª feira', enf:'9:00 – 14:00', med:'Dra. Isabel Pedro', medH:'9:00 – 13:00' },
    { dow:2, name:'3ª feira', enf:'9:00 – 14:00', med:'Dr. Isaac Ramos',   medH:'9:00 – 13:00' },
    { dow:3, name:'4ª feira', enf:'9:00 – 14:00', med:'Dra. Isabel Pedro', medH:'14:00 – 18:00', medRole:'Médico tarde' },
    { dow:4, name:'5ª feira', enf:'9:00 – 14:00', med:null },
    { dow:5, name:'6ª feira', enf:'9:00 – 14:00', med:'Dr. Isaac Ramos',   medH:'9:00 – 13:00' },
  ];
  
  // Cores cromoterapia por dia (1=Seg..5=Sex)
  const DOW_COLOR = {1:'#E8E8F0',2:'#FF5A5A',3:'#4ADE80',4:'#5AA9FF',5:'#FF7FB6'};

  const rows = schedule.map(s => {
    const isToday = s.dow === todayDow;
    const diaCor = DOW_COLOR[s.dow] || '#fff';
    const medHTML = s.med
      ? `<div class="medico-person">
          <div class="medico-role role-med">${s.medRole||'Médico'}</div>
          <div class="medico-name">${s.med}</div>
          <div class="medico-hours">${s.medH}</div>
        </div>`
      : `<div class="medico-none">Sem médico</div>`;
    
    return `<div class="medico-row${isToday?' medico-today':''}">
      <div class="medico-day" style="color:${diaCor}">${s.name}</div>
      <div class="medico-person">
        <div class="medico-role role-enf">Enfermeira</div>
        <div class="medico-hours">${s.enf}</div>
      </div>
      ${medHTML}
    </div>`;
  }).join('');
  
  card.innerHTML = `
    <div class="medico-title"><span class="med-cross">✚</span> Horário do Posto Médico <span class="med-cross">✚</span></div>
    ${rows}`;
}

