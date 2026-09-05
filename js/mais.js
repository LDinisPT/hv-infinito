// ============================================================
// MAIS — estatísticas, eventos do grupo
// ============================================================
// Atividades do Grupo Cultural e Desportivo, ano a ano.
// PARA ATUALIZAR: quando o Grupo publicar o calendário do ano seguinte,
// junta aqui uma entrada nova (ex.: 2027: [...]) com as datas. Mais nada
// é preciso — a app passa a mostrar esse ano sozinha. Enquanto o ano novo
// não for acrescentado, a app avisa que o calendário ainda não está feito
// em vez de mostrar as atividades do ano anterior como se fossem deste.
const EVENTOS_GRUPO_ANOS = {
  2026: [
    {data:'2026-04-18', nome:'18º Convívio de Tiro ao Alvo'},
    {data:'2026-05-23', nome:'II Grande Prémio Verallia Karting'},
    {data:'2026-05-30', nome:'Passeio Moto Turismo + Casa de Santar'},
    {data:'2026-06-06', nome:'7º Ciclo Convívio'},
    {data:'2026-06-14', nome:'A Corrida Mais Bonita de Portugal'},
    {data:'2026-06-27', nome:'Descida do Rio Mondego'},
    {data:'2026-09-29', nome:'Caminhada de Convívio'},
    {data:'2026-12-19', nome:'Festa de Natal das Crianças + Prenda do Grupo'},
    {data:null, nome:'XXIIº Torneio de Futsal Verallia Portugal'},
  ]
};

// Todos os anos numa só lista — usada pela timeline do separador Hoje.
const EVENTOS_GRUPO = Object.keys(EVENTOS_GRUPO_ANOS)
  .sort()
  .reduce((acc, ano) => acc.concat(EVENTOS_GRUPO_ANOS[ano]), []);
const EVT_MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function renderEventosGrupo(){
  const wrap = document.getElementById('eventos-grupo');
  if(!wrap) return;
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const ano = curYear;
  const lista = EVENTOS_GRUPO_ANOS[ano];

  // Ano ainda sem calendário publicado — avisa em vez de mostrar o ano errado
  if(!lista){
    const anos = Object.keys(EVENTOS_GRUPO_ANOS).sort();
    const ultimo = anos[anos.length-1];
    wrap.innerHTML = `
      <div class="evt-card">
        <div class="evt-toggle" style="cursor:default">
          <span class="evt-toggle-info">
            <span class="evt-toggle-icon">🏆</span>
            <span style="min-width:0;">
              <span class="evt-toggle-title">Grupo Cultural e Desportivo da Verallia Portugal</span>
              <span class="evt-toggle-sub">Atividades ${ano} · ainda por definir</span>
            </span>
          </span>
        </div>
        <div class="evt-vazio">O calendário de atividades de <b>${ano}</b> ainda não está na app.
        ${ultimo ? `As últimas que cá estão são as de <b>${ultimo}</b>.` : ''}
        Aparecem aqui assim que o Grupo publicar as datas.</div>
      </div>`;
    return;
  }

  // determinar passados e o próximo (primeiro com data >= hoje)
  let nextIdx = -1;
  const enriched = lista.map((ev, i) => {
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
            <span class="evt-toggle-sub">Atividades ${ano} · ${realizados} de ${totalComData} realizadas</span>
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
  const yearData = (SCHEDULES[curYear]||{})[curTeam]||[];
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  let m=0,t=0,n=0,f=0, mF=0,tF=0,nF=0, ferTotal=0,ferLivre=0, fdsLivres=0;
  yearData.forEach((month, mi) => month.forEach(row => {
    const dia=row[0], s=row[2];
    const dt = new Date(curYear, mi, dia);
    const passou = dt < hoje;
    if(s==='5'){ m++; if(passou)mF++; }
    else if(s==='13'){ t++; if(passou)tF++; }
    else if(s==='21'){ n++; if(passou)nF++; }
    else f++;
    const wd = dt.getDay();
    if((wd===0||wd===6) && (s==='F'||s==='X')) fdsLivres++;
    if(getFeriado(curYear, mi, dia)){ ferTotal++; if(s==='F'||s==='X') ferLivre++; }
  }));
  const trab=m+t+n, trabF=mF+tF+nF, horas=trab*7.5;
  const pct = trab>0 ? Math.round(trabF/trab*100) : 0;
  const totalDias = trab + f;
  const pctTrab = totalDias>0 ? Math.round(trab/totalDias*100) : 0;
  const pctDesc = 100 - pctTrab;
  const semFolga = Math.round(f/7);
  const caps = [
    `😎 ${f} folgas dão para <b>${semFolga} semanas</b> de descanso no ano!`,
    `🌙 Passas <b>${(n*7.5)|0}h</b> a trabalhar enquanto o país dorme.`,
    `🍻 Por cada ~3 dias de trabalho, tens <b>2 de folga</b>. Nada mau!`,
    `🏖️ ${pctDesc}% do ano é todo teu. Aproveita!`
  ];
  const capDivertida = caps[Math.floor(Math.random()*caps.length)];

  grid.innerHTML = `
    <div class="panel-title">📊 Os teus turnos · ${curYear}</div>
    <div class="stats-b">
      <div class="stat-ic"><span class="ic">🐓</span><div><div class="n" style="color:#378ADD">${m}</div><div class="l">Manhãs</div></div></div>
      <div class="stat-ic"><span class="ic">☀️</span><div><div class="n" style="color:#1D9E75">${t}</div><div class="l">Tardes</div></div></div>
      <div class="stat-ic"><span class="ic">🌙</span><div><div class="n" style="color:#7F77DD">${n}</div><div class="l">Noites</div></div></div>
      <div class="stat-ic"><span class="ic">💼</span><div><div class="n">${trab}</div><div class="l">Trabalhados</div></div></div>
    </div>
    <div class="panel-title">📈 O teu ano até agora</div>
    <div class="prog-card">
      <div class="prog-top"><b>${trabF} <span class="prog-of">de ${trab} turnos</span></b><span class="prog-pct">${pct}%</span></div>
      <div class="pbar"><div class="pfill" style="width:${pct}%"></div></div>
      <div class="psub"><span>Manhãs <b>${mF}/${m}</b></span><span>Tardes <b>${tF}/${t}</b></span><span>Noites <b>${nF}/${n}</b></span></div>
    </div>
    <div class="panel-title">🌴 Tempo &amp; descanso</div>
    <div class="stats-b">
      <div class="stat-ic"><span class="ic">🌿</span><div><div class="n" style="color:#86efac">${f}</div><div class="l">Folgas no ano</div></div></div>
      <div class="stat-ic"><span class="ic">⏱️</span><div><div class="n" style="color:#e0a93f">${horas%1===0?horas:horas.toFixed(0)}h</div><div class="l">Horas no ano</div></div></div>
      <div class="stat-ic"><span class="ic">🎉</span><div><div class="n" style="color:#EF9F27">${ferTotal}</div><div class="l">Feriados <span style="color:#86efac">(${ferLivre} livres)</span></div></div></div>
      <div class="stat-ic"><span class="ic">🏖️</span><div><div class="n" style="color:#7fc4ff">${fdsLivres}</div><div class="l">FDS livres</div></div></div>
    </div>
    <div class="panel-title">⚖️ Trabalho vs Descanso</div>
    <div class="prog-card">
      <div class="wd-bar">
        <div class="wd-work" style="width:${pctTrab}%">${pctTrab}%</div>
        <div class="wd-rest" style="width:${pctDesc}%">${pctDesc}%</div>
      </div>
      <div class="wd-legend"><span>💼 Trabalho</span><span>🌿 Descanso</span></div>
      <div class="wd-cap">${capDivertida}</div>
    </div>`;
}

