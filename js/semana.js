// ============================================================
// SEMANA — escala de Segunda a Domingo com todos os turnos
// Ciclos agrupados na vertical (dias seguidos da mesma equipa
// formam um bloco) com o total do ciclo e setas ▲▼ quando o
// ciclo entra ou sai da semana visível.
// © 2026 Luís Dinis — Verallia Portugal
// ============================================================
(function(){
  let offset = 0;                       // 0 = semana atual, -1 anterior, +1 seguinte

  const TURNOS = ['M','T','N'];
  const COD    = { M:'5', T:'13', N:'21' };
  const INFO   = {
    M:{ lbl:'🐓 05-13', cor:'#FFE600', bg:'rgba(255,230,0,0.14)' },
    T:{ lbl:'☀️ 13-21', cor:'#00BFFF', bg:'rgba(0,191,255,0.14)' },
    N:{ lbl:'🌙 21-05', cor:'#00FFB4', bg:'rgba(0,255,180,0.14)' }
  };
  const WD  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const MES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const EQUIPAS = ['A','B','C','D','E'];
  const MAX_WALK = 40;                  // trava de segurança ao medir ciclos

  // ---- Datas ----
  function segundaDaSemana(off){
    const ref = (typeof getShiftRefDate === 'function') ? getShiftRefDate() : new Date();
    ref.setHours(0,0,0,0);
    const seg = new Date(ref);
    seg.setDate(seg.getDate() - ((ref.getDay()+6)%7) + off*7);
    return seg;
  }
  function maisDias(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }

  // Número da semana ISO (a numeração usada nas fábricas)
  function semanaISO(d){
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() - ((t.getUTCDay()+6)%7) + 3);
    const primeira = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
    primeira.setUTCDate(primeira.getUTCDate() - ((primeira.getUTCDay()+6)%7) + 3);
    return 1 + Math.round((t - primeira) / (7*86400000));
  }
  function semanasNoAno(d){
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() - ((t.getUTCDay()+6)%7) + 3);  // quinta da semana = ano ISO
    return semanaISO(new Date(t.getUTCFullYear(), 11, 28));
  }
  function intervalo(seg, dom){
    const d1=seg.getDate(), d2=dom.getDate();
    const m1=seg.getMonth(), m2=dom.getMonth();
    const y1=seg.getFullYear(), y2=dom.getFullYear();
    if(y1 !== y2)  return `${d1} ${MES[m1]} ${y1} – ${d2} ${MES[m2]} ${y2}`;
    if(m1 !== m2)  return `${d1} ${MES[m1]} – ${d2} ${MES[m2]} ${y1}`;
    return `${d1} – ${d2} ${MONTH_NAMES_PT[m1]} ${y1}`;
  }

  // ---- Escala ----
  function equipaDoTurno(tk, d){
    for(const t of EQUIPAS)
      if(getShift(t, d.getFullYear(), d.getMonth(), d.getDate()) === COD[tk]) return t;
    return null;
  }

  // Blocos de dias seguidos da mesma equipa, com o ciclo completo
  function blocosDoTurno(tk, seg){
    const blocos = [];
    let i = 0;
    while(i < 7){
      const eq = equipaDoTurno(tk, maisDias(seg,i));
      let n = 1;
      while(i+n < 7 && equipaDoTurno(tk, maisDias(seg,i+n)) === eq) n++;

      // mede o ciclo real para fora da semana (só se a equipa é conhecida)
      let antes = 0, depois = 0;
      if(eq){
        let k = i-1;
        while(antes < MAX_WALK && equipaDoTurno(tk, maisDias(seg,k)) === eq){ antes++; k--; }
        k = i+n;
        while(depois < MAX_WALK && equipaDoTurno(tk, maisDias(seg,k)) === eq){ depois++; k++; }
      }
      blocos.push({
        eq, linha:i+1, dias:n,
        ciclo: antes + n + depois,
        vemDeTras: antes > 0,
        continua: depois > 0
      });
      i += n;
    }
    return blocos;
  }

  // Equipas que passam a semana toda fora de serviço (separa quinzena de folga)
  function foraDeServico(seg){
    const folga = [], quinzena = [];
    const qz = {};
    if(typeof getQuinzenaDays === 'function'){
      for(const t of EQUIPAS){
        try { qz[t] = getQuinzenaDays(t, seg.getFullYear()); } catch(e){ qz[t] = null; }
      }
    }
    for(const t of EQUIPAS){
      let todaSemana = true, emQuinzena = false;
      for(let i=0;i<7;i++){
        const d = maisDias(seg,i);
        const s = getShift(t, d.getFullYear(), d.getMonth(), d.getDate());
        if(s !== 'F' && s !== 'X') { todaSemana = false; break; }
        if(qz[t] && qz[t].has(d.getMonth()+'-'+d.getDate())) emQuinzena = true;
      }
      if(todaSemana) (emQuinzena ? quinzena : folga).push(t);
    }
    return { folga, quinzena };
  }

  function feriadosDaSemana(seg){
    const out = [];
    if(typeof getFeriado !== 'function') return out;
    for(let i=0;i<7;i++){
      const d = maisDias(seg,i);
      const nome = getFeriado(d.getFullYear(), d.getMonth(), d.getDate());
      if(nome) out.push({ linha:i+1, dia:d.getDate(), wd:WD[d.getDay()], nome });
    }
    return out;
  }

  // ---- Render ----
  function blocoHTML(tk, b){
    const info = INFO[tk];
    const col  = TURNOS.indexOf(tk) + 3;          // 1=seta, 2=dia, 3..5=turnos
    const meu  = (b.eq === curTeam) ? ' sem-eu' : '';
    let dentro = '';
    // picotado: um traço por cada fronteira de dia dentro do bloco
    for(let k=1;k<b.dias;k++)
      dentro += `<span class="sem-sep" style="top:${(k/b.dias*100).toFixed(2)}%"></span>`;
    if(b.vemDeTras) dentro += `<span class="sem-ar sem-ar-up" style="color:${info.cor}">▲</span>`;
    dentro += `<span class="sem-l" style="color:${info.cor}">${b.eq || '—'}</span>`;
    if(b.dias >= 2) dentro += `<span class="sem-n" style="color:${info.cor}">${b.ciclo} dias</span>`;
    if(b.continua) dentro += `<span class="sem-ar sem-ar-dn" style="color:${info.cor}">▼</span>`;
    return `<div class="sem-c${meu}" style="grid-column:${col};grid-row:${b.linha} / span ${b.dias};background:${info.bg}">${dentro}</div>`;
  }

  function renderSemana(){
    const box = document.getElementById('semana-wrap');
    if(box == null || typeof getShift !== 'function') return;

    const seg = segundaDaSemana(offset);
    const dom = maisDias(seg,6);
    const ref = (typeof getShiftRefDate === 'function') ? getShiftRefDate() : new Date();
    ref.setHours(0,0,0,0);

    // linha do dia de hoje (só quando estamos na semana atual)
    let linhaHoje = 0;
    for(let i=0;i<7;i++) if(maisDias(seg,i).getTime() === ref.getTime()) linhaHoje = i+1;

    const fer = feriadosDaSemana(seg);
    const fs  = foraDeServico(seg);

    let h = '';

    // -------- navegação --------
    h += `<div class="sem-nav">
        <button class="sem-nav-btn" onclick="semanaMudar(-1)" aria-label="Semana anterior">&#8249;</button>
        <div class="sem-nav-mid">
          <div class="sem-nav-num">Semana ${semanaISO(seg)} <span>de ${semanasNoAno(seg)}</span></div>
          <div class="sem-nav-dat">${intervalo(seg,dom)}</div>
        </div>
        <button class="sem-nav-btn" onclick="semanaMudar(1)" aria-label="Semana seguinte">&#8250;</button>
      </div>`;
    if(offset !== 0)
      h += `<button class="sem-btn-esta" onclick="semanaEsta()">📍 Esta semana</button>`;

    // -------- cabeçalho dos turnos --------
    h += `<div class="sem-head"><div></div><div></div>` +
      TURNOS.map(tk => `<div style="color:${INFO[tk].cor}">${INFO[tk].lbl}</div>`).join('') +
      `</div>`;

    // -------- grelha --------
    h += `<div class="sem-grid">`;
    fer.forEach(f => { h += `<div class="sem-fer-band" style="grid-row:${f.linha}"></div>`; });
    if(linhaHoje) h += `<div class="sem-seta" style="grid-row:${linhaHoje}">&#9654;</div>`;

    for(let i=0;i<7;i++){
      const d = maisDias(seg,i);
      const eFer  = fer.some(f => f.linha === i+1);
      const eHoje = (linhaHoje === i+1);
      h += `<div class="sem-d${eFer?' sem-d-fer':''}${eHoje?' sem-d-hoje':''}" style="grid-row:${i+1}">` +
             `${WD[d.getDay()]}<b>${d.getDate()}</b>${eFer?'<span class="sem-star">⭐</span>':''}</div>`;
    }
    TURNOS.forEach(tk => { blocosDoTurno(tk, seg).forEach(b => { h += blocoHTML(tk, b); }); });
    h += `</div>`;

    // -------- rodapé --------
    h += `<div class="sem-foot">`;
    if(fs.quinzena.length)
      h += `<div class="sem-line sem-quin">🌴 De Quinzena: ${fs.quinzena.length>1?'equipas':'equipa'} <b>${fs.quinzena.join(', ')}</b></div>`;
    if(fs.folga.length)
      h += `<div class="sem-line sem-folga">🌿 De folga toda a semana: ${fs.folga.length>1?'equipas':'equipa'} <b>${fs.folga.join(', ')}</b></div>`;
    fer.forEach(f => {
      h += `<div class="sem-line sem-fer">⭐ ${f.wd} ${f.dia} · ${f.nome}</div>`;
    });
    h += `<div class="sem-leg"><span class="sem-chip">${curTeam}</span> = a tua equipa` +
         ` &nbsp;·&nbsp; <span style="color:#cfcfe0">▲▼</span> ciclo continua fora da semana</div>`;
    h += `</div>`;

    box.innerHTML = h;
  }

  // ---- Ações (globais p/ onclick) ----
  window.semanaMudar = function(n){ offset += n; renderSemana(); };
  window.semanaEsta  = function(){ offset = 0; renderSemana(); };
  window.renderSemana = renderSemana;
})();
