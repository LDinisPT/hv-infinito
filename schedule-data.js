// Verallia Fontela - Turnos - Motor de ciclos infinito
// Ciclo de 74 dias por equipa. Âncora: 1 Jan 2026 = posição 0

const CYCLES = {
  A: ['F','F','F','F','5','5','5','5','F','21','21','21','21','F','F','13','13','13','F','5','5','5','5','F','F','21','21','21','21','F','13','13','13','F','F','5','5','5','5','F','21','21','21','21','F','F','13','13','13','F','5','5','5','5','F','21','21','21','21','21','F','F','F','F','F','F','F','F','F','F','F','F','F','F'],
  B: ['13','13','13','13','F','F','F','F','F','F','F','F','F','F','F','F','F','F','13','13','13','13','F','5','5','5','5','F','F','21','21','21','F','F','F','5','5','5','5','F','5','5','5','F','21','21','21','F','F','F','5','5','5','5','F','5','5','5','F','F','F','F','F','F','F','F','F','F','F','F','F','F','F','F'],
  C: ['21','21','F','F','13','13','13','F','5','5','5','5','F','21','21','21','21','21','F','F','F','F','F','F','F','F','F','F','F','F','F','F','5','5','5','5','F','21','21','21','21','F','F','13','13','13','F','5','5','5','5','F','21','21','21','21','F','F','13','13','13','F','F','F','F','F','F','F','F','F','F','F','F','F'],
  D: ['5','F','21','21','21','F','F','13','13','13','13','F','5','5','5','5','F','F','21','21','21','F','13','13','13','13','F','5','5','5','5','F','F','F','F','F','F','F','F','F','F','F','F','5','F','F','5','5','5','5','F','21','21','21','21','F','F','13','13','13','F','5','5','5','5','F','F','21','21','21','21','F','13','13'],
  E: ['F','5','5','5','F','21','21','21','21','F','F','13','13','13','13','F','5','5','5','F','F','21','21','21','21','F','13','13','13','13','F','F','5','5','5','F','21','21','21','21','F','13','13','13','13','21','F','F','F','F','F','F','F','F','F','F','F','F','F','F','F','F','F','5','5','5','F','21','21','21','21','F','13','13']
};

const CYCLE_LEN = 74;
const ANCHOR = new Date(2026, 0, 1); // 1 Jan 2026

// Feriados por ano: {ano: {"dia-mes": "nome"}}
const FERIADOS_POR_ANO = {
  2026: {
    "1-1":"Ano Novo","18-1":"Dia do Vidreiro","17-2":"Carnaval",
    "3-4":"Sexta-feira Santa","25-4":"Dia da Liberdade",
    "1-5":"Dia do Trabalhador","4-6":"Corpo de Deus","10-6":"Dia de Portugal",
    "24-6":"Sao Joao","15-8":"Assuncao N.Sra.","5-10":"Implantacao Republica",
    "1-11":"Todos os Santos","1-12":"Restauracao Independencia",
    "8-12":"Imaculada Conceicao","25-12":"Natal"
  },
  2027: {
    "1-1":"Ano Novo","18-1":"Dia do Vidreiro","9-2":"Carnaval",
    "26-3":"Sexta-feira Santa","25-4":"Dia da Liberdade",
    "1-5":"Dia do Trabalhador","27-5":"Corpo de Deus","10-6":"Dia de Portugal",
    "24-6":"Sao Joao","15-8":"Assuncao N.Sra.","5-10":"Implantacao Republica",
    "1-11":"Todos os Santos","1-12":"Restauracao Independencia",
    "8-12":"Imaculada Conceicao","25-12":"Natal"
  },
  2028: {
    "1-1":"Ano Novo","18-1":"Dia do Vidreiro","29-2":"Carnaval",
    "14-4":"Sexta-feira Santa","25-4":"Dia da Liberdade",
    "1-5":"Dia do Trabalhador","15-6":"Corpo de Deus","10-6":"Dia de Portugal",
    "24-6":"Sao Joao","15-8":"Assuncao N.Sra.","5-10":"Implantacao Republica",
    "1-11":"Todos os Santos","1-12":"Restauracao Independencia",
    "8-12":"Imaculada Conceicao","25-12":"Natal"
  }
};

function daysSinceAnchor(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = d - ANCHOR;
  return Math.round(diff / 86400000);
}

function getShift(team, date) {
  const days = daysSinceAnchor(date);
  const pos = ((days % CYCLE_LEN) + CYCLE_LEN) % CYCLE_LEN;
  return CYCLES[team][pos];
}

function getFeriado(date) {
  const year = date.getFullYear();
  const key = `${date.getDate()}-${date.getMonth()+1}`;
  return (FERIADOS_POR_ANO[year] || {})[key] || '';
}

function getDaysInMonth(year, month) {
  return new Date(year, month+1, 0).getDate();
}

const MONTH_NAMES = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const TEAMS = ['A','B','C','D','E'];

if (typeof module !== 'undefined') module.exports = { getShift, getFeriado, getDaysInMonth, MONTH_NAMES, TEAMS, CYCLES, CYCLE_LEN };
