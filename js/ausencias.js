// ============================================================
// AUSÊNCIAS — importação de ficheiro .ics do portal (férias, etc.)
// Camada pessoal por cima da escala, guardada localmente.
// ============================================================

// Tipos e aparência (cor + emoji + nome curto)
const AUSENCIA_INFO = {
  ferias:      { cor:'#A855F7', txt:'#ffffff', emoji:'🌴', nome:'Férias' },
  formacao:    { cor:'#2563EB', txt:'#ffffff', emoji:'📚', nome:'Formação' },
  saude:       { cor:'#E24B4A', txt:'#ffffff', emoji:'🏥', nome:'Saúde' },
  aniversario: { cor:'#D946EF', txt:'#ffffff', emoji:'🎂', nome:'Aniversário' },
  outro:       { cor:'#9aa0b0', txt:'#1a1a1a', emoji:'📌', nome:'Ausência' },
};

function tipoAusencia(summary){
  const s = (summary||'').toLowerCase();
  if(s.includes('féria') || s.includes('feria')) return 'ferias';
  if(s.includes('formaç') || s.includes('formac')) return 'formacao';
  if(s.includes('baixa') || s.includes('doenç') || s.includes('doenc') || s.includes('médic') || s.includes('medic')) return 'saude';
  if(s.includes('aniversár') || s.includes('aniversar')) return 'aniversario';
  return 'outro';
}

// Lê o texto de um .ics e devolve [{date:'YYYY-MM-DD', tipo, label}]
function parseICS(text){
  const eventos = [];
  const blocks = text.split('BEGIN:VEVENT');
  for(let i=1; i<blocks.length; i++){
    const blk = blocks[i];
    const sumM = blk.match(/SUMMARY:(.*)/);
    const dtM  = blk.match(/DTSTART[^:]*:(\d{8})/);
    if(sumM && dtM){
      let summary = sumM[1].trim();
      // remove o nome da pessoa antes do "-" (ex: "Luís Dinis - Dia de férias")
      const dash = summary.indexOf(' - ');
      const label = dash >= 0 ? summary.slice(dash+3).trim() : summary;
      const d = dtM[1];
      const iso = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
      eventos.push({ date: iso, tipo: tipoAusencia(summary), label });
    }
  }
  return eventos;
}

// Guardar / carregar
function loadAusencias(){
  try { return JSON.parse(safeGet('ausencias') || '{}'); } catch(e){ return {}; }
}
function saveAusencias(obj){ safeSet('ausencias', JSON.stringify(obj)); }

// Importa um texto .ics (substitui o existente)
function importarICS(text){
  const eventos = parseICS(text);
  const obj = {};
  eventos.forEach(e => { obj[e.date] = { tipo:e.tipo, label:e.label }; });
  saveAusencias(obj);
  return eventos.length;
}

function limparAusencias(){ saveAusencias({}); }

// Consulta: devolve {tipo, label} ou null para um dia
function getAusencia(y, m, d){
  const obj = loadAusencias();
  const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  return obj[iso] || null;
}

// ----- UI no separador Mais -----
function renderAusencias(){
  const box = document.getElementById('ausencias-box');
  if(!box) return;
  const obj = loadAusencias();
  const datas = Object.keys(obj).sort();
  const MES = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  // Contador no cabeçalho do dropdown
  const countEl = document.getElementById('aus-acc-count');
  if(countEl) countEl.textContent = datas.length ? `· ${datas.length} dias` : '';

  if(datas.length === 0){
    box.innerHTML = `<div class="aus-empty">Ainda não importaste nada.<br>Exporta o ficheiro <b>.ics</b> do portal e carrega em <b>Importar</b>.</div>`;
    return;
  }

  // Agrupar consecutivas do mesmo tipo em blocos
  const blocos = [];
  let ini=null, fim=null, tipo=null;
  const toDate = s => { const [y,mo,d]=s.split('-').map(Number); return new Date(y,mo-1,d); };
  datas.forEach(iso => {
    const t = obj[iso].tipo;
    if(ini && t===tipo && (toDate(iso)-toDate(fim))===86400000){ fim=iso; }
    else { if(ini) blocos.push({ini,fim,tipo}); ini=fim=iso; tipo=t; }
  });
  if(ini) blocos.push({ini,fim,tipo});

  // Contagem por tipo
  const cont = {};
  datas.forEach(iso => { const t=obj[iso].tipo; cont[t]=(cont[t]||0)+1; });
  const resumo = Object.entries(cont).map(([t,n]) => {
    const inf = AUSENCIA_INFO[t]||AUSENCIA_INFO.outro;
    return `<span class="aus-chip" style="background:${inf.cor}22;color:${inf.cor};border-color:${inf.cor}55">${inf.emoji} ${n} ${inf.nome}</span>`;
  }).join('');

  const linhas = blocos.map(b => {
    const inf = AUSENCIA_INFO[b.tipo]||AUSENCIA_INFO.outro;
    const di = toDate(b.ini), df = toDate(b.fim);
    const n = Math.round((df-di)/86400000)+1;
    const txt = b.ini===b.fim
      ? `${di.getDate()} ${MES[di.getMonth()+1]}`
      : `${di.getDate()} ${MES[di.getMonth()+1]} a ${df.getDate()} ${MES[df.getMonth()+1]}`;
    return `<div class="aus-row" style="background:${inf.cor}1a;border-color:${inf.cor}40">
        <div><div class="aus-dt">${inf.emoji} ${txt}</div><div class="aus-dur" style="color:${inf.cor}">${n} dia${n>1?'s':''} · ${inf.nome}</div></div>
      </div>`;
  }).join('');

  box.innerHTML = `<div class="aus-resumo">${resumo}</div>${linhas}
    <button class="aus-clear" onclick="if(confirm('Apagar as ausências importadas?')){limparAusencias();renderAusencias();if(typeof renderCalendar==='function')renderCalendar();}">🗑 Limpar tudo</button>`;
}

// Liga o input de ficheiro
function initAusenciasUI(){
  // Toggle do dropdown
  const head = document.getElementById('aus-acc-head');
  const acc = document.getElementById('aus-acc');
  if(head && acc) head.onclick = () => acc.classList.toggle('open');

  const inp = document.getElementById('ics-input');
  if(inp){
    inp.onchange = (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const msg = document.getElementById('ics-msg');
        const texto = ev.target.result || '';
        // Valida pelo CONTEÚDO (não pela extensão) — funciona com .ics e .ics.txt
        if(!texto.includes('BEGIN:VCALENDAR') && !texto.includes('BEGIN:VEVENT')){
          if(msg){ msg.textContent = '❌ Esse ficheiro não parece o calendário do portal. Exporta o Ausências do portal e tenta de novo.'; }
          inp.value = ''; return;
        }
        try {
          const n = importarICS(texto);
          renderAusencias();
          if(typeof renderCalendar === 'function') renderCalendar();
          if(msg){
            msg.textContent = n > 0 ? `✅ Importadas ${n} ausências!` : '⚠️ Não encontrei ausências nesse ficheiro.';
            setTimeout(()=>msg.textContent='', 3500);
          }
        } catch(err){
          if(msg){ msg.textContent = '❌ Não consegui ler o ficheiro. É o Ausências do portal?'; }
        }
        inp.value = '';
      };
      reader.readAsText(file);
    };
  }
  renderAusencias();
}
