// ============================================================
// MAIS — estatísticas, eventos do grupo
// ============================================================
const EVENTOS_GRUPO = [
  {data:'2026-04-18', nome:'18º Convívio de Tiro ao Alvo'},
  {data:'2026-05-23', nome:'II Grande Prémio Verallia Karting'},
  {data:'2026-05-30', nome:'Passeio Moto Turismo + Casa de Santar'},
  {data:'2026-06-06', nome:'7º Ciclo Convívio'},
  {data:'2026-06-14', nome:'A Corrida Mais Bonita de Portugal'},
  {data:'2026-06-27', nome:'Descida do Rio Mondego'},
  {data:'2026-09-29', nome:'Caminhada de Convívio'},
  {data:'2026-12-19', nome:'Festa de Natal das Crianças + Prenda do Grupo'},
  {data:null, nome:'XXIIº Torneio de Futsal Verallia Portugal'},
];
const EVT_MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function renderEventosGrupo(){
  const wrap = document.getElementById('eventos-grupo');
  if(!wrap) return;
  const hoje = new Date(); hoje.setHours(0,0,0,0);

  // determinar passados e o próximo (primeiro com data >= hoje)
  let nextIdx = -1;
  const enriched = EVENTOS_GRUPO.map((ev, i) => {
    if(!ev.data) return {...ev, past:false, dateObj:null};
    const [y,m,d] = ev.data.split('-').map(Number);
    const dt = new Date(y, m-1, d); dt.setHours(0,0,0,0);
    return {...ev, dateObj:dt, past: dt < hoje};
  });
  for(let i=0;i<enriched.length;i++){
    if(enriched[i].dateObj && !enriched[i].past){ nextIdx = i; break; }
  }
  const realizados = enriched.filter(e => e.past).length;
  const totalComData = enriched.filter(e => e.dateObj).length;

  const isOpen = safeGet('evtOpen') === '1';

  const itemsHTML = enriched.map((ev, i) => {
    const isNext = i === nextIdx;
    const cls = ev.past ? 'evt-past' : (isNext ? 'evt-next' : '');
    let dateHTML;
    if(ev.dateObj){
      dateHTML = `<div class="evt-date"><div class="evt-day">${String(ev.dateObj.getDate()).padStart(2,'0')}</div><div class="evt-mon">${EVT_MESES[ev.dateObj.getMonth()]}</div></div>`;
    } else {
      dateHTML = `<div class="evt-date"><div class="evt-date-tbd">a def.</div></div>`;
    }
    const nameHTML = isNext
      ? `<div class="evt-name"><div class="evt-next-lbl">★ Próximo evento</div>${ev.nome}</div>`
      : `<div class="evt-name">${ev.nome}</div>`;
    const checkHTML = ev.past ? '<i class="ti ti-circle-check evt-check"></i>' : '';
    return `<div class="evt-item ${cls}">${dateHTML}${nameHTML}${checkHTML}</div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="evt-card">
      <button class="evt-toggle" id="evt-toggle">
        <span class="evt-toggle-info">
          <span class="evt-toggle-icon">🏆</span>
          <span style="min-width:0;">
            <span class="evt-toggle-title">Grupo Cultural e Desportivo da Verallia Portugal</span>
            <span class="evt-toggle-sub">Atividades 2026 · ${realizados} de ${totalComData} realizadas</span>
          </span>
        </span>
        <i class="ti ti-chevron-right evt-chev${isOpen?' open':''}" id="evt-chev"></i>
      </button>
      <div class="evt-body" id="evt-body" style="display:${isOpen?'flex':'none'};">
        ${itemsHTML}
      </div>
    </div>`;

  document.getElementById('evt-toggle').onclick = () => {
    const body = document.getElementById('evt-body');
    const chev = document.getElementById('evt-chev');
    const open = body.style.display === 'none';
    body.style.display = open ? 'flex' : 'none';
    chev.classList.toggle('open', open);
    safeSet('evtOpen', open ? '1' : '0');
  };
}


function renderStats() {
  const grid = document.getElementById('stats-grid');
  if(!grid) return;
  let m=0,t=0,n=0,f=0,x=0;
  const yearData = (SCHEDULES[curYear]||{})[curTeam]||[];
  yearData.forEach(month => month.forEach(row => {
    const s = row[2];
    if(s==='5') m++;
    else if(s==='13') t++;
    else if(s==='21') n++;
    else if(s==='X') x++;
    else f++;
  }));
  const stats = [
    {num:m,lbl:'Manhã',color:'#378ADD'},
    {num:t,lbl:'Tarde',color:'#1D9E75'},
    {num:n,lbl:'Noite',color:'#7F77DD'},
    {num:m+t+n+x,lbl:'Trabalhados',color:'rgba(255,255,255,0.2)'},
  ];
  grid.innerHTML = stats.map(s=>`
    <div class="stat">
      <div class="stat-bar" style="background:${s.color}"></div>
      <div><div class="stat-num" style="color:${s.color}">${s.num}</div><div class="stat-lbl">${s.lbl}</div></div>
    </div>`).join('');
}

