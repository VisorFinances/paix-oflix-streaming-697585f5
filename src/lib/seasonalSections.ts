import { Movie } from '@/types';

interface SeasonalSection {
  title: string;
  movies: Movie[];
}

/** Compute Easter Sunday for a given year (Anonymous Gregorian algorithm) */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Get Mother's Day (2nd Sunday of May) */
function mothersDayDate(year: number): Date {
  const may1 = new Date(year, 4, 1);
  const firstSunday = (7 - may1.getDay()) % 7;
  return new Date(year, 4, 1 + firstSunday + 7);
}

/** Get Father's Day in Brazil (2nd Sunday of August) */
function fathersDayDate(year: number): Date {
  const aug1 = new Date(year, 7, 1);
  const firstSunday = (7 - aug1.getDay()) % 7;
  return new Date(year, 7, 1 + firstSunday + 7);
}

/** Monday of the week containing a date */
function mondayOfWeek(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function matchesKeywords(movie: Movie, keywords: RegExp[]): boolean {
  const text = `${movie.title} ${movie.description} ${movie.genre.join(' ')}`.toLowerCase();
  return keywords.some(rx => rx.test(text));
}

const MOTHER_KEYWORDS = [/mãe/i, /mae/i, /matern/i, /mother/i, /mamãe/i, /mama/i, /família/i];
const FATHER_KEYWORDS = [/pai/i, /patern/i, /father/i, /papai/i, /dad/i, /família/i];

// Enhanced finance/success keywords - much broader coverage
const FINANCE_KEYWORDS = [
  // Finance & Money
  /dinheiro/i, /financ/i, /wall street/i, /bilion/i, /billion/i, /milion/i, /million/i,
  /banco/i, /bank/i, /invest/i, /econom/i, /money/i, /capital/i, /bolsa/i, /trader/i,
  /cripto/i, /bitcoin/i, /forex/i, /ações/i, /stock/i, /lucro/i, /profit/i,
  // Business & Entrepreneurship
  /negóci/i, /business/i, /empres/i, /empreend/i, /startup/i, /ceo/i, /corporat/i,
  /empresa/i, /magnata/i, /mogul/i, /tycoon/i, /empire/i, /império/i,
  // Success & Wealth
  /rico/i, /riq/i, /fortune/i, /fortuna/i, /sucesso/i, /success/i, /wealth/i,
  /milionár/i, /billionair/i, /bilionár/i, /milionari/i, /prosper/i,
  // Empowerment & Overcoming
  /superação/i, /superar/i, /empoderam/i, /empower/i, /inspira/i, /motivac/i,
  /conquist/i, /vitória/i, /triumph/i, /determinaç/i, /resiliên/i,
  // Specific titles commonly about finance/success
  /wolf/i, /lobo/i, /pursuit.*happyness/i, /à procura/i, /wall\s*street/i,
  /big\s*short/i, /grande\s*aposta/i, /margin\s*call/i, /inside\s*job/i,
  /social\s*network/i, /rede\s*social/i, /jobs/i, /steve\s*jobs/i,
  /fundador/i, /founder/i, /self[\s-]*made/i, /rags.*riches/i,
];

export function getSeasonalSections(movies: Movie[], now: Date = new Date()): SeasonalSection[] {
  const year = now.getFullYear();
  const sections: SeasonalSection[] = [];

  // 1. Semana Santa
  const easter = easterSunday(year);
  const easterMonBefore = mondayOfWeek(easter);
  easterMonBefore.setHours(6, 1, 0);
  const easterMonAfter = new Date(easter);
  easterMonAfter.setDate(easter.getDate() + 1);
  easterMonAfter.setHours(23, 59, 0);
  if (now >= easterMonBefore && now <= easterMonAfter) {
    const items = movies.filter(m => m.genre.some(g => /religi/i.test(g)));
    if (items.length > 0) sections.push({ title: 'Semana Santa', movies: items });
  }

  // 2. Dia das Mães
  const mothersDay = mothersDayDate(year);
  const mdFri = new Date(mothersDay);
  mdFri.setDate(mothersDay.getDate() - 2);
  mdFri.setHours(8, 0, 0);
  const mdMon = new Date(mothersDay);
  mdMon.setDate(mothersDay.getDate() + 1);
  mdMon.setHours(14, 0, 0);
  if (now >= mdFri && now <= mdMon) {
    const items = movies.filter(m => matchesKeywords(m, MOTHER_KEYWORDS));
    if (items.length > 0) sections.push({ title: 'Especial para as Mães', movies: items });
  }

  // 3. Dia dos Pais
  const fathersDay = fathersDayDate(year);
  const fdFri = new Date(fathersDay);
  fdFri.setDate(fathersDay.getDate() - 2);
  fdFri.setHours(7, 0, 0);
  const fdMon = new Date(fathersDay);
  fdMon.setDate(fathersDay.getDate() + 1);
  fdMon.setHours(13, 0, 0);
  if (now >= fdFri && now <= fdMon) {
    const items = movies.filter(m => matchesKeywords(m, FATHER_KEYWORDS));
    if (items.length > 0) sections.push({ title: 'Especial para os Papais', movies: items });
  }

  // 4. Semana das Crianças
  const kidsStart = new Date(year, 9, 8, 9, 0, 0);
  const kidsEnd = new Date(year, 9, 13, 22, 51, 0);
  if (now >= kidsStart && now <= kidsEnd) {
    const items = movies.filter(m => m.kids).sort((a, b) => b.year - a.year).slice(0, 20);
    if (items.length > 0) sections.push({ title: 'Semana das Crianças', movies: items });
  }

  // 5. Natal
  const christmas = new Date(year, 11, 25);
  const xmasMon = mondayOfWeek(christmas);
  xmasMon.setHours(2, 0, 0);
  const xmasEnd = new Date(year, 11, 27, 0, 0, 0);
  if (now >= xmasMon && now <= xmasEnd) {
    const items = movies.filter(m =>
      m.genre.some(g => /natal/i.test(g)) || /natal|christmas/i.test(m.title)
    );
    if (items.length > 0) sections.push({ title: 'Especial de Natal', movies: items });
  }

  // 6. Cofre de Histórias $ — Sunday 13:13 → Wednesday 12:47 weekly
  // Only shows finance/business/success content
  const dayOfWeek = now.getDay();
  const h = now.getHours();
  const min = now.getMinutes();
  const timeVal = h * 60 + min;
  const isCofreActive =
    (dayOfWeek === 0 && timeVal >= 13 * 60 + 13) ||
    dayOfWeek === 1 || dayOfWeek === 2 ||
    (dayOfWeek === 3 && timeVal < 12 * 60 + 47);
  if (isCofreActive) {
    const items = movies.filter(mv => matchesKeywords(mv, FINANCE_KEYWORDS));
    if (items.length > 0) sections.push({ title: 'Cofre de Histórias $', movies: items });
  }

  return sections;
}
