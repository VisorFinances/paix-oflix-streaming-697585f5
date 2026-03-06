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
const FINANCE_KEYWORDS = [/dinheiro/i, /financ/i, /wall street/i, /bilion/i, /billion/i, /milion/i, /million/i, /banco/i, /bank/i, /invest/i, /econom/i, /negóci/i, /business/i, /empres/i, /rico/i, /riq/i, /fortune/i, /fortuna/i, /money/i, /capital/i, /bolsa/i, /trader/i, /cripto/i];

export function getSeasonalSections(movies: Movie[], now: Date = new Date()): SeasonalSection[] {
  const year = now.getFullYear();
  const sections: SeasonalSection[] = [];

  // 1. Semana Santa: Monday 06:01 before Easter → Monday 23:59 after Easter
  const easter = easterSunday(year);
  const easterMonBefore = mondayOfWeek(easter);
  easterMonBefore.setHours(6, 1, 0);
  const easterMonAfter = new Date(easter);
  easterMonAfter.setDate(easter.getDate() + 1); // Monday after
  easterMonAfter.setHours(23, 59, 0);
  if (now >= easterMonBefore && now <= easterMonAfter) {
    const items = movies.filter(m => m.genre.some(g => /religi/i.test(g)));
    if (items.length > 0) sections.push({ title: 'Semana Santa', movies: items });
  }

  // 2. Dia das Mães: Friday 08:00 before → Monday 14:00 after
  const mothersDay = mothersDayDate(year);
  const mdFri = new Date(mothersDay);
  mdFri.setDate(mothersDay.getDate() - 2); // Friday before Sunday
  mdFri.setHours(8, 0, 0);
  const mdMon = new Date(mothersDay);
  mdMon.setDate(mothersDay.getDate() + 1);
  mdMon.setHours(14, 0, 0);
  if (now >= mdFri && now <= mdMon) {
    const items = movies.filter(m => matchesKeywords(m, MOTHER_KEYWORDS));
    if (items.length > 0) sections.push({ title: 'Especial para as Mães', movies: items });
  }

  // 3. Dia dos Pais: Friday 07:00 before → Monday 13:00 after
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

  // 4. Semana das Crianças: Oct 8 09:00 → Oct 13 22:51
  const kidsStart = new Date(year, 9, 8, 9, 0, 0);
  const kidsEnd = new Date(year, 9, 13, 22, 51, 0);
  if (now >= kidsStart && now <= kidsEnd) {
    const items = movies.filter(m => m.kids).sort((a, b) => b.year - a.year).slice(0, 20);
    if (items.length > 0) sections.push({ title: 'Semana das Crianças', movies: items });
  }

  // 5. Natal: Monday of Christmas week 02:00 → Dec 27 00:00
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
  const dayOfWeek = now.getDay();
  const h = now.getHours();
  const m = now.getMinutes();
  const timeVal = h * 60 + m;
  const isCofreActive =
    (dayOfWeek === 0 && timeVal >= 13 * 60 + 13) || // Sunday after 13:13
    dayOfWeek === 1 || dayOfWeek === 2 || // Mon, Tue
    (dayOfWeek === 3 && timeVal < 12 * 60 + 47); // Wed before 12:47
  if (isCofreActive) {
    const items = movies.filter(mv => matchesKeywords(mv, FINANCE_KEYWORDS));
    if (items.length > 0) sections.push({ title: 'Cofre de Histórias $', movies: items });
  }

  return sections;
}
