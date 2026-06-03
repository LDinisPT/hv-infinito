// Verallia Fontela - Escala de Turnos
// Ciclo de 210 dias validado contra Excel oficial 2026 e 2027

const CYCLE = ["F", "F", "F", "F", "5", "5", "5", "5", "F", "21", "21", "21", "21", "F", "F", "13", "13", "13", "F", "5", "5", "5", "5", "F", "F", "21", "21", "21", "21", "F", "13", "13", "13", "F", "F", "5", "5", "5", "5", "F", "21", "21", "21", "21", "F", "F", "13", "13", "13", "F", "5", "5", "5", "5", "F", "21", "21", "21", "21", "21", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "21", "21", "21", "21", "F", "13", "13", "13", "13", "F", "F", "5", "5", "5", "F", "21", "21", "21", "21", "F", "F", "13", "13", "13", "13", "F", "5", "5", "5", "F", "F", "21", "21", "21", "21", "F", "13", "13", "13", "13", "F", "F", "5", "5", "5", "F", "21", "21", "21", "21", "F", "13", "13", "13", "13", "13", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "13", "13", "13", "13", "F", "5", "5", "5", "5", "F", "F", "21", "21", "21", "F", "13", "13", "13", "13", "F", "F", "5", "5", "5", "5", "F", "21", "21", "21", "F", "F", "13", "13", "13", "13", "F", "5", "5", "5", "5", "F", "F", "21", "21", "21", "F", "13", "13", "13", "13", "F", "5", "5", "5", "5", "5", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F"];
const CYCLE_LEN = 210;
const CYCLE_REF = new Date(2026, 0, 1);
const TEAM_OFFSETS = {"A": 0, "B": 126, "C": 42, "D": 168, "E": 84};

const X_DAYS = {
  "2026": { "A":"8-12", "B":"15-8", "C":"10-6", "D":"24-6", "E":"17-2" }
};

function isLeap(year) {
  return (year%4===0 && year%100!==0) || year%400===0;
}

function getMonthDays(year) {
  return [31,isLeap(year)?29:28,31,30,31,30,31,31,30,31,30,31];
}

function getShift(team, year, month, day) {
  // Check X days first
  const xYear = X_DAYS[String(year)];
  if(xYear && xYear[team]) {
    if((day + '-' + (month+1)) === xYear[team]) return 'X';
  }
  // Calculate from cycle
  const offset = TEAM_OFFSETS[team];
  if(offset === undefined) return 'F';
  const date = new Date(year, month, day);
  const diffDays = Math.round((date - CYCLE_REF) / 86400000);
  const pos = ((diffDays + offset) % CYCLE_LEN + CYCLE_LEN) % CYCLE_LEN;
  return CYCLE[pos] || 'F';
}

const FERIADOS = {
  2026: {"1-1":"Ano Novo","18-1":"Dia do Vidreiro","17-2":"Carnaval","3-4":"Sexta-feira Santa","5-4":"Pascoa","25-4":"Dia da Liberdade","1-5":"Dia do Trabalhador","4-6":"Corpo de Deus","10-6":"Dia de Portugal","24-6":"Sao Joao","15-8":"Assuncao N.Sra.","5-10":"Implantacao Republica","1-11":"Todos os Santos","1-12":"Restauracao Independencia","8-12":"Imaculada Conceicao","25-12":"Natal"},
  2027: {"1-1":"Ano Novo","18-1":"Dia do Vidreiro","9-2":"Carnaval","26-3":"Sexta-feira Santa","28-3":"Pascoa","25-4":"Dia da Liberdade","1-5":"Dia do Trabalhador","27-5":"Corpo de Deus","10-6":"Dia de Portugal","24-6":"Sao Joao","15-8":"Assuncao N.Sra.","5-10":"Implantacao Republica","1-11":"Todos os Santos","1-12":"Restauracao Independencia","8-12":"Imaculada Conceicao","25-12":"Natal"},
  2028: {"1-1":"Ano Novo","18-1":"Dia do Vidreiro","25-4":"Dia da Liberdade","1-5":"Dia do Trabalhador","10-6":"Dia de Portugal","24-6":"Sao Joao","15-8":"Assuncao N.Sra.","5-10":"Implantacao Republica","1-11":"Todos os Santos","1-12":"Restauracao Independencia","8-12":"Imaculada Conceicao","25-12":"Natal"},
  2029: {"1-1":"Ano Novo","18-1":"Dia do Vidreiro","25-4":"Dia da Liberdade","1-5":"Dia do Trabalhador","10-6":"Dia de Portugal","24-6":"Sao Joao","15-8":"Assuncao N.Sra.","5-10":"Implantacao Republica","1-11":"Todos os Santos","1-12":"Restauracao Independencia","8-12":"Imaculada Conceicao","25-12":"Natal"},
  2030: {"1-1":"Ano Novo","18-1":"Dia do Vidreiro","25-4":"Dia da Liberdade","1-5":"Dia do Trabalhador","10-6":"Dia de Portugal","24-6":"Sao Joao","15-8":"Assuncao N.Sra.","5-10":"Implantacao Republica","1-11":"Todos os Santos","1-12":"Restauracao Independencia","8-12":"Imaculada Conceicao","25-12":"Natal"}
};

const MONTH_NAMES = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function getFeriado(year, month, day) {
  return ((FERIADOS[year]||{})[day+'-'+(month+1)]) || '';
}
