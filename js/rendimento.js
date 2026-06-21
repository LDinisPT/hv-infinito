// ============================================================
// RENDIMENTO — rendimento de turno por linha (Forno 1 e Forno 2)
// © 2026 Luís Dinis — Verallia Portugal
// ============================================================
(function(){
  const FORNO1 = ['11A','11B','12A','12B','13A','13B'];
  const FORNO2 = ['21','22','23A','23B','24A','24B'];
  const LINES  = [...FORNO1, ...FORNO2];
  const TURNO_MIN = 480;

  const COLORS = {
    '11A':'#3b82f6','11B':'#3b82f6','12A':'#22c55e','12B':'#22c55e',
    '13A':'#f97316','13B':'#f97316','21':'#8b5cf6','22':'#14b8a6',
    '23A':'#ec4899','23B':'#ec4899','24A':'#eab308','24B':'#eab308'
  };

  const STORE_KEY = 'verallia_rendimento_turno';
  const state = {};
  LINES.forEach(l => state[l] = {paletes:'',garrafas:'',veloc:'',minutos:'',timeMode:'auto'});

  let bestLine=null, worstLine=null;
  let started=false;

  // ---- Armazenamento (usa safeSet/safeGet da app se existirem) ----
  function save(){
    const json = JSON.stringify(state);
    try{ if(typeof safeSet==='function'){ safeSet(STORE_KEY, json); return; } }catch(e){}
    try{ localStorage.setItem(STORE_KEY, json); }catch(e){}
  }
  function load(){
    let raw=null;
    try{ if(typeof safeGet==='function') raw = safeGet(STORE_KEY); }catch(e){}
    if(!raw){ try{ raw = localStorage.getItem(STORE_KEY); }catch(e){} }
    if(raw){
      try{ const d=JSON.parse(raw); LINES.forEach(l=>{ if(d[l])state[l]={...state[l],...d[l]}; }); }catch(e){}
    }
  }

  // ---- Tempo / turno ----
  function turnoInicio(){
    const h=new Date().getHours(); const t=[5,13,21]; let ini=null;
    for(let i=t.length-1;i>=0;i--){ if(h>=t[i]){ini=t[i];break;} }
    return ini===null?21:ini;
  }
  function getAutoMinutes(){
    const now=new Date(); const h=now.getHours(), m=now.getMinutes();
    let mins=(h-turnoInicio())*60+m; if(mins<0)mins+=1440;
    return Math.max(1,Math.min(mins,TURNO_MIN));
  }
  function tempoMin(l){
    const s=state[l];
    return s.timeMode==='auto' ? getAutoMinutes() : parseFloat(s.minutos);
  }
  function pctTurno(l){
    const t=tempoMin(l);
    if(!t||t<=0)return null;
    return Math.round(Math.min(t,TURNO_MIN)/TURNO_MIN*100);
  }

  // ---- Cálculo ----
  function calcPct(l){
    const s=state[l];
    const p=parseFloat(s.paletes), g=parseFloat(s.garrafas), v=parseFloat(s.veloc);
    const t=tempoMin(l);
    if(!p||!g||!v||!t||t<=0||v<=0)return null;
    return Math.round((p*g)/t/v*1000)/10;
  }
  function pctColor(p){ if(p===null)return'#7a7a92'; if(p>=85)return'#22c55e'; if(p>=70)return'#f59e0b'; return'#ef4444'; }
  function mediaForno(list){
    const vals=list.map(l=>calcPct(l)).filter(v=>v!==null);
    if(!vals.length)return null;
    return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10;
  }

  function updateSummary(){
    const f1=mediaForno(FORNO1), f2=mediaForno(FORNO2), g=mediaForno(LINES);
    setVal('rend-avg-f1', f1); setVal('rend-avg-f2', f2); setVal('rend-avg-geral', g);
    const m1=document.getElementById('rend-forno-avg-1'), m2=document.getElementById('rend-forno-avg-2');
    if(m1){ m1.textContent=f1!==null?'Média '+f1+'%':'Média —'; m1.style.color=pctColor(f1); }
    if(m2){ m2.textContent=f2!==null?'Média '+f2+'%':'Média —'; m2.style.color=pctColor(f2); }

    const withVals=LINES.map(l=>({l,p:calcPct(l)})).filter(o=>o.p!==null);
    const bv=document.getElementById('rend-best-val'), wv=document.getElementById('rend-worst-val');
    if(!withVals.length){
      bestLine=worstLine=null;
      if(bv){bv.textContent='—';bv.style.color='#7a7a92';}
      if(wv){wv.textContent='—';wv.style.color='#7a7a92';}
      return;
    }
    let best=withVals[0], worst=withVals[0];
    withVals.forEach(o=>{ if(o.p>best.p)best=o; if(o.p<worst.p)worst=o; });
    bestLine=best.l; worstLine=worst.l;
    if(bv){ bv.textContent=best.l+' · '+best.p+'%'; bv.style.color=pctColor(best.p); }
    if(wv){ wv.textContent=worst.l+' · '+worst.p+'%'; wv.style.color=pctColor(worst.p); }
  }
  function setVal(id,p){
    const el=document.getElementById(id); if(!el)return;
    el.textContent=p!==null?p+'%':'—'; el.style.color=pctColor(p);
  }

  function tempoLabel(l){
    const s=state[l];
    if(s.timeMode==='auto'){
      const m=getAutoMinutes(); const pt=pctTurno(l);
      return 'Tempo ('+m+'m · '+(pt!==null?pt+'%':'—')+')';
    }
    const pt=pctTurno(l);
    return 'Tempo'+(pt!==null?' ('+pt+'%)':' (min)');
  }

  // ---- Render ----
  function buildCard(l){
    const s=state[l]; const div=document.createElement('div');
    div.className='rend-card'; div.id='rend-card-'+l;
    const color=COLORS[l]; const pct=calcPct(l);
    const pctText=pct!==null?pct+'%':'—'; const pc=pctColor(pct);
    div.innerHTML=
      '<div class="rend-card-head">'+
        '<span class="rend-line-name" style="background:'+color+'">Linha '+l+'</span>'+
        '<button class="rend-reset-line" onclick="rendResetLinha(\''+l+'\')">&#8635;</button>'+
        '<span class="rend-line-pct '+(pct===null?'rend-pct-none':'')+'" style="color:'+pc+'">'+pctText+'</span>'+
      '</div>'+
      '<div class="rend-card-form">'+
        '<div class="rend-field rf-pal"><label>Paletes</label>'+
          '<input type="number" inputmode="numeric" min="0" placeholder="0" value="'+s.paletes+'" oninput="rendSet(\''+l+'\',\'paletes\',this.value)"></div>'+
        '<div class="rend-field rf-garr"><label>Garr./pal.</label>'+
          '<input type="number" inputmode="numeric" min="0" placeholder="0" value="'+s.garrafas+'" oninput="rendSet(\''+l+'\',\'garrafas\',this.value)"></div>'+
        '<div class="rend-field rf-vel"><label>Veloc.</label>'+
          '<input type="number" inputmode="numeric" min="0" placeholder="0" value="'+s.veloc+'" oninput="rendSet(\''+l+'\',\'veloc\',this.value)"></div>'+
        '<div class="rend-field rf-tempo"><label>'+tempoLabel(l)+'</label>'+
          (s.timeMode==='manual'
            ? '<input type="number" inputmode="numeric" min="1" max="480" placeholder="min" value="'+s.minutos+'" oninput="rendSet(\''+l+'\',\'minutos\',this.value)">'
            : '')+
          '<div class="rend-tog">'+
            '<span class="'+(s.timeMode==='auto'?'rtog-on':'')+'" onclick="rendSetMode(\''+l+'\',\'auto\')">Auto</span>'+
            '<span class="'+(s.timeMode==='manual'?'rtog-on':'')+'" onclick="rendSetMode(\''+l+'\',\'manual\')">Man</span>'+
          '</div>'+
        '</div>'+
      '</div>';
    return div;
  }
  function refreshCard(l){
    const old=document.getElementById('rend-card-'+l);
    if(old)old.parentNode.replaceChild(buildCard(l), old);
  }
  function renderLineLight(l){
    const pct=calcPct(l); const pctText=pct!==null?pct+'%':'—'; const pc=pctColor(pct);
    const card=document.getElementById('rend-card-'+l); if(!card)return;
    const hp=card.querySelector('.rend-line-pct');
    hp.textContent=pctText; hp.style.color=pc;
    hp.className='rend-line-pct'+(pct===null?' rend-pct-none':'');
    const tlbl=card.querySelector('.rf-tempo label');
    if(tlbl)tlbl.textContent=tempoLabel(l);
    updateSummary();
  }

  function fornoSection(n,list){
    const sec=document.createElement('div');
    const head=document.createElement('div');
    head.className='rend-forno-head';
    head.innerHTML='<span class="rend-forno-title">Forno '+n+'</span>'+
      '<span class="rend-forno-avg" id="rend-forno-avg-'+n+'">Média —</span>'+
      '<button class="rend-btn-forno" onclick="rendResetForno('+n+')">&#8635; Repor forno</button>';
    sec.appendChild(head);
    const lines=document.createElement('div'); lines.className='rend-lines';
    list.forEach(l=>lines.appendChild(buildCard(l)));
    sec.appendChild(lines);
    return sec;
  }

  function renderAll(){
    const wrap=document.getElementById('rend-wrap');
    if(!wrap)return;
    wrap.innerHTML='';
    wrap.appendChild(fornoSection(1,FORNO1));
    wrap.appendChild(fornoSection(2,FORNO2));
    updateSummary();
    const ti=document.getElementById('rend-turno-info');
    if(ti)ti.textContent=String(turnoInicio()).padStart(2,'0')+':00';
  }

  // ---- Ações (globais p/ onclick) ----
  window.rendSet=function(l,k,v){ state[l][k]=v; save(); renderLineLight(l); };
  window.rendSetMode=function(l,m){
    state[l].timeMode=m;
    if(m==='manual' && !state[l].minutos) state[l].minutos='480';
    save(); refreshCard(l); updateSummary();
  };
  function limpar(l){ state[l]={paletes:'',garrafas:'',veloc:'',minutos:'',timeMode:'auto'}; }
  window.rendResetLinha=function(l){
    if(!confirm('Limpar a Linha '+l+'?'))return;
    limpar(l); save(); refreshCard(l); updateSummary();
  };
  window.rendResetForno=function(n){
    const list=n===1?FORNO1:FORNO2;
    if(!confirm('Limpar todas as linhas do Forno '+n+'?'))return;
    list.forEach(limpar); save(); renderAll();
  };
  window.rendResetTudo=function(){
    if(!confirm('Apagar TODOS os valores e começar um turno novo?'))return;
    LINES.forEach(limpar); save(); renderAll();
  };
  window.rendIrPara=function(qual){
    const l=qual==='best'?bestLine:worstLine; if(!l)return;
    const card=document.getElementById('rend-card-'+l); if(!card)return;
    card.scrollIntoView({behavior:'smooth',block:'center'});
    card.classList.remove('rend-flash'); void card.offsetWidth; card.classList.add('rend-flash');
  };

  // ---- Init (corre só uma vez, quando o painel existe) ----
  function initRendimento(){
    if(started)return;
    const wrap=document.getElementById('rend-wrap'); if(!wrap)return;
    started=true;
    load();
    renderAll();
    setInterval(()=>{
      LINES.forEach(l=>{ if(state[l].timeMode==='auto')renderLineLight(l); });
      const ti=document.getElementById('rend-turno-info');
      if(ti)ti.textContent=String(turnoInicio()).padStart(2,'0')+':00';
    },60000);
  }
  window.initRendimento=initRendimento;

  if(document.readyState!=='loading') initRendimento();
  else document.addEventListener('DOMContentLoaded', initRendimento);
})();
