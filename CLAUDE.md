# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

O autor e utilizador desta app é português. **Escreve sempre em português de Portugal** — no código (nomes de funções, comentários), nos textos da interface e nas mensagens de commit.

## O que é

PWA de turnos para a Verallia Portugal (fábrica da Fontela, Figueira da Foz). Mostra a escala de turnos rotativos das equipas A-E, e à volta disso junta ferramentas do dia-a-dia: lembrete de medicação, despertador, férias, rendimento de produção, posto médico.

Publicada em **https://ldinispt.github.io/hv-infinito/** via GitHub Pages, servida diretamente da branch `main` (não há workflow próprio — o GitHub cria o run "pages build and deployment" sozinho a cada push, demora cerca de 1 minuto).

## Sem build, sem testes, sem dependências

Não há `package.json`, bundler, linter nem testes. São ficheiros estáticos servidos tal como estão. Para experimentar, abre o `index.html` num browser ou serve a pasta (`python3 -m http.server`).

Os scripts são **clássicos, não módulos** (exceto `js/firebase.js`): partilham um único escopo global e são carregados por ordem no fim do `index.html`. Uma função definida num ficheiro é chamada livremente a partir de outro. A única dependência externa carregada em runtime é o Firebase, por CDN.

Quando mexeres em qualquer ficheiro, verifica no browser — é a única rede de segurança que existe. Há um Chromium disponível para isso.

## Regra obrigatória: subir a versão em cada alteração

O service worker faz *cache* agressivo. Se não subires a versão, os utilizadores continuam a ver o código antigo. **Em qualquer alteração a ficheiros `.js`, `.css` ou ao `index.html`, sobe os quatro sítios ao mesmo tempo:**

1. `index.html` — todos os `?v=NN` (nos `<link>` e nos `<script>`)
2. `index.html` — o rótulo `V2.NN` no rodapé
3. `sw.js` — `const CACHE = 'verallia-v2-0NN'`
4. `sw.js` — os `?v=NN` da lista `FILES`

Se acrescentares um ficheiro novo, junta-o à lista `FILES` do `sw.js` *e* ao `index.html`.

O histórico de commits usa um commit por versão, com a mensagem a começar por `V2.NN - descrição curta`.

## Arquitetura

### O motor da escala (`js/data.js`)

Tudo o resto depende disto. A escala **não está guardada em lado nenhum** — é calculada a partir de um ciclo de 210 dias:

```
getShift(equipa, ano, mês, dia) → '5' | '13' | '21' | 'F'
```

- `CYCLE` — os 210 dias do ciclo, validado contra o Excel oficial de 2026 e 2027
- `CYCLE_REF` — 1 de janeiro de 2026, a âncora
- `TEAM_OFFSETS` — o desfasamento de cada equipa dentro do ciclo (A=0, C=42, E=84, B=126, D=168)

Como 210 é múltiplo de 7, o ciclo cai sempre nos mesmos dias da semana. **Funciona para qualquer ano, passado ou futuro, sem manutenção.** Nunca acrescentes tabelas de escala por ano — se precisares de um mês inteiro, o proxy `SCHEDULES[ano][equipa]` gera-o a partir do ciclo.

Os feriados também são automáticos: os fixos aplicam-se a todos os anos e os móveis (Carnaval, Sexta-feira Santa, Páscoa, Corpo de Deus) saem do algoritmo de Computus em `calcPascoa()`. `X_DAYS` está definido mas não é usado por nada.

### Códigos de turno

| Código | Turno | Horas |
|---|---|---|
| `'5'` | Manhã | 05h-13h |
| `'13'` | Tarde | 13h-21h |
| `'21'` | Noite | 21h-05h |
| `'F'` | Folga | — |
| `'X'` | Férias/feriado | — (só na apresentação; `getShift` nunca devolve `'X'`) |

Uma sequência de 12 ou mais folgas seguidas é uma **quinzena** (`getQuinzenaDays`).

### O recuo das 05h — cuidado com isto

O turno da Noite começa às 21h e acaba às 05h do dia seguinte. Para a escala, esse turno pertence ao dia em que *começou*. Por isso, entre a meia-noite e as 05h, o "dia de hoje" para efeitos de escala é o **dia anterior**.

Usa sempre `getShiftRefDate()` (em `js/core.js`) para obter o dia de escala; `todayD`/`todayM`/`todayY` já têm o recuo aplicado. Usar `new Date()` diretamente para decidir turnos é um bug — a app mostraria a escala errada de madrugada, precisamente quando quem está a trabalhar a consulta.

A exceção é a medicação: as horas do lembrete (12h/14h) caem sempre dentro do mesmo dia de escala, por isso `js/medicacao.js` usa o dia do calendário de propósito.

### Estado global

`js/core.js` define três variáveis globais mutáveis que tudo lê:

- `curTeam` — a equipa escolhida, persistida em `localStorage.team`
- `curYear` / `curMonth` — o ano/mês que o utilizador está a ver

`curYear` **não é persistido**: arranca no ano atual e muda com as setas `«` `»` do separador Mês. As estatísticas e o cartão de atividades do Grupo seguem-no, por isso viram de ano sozinhos a 1 de janeiro.

`setTeam()` (em `js/app.js`) é o ponto central: muda a equipa e refaz **todos** os ecrãs. Se acrescentares um bloco novo que dependa da equipa, chama-o a partir daí.

### Persistência

Tudo é `localStorage`, sempre através de `safeGet`/`safeSet` (que engolem exceções — em navegação privada o `localStorage` pode rebentar). Não uses `localStorage` diretamente.

Chaves: `team`, `userName`, `lastTab`, `novidadesVistas`, `evtOpen`, `ausencias`, `alarmOn`, `alarmTime`, `medOn`, `medTimes`, `medTaken`, `medTakenAt`, `medNotif`, `medNotified`, `verallia_rendimento_turno`.

A única coisa **partilhada entre colegas** é o catálogo de modelos de garrafa, no Firestore (`js/firebase.js`, coleção `bottles`). Expõe `window.BottlesDB` para o `rendimento.js` (que é um IIFE, ao contrário do resto) e sincroniza em tempo real com cache offline. Editar modelos pede um PIN, definido em claro no `rendimento.js` — não é segurança a sério, é só para evitar asneiras.

### Separadores

Sete, geridos por `showTab()` em `js/tabs.js`; cada um é um `.tab-panel` no `index.html`. A app abre sempre no "Hoje".

| Separador | Ficheiro | Notas |
|---|---|---|
| Hoje | `hoje.js` + `timeline.js` | `renderHoje()` está no `timeline.js`, não no `hoje.js` |
| Semana | `semana.js` | IIFE; segunda a domingo, todas as equipas |
| Mês | `mes.js` | calendário e feriados |
| Médico | `medico.js` | horário fixo do posto médico, escrito à mão |
| Stats | `mais.js` | `renderStats()` e as atividades do Grupo |
| Rend. | `rendimento.js` | IIFE, o maior ficheiro |
| Mais | `alarm.js`, `medicacao.js`, `ausencias.js` | definições, despertador, medicação, férias, manual |

### Lembretes: porquê pelo calendário

Uma PWA fechada não consegue tocar de forma fiável (o iOS e a poupança de bateria do Android matam-na). Por isso, tanto o despertador como a medicação exportam um ficheiro **`.ics`** com `VALARM`, que o utilizador importa para o calendário do telemóvel — é o calendário que toca. As notificações do browser existem, mas como extra, não como mecanismo principal.

Ao mudar isto, mantém essa ordem de prioridades e não prometas ao utilizador avisos que a app não consegue cumprir.

### Avisos de novidade

Ao lançar uma funcionalidade visível, junta uma entrada ao array `NOVIDADES` em `js/news.js`, com uma `chave` única (ex.: `medicacao-v47`) e um `manualMatch` que corresponda ao título de um item do manual no `index.html`. Quem já usa a app vê o aviso uma vez; quem entra de novo não vê nenhum (o onboarding marca todos como vistos).

Se a funcionalidade for configurável, junta também o item ao manual (`#manual` no `index.html`).

## Manutenção anual

Quase tudo se atualiza sozinho na passagem de ano — turnos, folgas, horas, feriados, fins de semana livres, o ano do rodapé. **A única exceção** é o calendário de atividades do Grupo Cultural e Desportivo, em `EVENTOS_GRUPO_ANOS` (`js/mais.js`): quando o Grupo publicar as datas do ano seguinte, junta-se uma entrada nova (`2027: [...]`) e mais nada é preciso. Enquanto não for acrescentada, a app avisa que o calendário "ainda está por definir", em vez de mostrar o ano anterior como se fosse o atual.

## Estilo

CSS escrito à mão, sem framework, um ficheiro por área. Tema escuro, tipografia Exo 2, interface desenhada para telemóvel (a app é quase sempre usada num telemóvel instalado no ecrã principal).

Cores por turno, consistentes em toda a app: Manhã `#FFE600` amarelo, Tarde `#00BFFF` azul, Noite `#00FFB4` verde-água, Folga verde, Medicação `#c084fc` roxo.

O código é escrito para ser lido pelo autor daqui a meses: funções curtas, comentários em português a explicar o *porquê* das decisões não óbvias (o recuo das 05h, o motivo do `.ics`, o que precisa de manutenção manual). Mantém esse registo.
