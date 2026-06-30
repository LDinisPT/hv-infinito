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
  LINES.forEach(l => state[l] = {modelo:'',paletes:'',garrafas:'',veloc:'',minutos:'',timeMode:'auto'});

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
  function tintRend(h,a){h=h.replace('#','');const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return 'rgba('+r+','+g+','+b+','+a+')';}
  function txtOnRend(h){h=h.replace('#','');const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return (0.299*r+0.587*g+0.114*b)>140?'#1a1205':'#fff';}
  function modelLabel(l){
    const code=state[l].modelo;
    if(!code) return '<span class="rend-model-empty">➕ Escolher modelo</span>';
    const b=(window.BottlesDB && window.BottlesDB.getByCode(code))||null;
    const nome = b ? (b.codigo+' · '+b.modelo) : code;
    return '<span class="rend-model-on">📦 '+nome+'</span>';
  }
  function buildCard(l){
    const s=state[l]; const div=document.createElement('div');
    div.className='rend-card'; div.id='rend-card-'+l;
    const color=COLORS[l]; const pct=calcPct(l);
    div.style.background=tintRend(color,0.11);
    div.style.borderColor=tintRend(color,0.35);
    const pctText=pct!==null?pct+'%':'—'; const pc=pctColor(pct);
    div.innerHTML=
      '<div class="rend-card-head">'+
        '<span class="rend-line-name" style="background:'+color+'">Linha '+l+'</span>'+
        '<button class="rend-reset-line" onclick="rendResetLinha(\''+l+'\')">&#8635;</button>'+
        '<span class="rend-line-pct '+(pct===null?'rend-pct-none':'')+'" style="color:'+pc+'">'+pctText+'</span>'+
      '</div>'+
      '<button class="rend-model-sel" onclick="rendOpenPicker(\''+l+'\')">'+
        modelLabel(l)+'<span class="rend-model-arrow">▾</span></button>'+
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
            '<span class="'+(s.timeMode==='auto'?'rtog-on':'')+'"'+(s.timeMode==='auto'?' style="background:'+color+';color:'+txtOnRend(color)+'"':'')+' onclick="rendSetMode(\''+l+'\',\'auto\')">Auto</span>'+
            '<span class="'+(s.timeMode==='manual'?'rtog-on':'')+'"'+(s.timeMode==='manual'?' style="background:'+color+';color:'+txtOnRend(color)+'"':'')+' onclick="rendSetMode(\''+l+'\',\'manual\')">Man</span>'+
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
  function limpar(l){ state[l]={modelo:'',paletes:'',garrafas:'',veloc:'',minutos:'',timeMode:'auto'}; }
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

  // ============================================================
  // CATÁLOGO DE MODELOS (Firestore via window.BottlesDB)
  // ============================================================
  let pickerLine=null;   // linha a que o picker se aplica
  let editingId=null;    // id do modelo a editar (null = novo)

  // 🔒 Proteção por PIN para adicionar/editar/apagar modelos.
  // Consultar e escolher modelos NÃO precisa de PIN. Altera o PIN aqui:
  const EDIT_PIN='2468';
  let editUnlocked=false; // desbloqueado nesta sessão (volta a pedir ao reabrir a app)
  let pinPending=null;    // ação a executar depois do PIN correto

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function dbAll(){ return (window.BottlesDB && window.BottlesDB.getAll()) || []; }
  function dbReady(){ return !!(window.BottlesDB && window.BottlesDB.isReady()); }
  function show(id){ const el=document.getElementById(id); if(el)el.classList.add('open'); }
  function hide(id){ const el=document.getElementById(id); if(el)el.classList.remove('open'); }

  function buildModals(){
    if(document.getElementById('bdb-picker'))return;
    const html=
    '<div class="bdb-overlay" id="bdb-picker">'+
      '<div class="bdb-modal">'+
        '<div class="bdb-head"><div class="bdb-title">Escolher modelo</div>'+
          '<button class="bdb-x" onclick="rendClosePicker()">✕</button></div>'+
        '<input class="bdb-search" id="bdb-picker-search" placeholder="🔍 Código ou modelo…" oninput="rendRenderPicker(this.value)">'+
        '<div class="bdb-list" id="bdb-picker-list"></div>'+
        '<button class="bdb-foot-btn" onclick="rendPickModel(\'\')">Sem modelo (limpar)</button>'+
      '</div>'+
    '</div>'+
    '<div class="bdb-overlay" id="bdb-manager">'+
      '<div class="bdb-modal">'+
        '<div class="bdb-head"><div class="bdb-title">📦 Modelos de garrafa</div>'+
          '<button class="bdb-x" onclick="rendCloseManager()">✕</button></div>'+
        '<input class="bdb-search" id="bdb-mgr-search" placeholder="🔍 Código ou modelo…" oninput="rendRenderManager(this.value)">'+
        '<div class="bdb-list" id="bdb-mgr-list"></div>'+
        '<button class="bdb-foot-btn bdb-add" onclick="rendOpenForm(null)">➕ Adicionar modelo</button>'+
      '</div>'+
    '</div>'+
    '<div class="bdb-overlay" id="bdb-pin">'+
      '<div class="bdb-modal bdb-modal-form">'+
        '<div class="bdb-head"><div class="bdb-title">🔒 Código de edição</div>'+
          '<button class="bdb-x" onclick="rendClosePin()">✕</button></div>'+
        '<div class="bdb-pin-sub">Introduz o PIN para adicionar, editar ou apagar modelos.</div>'+
        '<input class="bdb-input bdb-pin-in" id="bdb-pin-input" type="password" inputmode="numeric" '+
          'placeholder="PIN" autocomplete="off" onkeydown="if(event.key===\'Enter\')rendPinOk()">'+
        '<div class="bdb-form-msg" id="bdb-pin-msg"></div>'+
        '<div class="bdb-form-btns"><button class="bdb-save" onclick="rendPinOk()">🔓 Desbloquear</button></div>'+
      '</div>'+
    '</div>'+
    '<div class="bdb-overlay" id="bdb-form">'+
      '<div class="bdb-modal bdb-modal-form">'+
        '<div class="bdb-head"><div class="bdb-title" id="bdb-form-title">Novo modelo</div>'+
          '<button class="bdb-x" onclick="rendCloseForm()">✕</button></div>'+
        '<label class="bdb-lbl">Código</label>'+
        '<input class="bdb-input" id="bdb-f-codigo" placeholder="ex: 5633-W1" autocomplete="off" '+
          'oninput="rendFmtCodigo(this,event)">'+
        '<label class="bdb-lbl">Modelo / descrição</label>'+
        '<input class="bdb-input" id="bdb-f-modelo" placeholder="ex: Bord. 75 BVS" autocomplete="off">'+
        '<label class="bdb-lbl">Velocidade (garr./min)</label>'+
        '<input class="bdb-input" id="bdb-f-veloc" type="number" inputmode="numeric" min="0" placeholder="ex: 320">'+
        '<label class="bdb-lbl">Garrafas por palete</label>'+
        '<input class="bdb-input" id="bdb-f-garr" type="number" inputmode="numeric" min="0" placeholder="ex: 1500">'+
        '<div class="bdb-form-msg" id="bdb-form-msg"></div>'+
        '<div class="bdb-form-btns">'+
          '<button class="bdb-del" id="bdb-f-del" onclick="rendDeleteCurrent()">🗑️ Apagar</button>'+
          '<button class="bdb-save" onclick="rendSaveForm()">💾 Guardar</button>'+
        '</div>'+
      '</div>'+
    '</div>';
    const wrap=document.createElement('div'); wrap.innerHTML=html;
    while(wrap.firstChild) document.body.appendChild(wrap.firstChild);
    // fechar ao tocar fora
    ['bdb-picker','bdb-manager','bdb-form','bdb-pin'].forEach(id=>{
      const ov=document.getElementById(id);
      ov.addEventListener('click',e=>{ if(e.target===ov) ov.classList.remove('open'); });
    });
  }

  function emptyMsg(){
    if(!dbReady()) return '<div class="bdb-empty">A ligar ao catálogo…<br><small>(precisa de internet na 1ª vez)</small></div>';
    return '<div class="bdb-empty">Ainda não há modelos.<br><small>Toca em "Adicionar modelo".</small></div>';
  }

  // ---- Picker (escolher modelo p/ uma linha) ----
  window.rendOpenPicker=function(l){
    pickerLine=l; buildModals();
    const s=document.getElementById('bdb-picker-search'); if(s)s.value='';
    rendRenderPicker('');
    show('bdb-picker');
  };
  window.rendClosePicker=function(){ hide('bdb-picker'); };
  window.rendRenderPicker=function(filter){
    const box=document.getElementById('bdb-picker-list'); if(!box)return;
    const f=(filter||'').toLowerCase().trim();
    let list=dbAll();
    if(f) list=list.filter(b=>(b.codigo+' '+b.modelo).toLowerCase().includes(f));
    if(!list.length){ box.innerHTML=emptyMsg(); return; }
    const sel=pickerLine?state[pickerLine].modelo:'';
    box.innerHTML=list.map(b=>
      '<button class="bdb-item'+(b.codigo===sel?' bdb-item-sel':'')+'" onclick="rendPickModel(\''+esc(b.codigo).replace(/'/g,"\\'")+'\')">'+
        '<div class="bdb-item-main"><span class="bdb-item-code">'+esc(b.codigo)+'</span>'+
          '<span class="bdb-item-name">'+esc(b.modelo)+'</span></div>'+
        '<div class="bdb-item-vals"><span>⚡ '+esc(b.velocidade)+'</span><span>📦 '+esc(b.garrafas)+'</span></div>'+
      '</button>'
    ).join('');
  };
  window.rendPickModel=function(code){
    const l=pickerLine; if(!l)return;
    if(!code){
      state[l].modelo=''; save(); refreshCard(l); updateSummary(); hide('bdb-picker'); return;
    }
    const b=window.BottlesDB && window.BottlesDB.getByCode(code);
    state[l].modelo=code;
    if(b){ state[l].veloc=String(b.velocidade); state[l].garrafas=String(b.garrafas); }
    save(); refreshCard(l); updateSummary(); hide('bdb-picker');
  };

  // ---- Manager (gerir catálogo) ----
  window.rendOpenManager=function(){
    buildModals();
    const s=document.getElementById('bdb-mgr-search'); if(s)s.value='';
    rendRenderManager('');
    show('bdb-manager');
  };
  window.rendCloseManager=function(){ hide('bdb-manager'); };
  window.rendRenderManager=function(filter){
    const box=document.getElementById('bdb-mgr-list'); if(!box)return;
    const f=(filter||'').toLowerCase().trim();
    let list=dbAll();
    if(f) list=list.filter(b=>(b.codigo+' '+b.modelo).toLowerCase().includes(f));
    if(!list.length){ box.innerHTML=emptyMsg(); return; }
    box.innerHTML=list.map(b=>
      '<button class="bdb-item" onclick="rendOpenForm(\''+esc(b.id).replace(/'/g,"\\'")+'\')">'+
        '<div class="bdb-item-main"><span class="bdb-item-code">'+esc(b.codigo)+'</span>'+
          '<span class="bdb-item-name">'+esc(b.modelo)+'</span></div>'+
        '<div class="bdb-item-vals"><span>⚡ '+esc(b.velocidade)+'</span><span>📦 '+esc(b.garrafas)+'</span>'+
          '<span class="bdb-item-edit">✏️</span></div>'+
      '</button>'
    ).join('');
  };

  // ---- PIN (protege adicionar/editar/apagar) ----
  function ensureUnlocked(cb){
    if(editUnlocked){ cb(); return; }
    buildModals();
    pinPending=cb;
    const inp=document.getElementById('bdb-pin-input'); if(inp)inp.value='';
    const msg=document.getElementById('bdb-pin-msg'); if(msg)msg.textContent='';
    show('bdb-pin');
    setTimeout(()=>{ const i=document.getElementById('bdb-pin-input'); if(i)i.focus(); },120);
  }
  window.rendClosePin=function(){ hide('bdb-pin'); pinPending=null; };
  window.rendPinOk=function(){
    const inp=document.getElementById('bdb-pin-input');
    const v=(inp?inp.value:'').trim();
    if(v===EDIT_PIN){
      editUnlocked=true; hide('bdb-pin');
      const cb=pinPending; pinPending=null; if(cb)cb();
    }else{
      const msg=document.getElementById('bdb-pin-msg'); if(msg)msg.textContent='⚠️ PIN errado.';
      if(inp){ inp.value=''; inp.focus(); }
    }
  };

  // ---- Formulário (criar/editar/apagar) ----
  window.rendOpenForm=function(id){
    ensureUnlocked(()=>_openForm(id));
  };
  function _openForm(id){
    buildModals();
    editingId=id||null;
    const b=id?(window.BottlesDB && window.BottlesDB.getById(id)):null;
    document.getElementById('bdb-form-title').textContent=id?'Editar modelo':'Novo modelo';
    document.getElementById('bdb-f-codigo').value=b?b.codigo:'';
    document.getElementById('bdb-f-modelo').value=b?b.modelo:'';
    document.getElementById('bdb-f-veloc').value=b?b.velocidade:'';
    document.getElementById('bdb-f-garr').value=b?b.garrafas:'';
    document.getElementById('bdb-form-msg').textContent='';
    document.getElementById('bdb-f-del').style.display=id?'block':'none';
    show('bdb-form');
  };
  window.rendCloseForm=function(){ hide('bdb-form'); };
  // Auto-formata o código: maiúsculas + "-" depois dos 4 primeiros caracteres
  window.rendFmtCodigo=function(el,ev){
    const deleting = ev && ev.inputType && ev.inputType.indexOf('delete')===0;
    const clean = el.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
    let out;
    if(clean.length>4) out = clean.slice(0,4)+'-'+clean.slice(4);
    else if(clean.length===4 && !deleting) out = clean+'-';
    else out = clean;
    el.value = out;
  };
  window.rendSaveForm=async function(){
    const msg=document.getElementById('bdb-form-msg');
    const codigo=document.getElementById('bdb-f-codigo').value.trim().replace(/-+$/,'');
    const modelo=document.getElementById('bdb-f-modelo').value.trim();
    const veloc=document.getElementById('bdb-f-veloc').value;
    const garr=document.getElementById('bdb-f-garr').value;
    if(!codigo){ msg.textContent='⚠️ Falta o código.'; return; }
    if(!veloc||!garr){ msg.textContent='⚠️ Falta velocidade ou garrafas.'; return; }
    if(!window.BottlesDB){ msg.textContent='⚠️ Sem ligação ao catálogo.'; return; }
    const data={codigo,modelo,velocidade:veloc,garrafas:garr,editadoPor:(safeGet('userName')||'—')};
    msg.textContent='A guardar…';
    try{
      if(editingId) await window.BottlesDB.update(editingId,data);
      else await window.BottlesDB.add(data);
      hide('bdb-form');
    }catch(e){ msg.textContent='⚠️ Erro a guardar: '+(e.message||e); }
  };
  window.rendDeleteCurrent=async function(){
    if(!editingId||!window.BottlesDB)return;
    if(!confirm('Apagar este modelo do catálogo de todos?'))return;
    try{ await window.BottlesDB.remove(editingId); hide('bdb-form'); }
    catch(e){ alert('Erro a apagar: '+(e.message||e)); }
  };

  // Quando o catálogo muda (qualquer colega editou) — atualiza o que está aberto
  function onBottlesChanged(){
    if(document.getElementById('bdb-picker') && document.getElementById('bdb-picker').classList.contains('open'))
      rendRenderPicker(document.getElementById('bdb-picker-search').value);
    if(document.getElementById('bdb-manager') && document.getElementById('bdb-manager').classList.contains('open'))
      rendRenderManager(document.getElementById('bdb-mgr-search').value);
    // atualiza os rótulos de modelo nos cartões
    LINES.forEach(l=>{
      const card=document.getElementById('rend-card-'+l);
      if(card){ const ms=card.querySelector('.rend-model-sel'); if(ms) ms.innerHTML=modelLabel(l)+'<span class="rend-model-arrow">▾</span>'; }
    });
  }
  window.addEventListener('bottles-changed', onBottlesChanged);

  // ---- Init (corre só uma vez, quando o painel existe) ----
  function initRendimento(){
    if(started)return;
    const wrap=document.getElementById('rend-wrap'); if(!wrap)return;
    started=true;
    load();
    buildModals();
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
