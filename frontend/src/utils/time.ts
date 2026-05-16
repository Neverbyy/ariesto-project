// Чистые утилиты для работы со временем и датами.
// Извлекаются из обоих компонентов, чтобы не дублировать одну и ту же логику.

const MONTH_NAMES = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const DAY_NAMES = [
  'воскресенье', 'понедельник', 'вторник', 'среда',
  'четверг', 'пятница', 'суббота',
];

export interface FormattedDate {
  day: number;
  month: string;
  label: string;
}

/** Достаёт ЧЧ:ММ из ISO-строки без переключения часового пояса. */
export function extractTimeFromISO(isoString: string): string {
  const timeMatch = isoString.match(/T(\d{2}:\d{2}):\d{2}/);
  return timeMatch ? timeMatch[1] : '';
}

/** Переводит ЧЧ:ММ в число минут от полуночи. */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Проверяет, перекрываются ли два временных интервала в формате ЧЧ:ММ. */
export function doTimeRangesOverlap(
  start1: string, end1: string,
  start2: string, end2: string,
): boolean {
  return toMinutes(start1) < toMinutes(end2)
      && toMinutes(start2) < toMinutes(end1);
}

/** Длительность интервала в минутах. */
export function durationMinutes(start: string, end: string): number {
  return toMinutes(end) - toMinutes(start);
}

export function getMonthName(month: number): string {
  return MONTH_NAMES[month];
}

/** Формат для кнопок дат: { 17, 'мая', 'сегодня'/'завтра'/<день недели> }. */
export function formatDate(dateString: string): FormattedDate {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();

  let label: string;
  if (sameDay(date, today)) label = 'сегодня';
  else if (sameDay(date, tomorrow)) label = 'завтра';
  else label = DAY_NAMES[date.getDay()];

  return { day: date.getDate(), month: getMonthName(date.getMonth()), label };
}

/** Формат для шапки модалки: "17 мая 2026". */
export function formatDateForModal(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getDate()} ${getMonthName(date.getMonth())} ${date.getFullYear()}`;
}

/** Генерирует временные слоты с шагом 30 минут от opening до closing. */
export function generateTimeSlots(opening: string, closing: string): string[] {
  const slots: string[] = [];
  const current = new Date(`2000-01-01T${opening}`);
  const end = new Date(`2000-01-01T${closing}`);
  while (current <= end) {
    slots.push(current.toTimeString().slice(0, 5));
    current.setMinutes(current.getMinutes() + 30);
  }
  return slots;
}

/** Возвращает сегодняшнюю дату в формате YYYY-MM-DD. */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
