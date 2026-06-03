// Verallia Fontela - Escala de Turnos
// Ciclo de 210 dias validado contra Excel oficial 2026 e 2027

const CYCLE = ["F", "F", "F", "F", "5", "5", "5", "5", "F", "21", "21", "21", "21", "F", "F", "13", "13", "13", "F", "5", "5", "5", "5", "F", "F", "21", "21", "21", "21", "F", "13", "13", "13", "F", "F", "5", "5", "5", "5", "F", "21", "21", "21", "21", "F", "F", "13", "13", "13", "F", "5", "5", "5", "5", "F", "21", "21", "21", "21", "21", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "21", "21", "21", "21", "F", "13", "13", "13", "13", "F", "F", "5", "5", "5", "F", "21", "21", "21", "21", "F", "F", "13", "13", "13", "13", "F", "5", "5", "5", "F", "F", "21", "21", "21", "21", "F", "13", "13", "13", "13", "F", "F", "5", "5", "5", "F", "21", "21", "21", "21", "F", "13", "13", "13", "13", "13", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "13", "13", "13", "13", "F", "5", "5", "5", "5", "F", "F", "21", "21", "21", "F", "13", "13", "13", "13", "F", "F", "5", "5", "5", "5", "F", "21", "21", "21", "F", "F", "13", "13", "13", "13", "F", "5", "5", "5", "5", "F", "F", "21", "21", "21", "F", "13", "13", "13", "13", "F", "5", "5", "5", "5", "5", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F"];
const CYCLE_LEN = 210;
const CYCLE_REF = new Date(2026, 0, 1);
const TEAM_OFFSETS = {"A": 0, "B": 126, "C": 42, "D": 168, "E": 84};

const X_DAYS = {
  "2026": { "A":"8-12", "C":"10-6", "D":"24-6", "E":"17-2" }
};

function isLeap(year) {
  return (year%4===0 && year%100!==0) || year%400===0;
}

function getMonthDays(year) {
  return [31,isLeap(year)?29:28,31,30,31,30,31,31,30,31,30,31];
}

function getShift(team, year, month, day) {
  // Calculate from cycle
  const offset = TEAM_OFFSETS[team];
  if(offset === undefined) return 'F';
  const date = new Date(year, month, day);
  const diffDays = Math.round((date - CYCLE_REF) / 86400000);
  const pos = ((diffDays + offset) % CYCLE_LEN + CYCLE_LEN) % CYCLE_LEN;
  return CYCLE[pos] || 'F';
}


// Feriados fixos - aplicam-se a TODOS os anos
const FERIADOS_FIXOS = {
  "1-1":  "Ano Novo",
  "18-1": "Dia do Vidreiro",
  "25-4": "Dia da Liberdade",
  "1-5":  "Dia do Trabalhador",
  "10-6": "Dia de Portugal",
  "24-6": "Sao Joao",
  "15-8": "Assuncao N.Sra.",
  "5-10": "Implantacao Republica",
  "1-11": "Todos os Santos",
  "1-12": "Restauracao Independencia",
  "8-12": "Imaculada Conceicao",
  "25-12":"Natal"
};

// Feriados moveis - por ano
const FERIADOS_MOVEIS = {
  2026: {"17-2":"Carnaval","3-4":"Sexta-feira Santa","5-4":"Pascoa","4-6":"Corpo de Deus"},
  2027: {"9-2":"Carnaval","26-3":"Sexta-feira Santa","28-3":"Pascoa","27-5":"Corpo de Deus"},
  2028: {"29-2":"Carnaval","14-4":"Sexta-feira Santa","16-4":"Pascoa","15-6":"Corpo de Deus"},
  2029: {"13-2":"Carnaval","30-3":"Sexta-feira Santa","1-4":"Pascoa","31-5":"Corpo de Deus"},
  2030: {"5-3":"Carnaval","19-4":"Sexta-feira Santa","21-4":"Pascoa","20-6":"Corpo de Deus"},
  2031: {"25-2":"Carnaval","11-4":"Sexta-feira Santa","13-4":"Pascoa","12-6":"Corpo de Deus"},
  2032: {"10-2":"Carnaval","26-3":"Sexta-feira Santa","28-3":"Pascoa","27-5":"Corpo de Deus"},
  2033: {"1-3":"Carnaval","15-4":"Sexta-feira Santa","17-4":"Pascoa","16-6":"Corpo de Deus"},
  2034: {"21-2":"Carnaval","7-4":"Sexta-feira Santa","9-4":"Pascoa","8-6":"Corpo de Deus"},
  2035: {"6-2":"Carnaval","23-3":"Sexta-feira Santa","25-3":"Pascoa","24-5":"Corpo de Deus"},
  2036: {"26-2":"Carnaval","11-4":"Sexta-feira Santa","13-4":"Pascoa","12-6":"Corpo de Deus"},
};


const MONTH_NAMES = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];


function getFeriado(year, month, day) {
  const key = day + '-' + (month+1);
  if(FERIADOS_FIXOS[key]) return FERIADOS_FIXOS[key];
  const mob = FERIADOS_MOVEIS[year];
  if(mob && mob[key]) return mob[key];
  return '';
}


// Compatibility layer - generates month arrays on demand
const SCHEDULES = new Proxy({}, {
  get(target, year) {
    if(!year || isNaN(year)) return {};
    return new Proxy({}, {
      get(t2, team) {
        if(!'ABCDE'.includes(team)) return [];
        const yr = parseInt(year);
        const md = getMonthDays(yr);
        return md.map((days, m) => {
          const dow_names = ['D','S','T','Q','Q','S','S'];
          return Array.from({length: days}, (_, d) => {
            const date = new Date(yr, m, d+1);
            const dow = dow_names[date.getDay()];
            return [d+1, dow, getShift(team, yr, m, d+1)];
          });
        });
      }
    });
  }
});
