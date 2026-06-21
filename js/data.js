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
  "24-6": "São João",
  "15-8": "Assunção N.ª Sra.",
  "5-10": "Implantação República",
  "1-11": "Todos os Santos",
  "1-12": "Restauração Independência",
  "8-12": "Imaculada Conceição",
  "25-12":"Natal"
};

// Feriados moveis - calculados automaticamente (algoritmo de Computus) para QUALQUER ano
function calcPascoa(ano){
  const a=ano%19, b=Math.floor(ano/100), c=ano%100, d=Math.floor(b/4), e=b%4;
  const f=Math.floor((b+8)/25), g=Math.floor((b-f+1)/3);
  const h=(19*a+b-d-g+15)%30, i=Math.floor(c/4), k=c%4;
  const l=(32+2*e+2*i-h-k)%7, m=Math.floor((a+11*h+22*l)/451);
  const mes=Math.floor((h+l-7*m+114)/31), dia=((h+l-7*m+114)%31)+1;
  return new Date(ano, mes-1, dia);
}
function feriadosMoveis(ano){
  const p = calcPascoa(ano);
  const off = (dias) => { const x=new Date(p); x.setDate(x.getDate()+dias); return x.getDate()+'-'+(x.getMonth()+1); };
  return { [off(-47)]:'Carnaval', [off(-2)]:'Sexta-feira Santa', [off(0)]:'Páscoa', [off(60)]:'Corpo de Deus' };
}


const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];


function getFeriado(year, month, day) {
  const key = day + '-' + (month+1);
  if(FERIADOS_FIXOS[key]) return FERIADOS_FIXOS[key];
  const mob = feriadosMoveis(year);
  if(mob[key]) return mob[key];
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
