// ============================================================
// NOVIDADES — avisos de funcionalidades novas (mostra 1x cada)
// Para uma nova novidade no futuro: junta um objeto ao array
// com uma "chave" única. Quem já viu as antigas só vê a nova.
// ============================================================
const NOVIDADES = [
  {
    chave: 'ferias-v29',
    ico: '🌴',
    titulo: 'Novidade: Férias!',
    texto: 'Agora podes importar as tuas <b>férias e ausências</b> do portal e vê-las no calendário, mesmo ao lado dos turnos.<br><br>Vai a <b>Mais → "Como usar"</b> e abre <b>"🌴 Importar as minhas férias"</b> para veres o passo-a-passo.',
    manualMatch: 'Importar as minhas férias'
  },
  {
    chave: 'modelos-v35',
    ico: '🍾',
    titulo: 'Novidade: Modelos de garrafa!',
    texto: 'No separador <b>Rendimento</b>, agora podes <b>escolher o modelo de garrafa</b> em cada linha — a velocidade e as garrafas/palete preenchem-se sozinhas! 🎉<br><br>O catálogo é <b>partilhado por todos os colegas</b>: qualquer um pode adicionar ou corrigir modelos e aparece logo a toda a gente.<br><br>Vê em <b>Mais → "Como usar"</b> → <b>"🍾 Modelos de garrafa"</b>.',
    manualMatch: 'Modelos de garrafa'
  },
  {
    chave: 'resumo-v44',
    ico: '📊',
    titulo: 'Novidade: Resumo do turno!',
    texto: 'No separador <b>Rendimento</b>, o novo botão <b>"📊 Resumo"</b> mostra-te <b>as 12 linhas de uma só vez</b>, com barras coloridas e as médias de cada forno — tudo num ecrã, sem rolar. 🎉<br><br>Aproveitámos para melhorar a escrita dos códigos (o <b>-</b> aparece sozinho) e a pesquisa de modelos.<br><br>Vê em <b>Mais → "Como usar"</b> → <b>"📊 Resumo do turno"</b>.',
    manualMatch: 'Resumo do turno'
  },
  {
    chave: 'semana-v46',
    ico: '📋',
    titulo: 'Novidade: separador Semana!',
    texto: 'Há um separador novo entre o <b>Hoje</b> e o <b>Mês</b>: a escala de <b>Segunda a Domingo</b> com <b>todos os turnos</b> — vês num relance que equipa faz a Manhã, a Tarde e a Noite em cada dia. 🎉<br><br>Os dias seguidos da mesma equipa aparecem <b>agrupados</b>, com o total do ciclo, e o dia de hoje tem uma seta a apontar.<br><br>Vê em <b>Mais → "Como usar"</b> → <b>"📋 Separador Semana"</b>.',
    manualMatch: 'Separador Semana'
  }
];

function novidadesVistas(){
  try { return JSON.parse(safeGet('novidadesVistas') || '[]'); } catch(e){ return []; }
}
function marcarNovidadeVista(chave){
  const v = novidadesVistas();
  if(!v.includes(chave)){ v.push(chave); safeSet('novidadesVistas', JSON.stringify(v)); }
}
// Usado quando um utilizador NOVO faz o onboarding — não lhe mostramos
// avisos de "novidade" de coisas que para ele já vêm de origem.
function marcarTodasNovidadesVistas(){
  safeSet('novidadesVistas', JSON.stringify(NOVIDADES.map(n => n.chave)));
}

// Abre o separador Mais e expande o item certo do manual
function abrirManualItem(match){
  if(typeof showTab === 'function') showTab('mais');
  setTimeout(() => {
    const qs = document.querySelectorAll('#manual .man-q');
    for(const q of qs){
      if(q.textContent.includes(match)){
        q.parentElement.classList.add('open');
        q.scrollIntoView({ behavior:'smooth', block:'center' });
        break;
      }
    }
  }, 120);
}

function mostrarNovidade(){
  const vistas = novidadesVistas();
  const nova = NOVIDADES.find(n => !vistas.includes(n.chave));
  if(!nova) return;
  const overlay = document.getElementById('news-overlay');
  if(!overlay) return;
  document.getElementById('news-ico').textContent = nova.ico;
  document.getElementById('news-title').textContent = nova.titulo;
  document.getElementById('news-sub').innerHTML = nova.texto;
  overlay.style.display = 'flex';

  const fechar = () => { marcarNovidadeVista(nova.chave); overlay.style.display = 'none'; };
  const main = document.getElementById('news-btn-main');
  const skip = document.getElementById('news-btn-skip');
  main.onclick = () => { fechar(); if(nova.manualMatch) abrirManualItem(nova.manualMatch); };
  skip.onclick = fechar;
}
