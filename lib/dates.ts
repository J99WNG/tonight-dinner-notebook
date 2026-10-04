import type { Language } from './i18n';

const localeByLanguage: Record<Language, string> = {
  en: 'en-GB',
  'zh-HK': 'zh-HK',
  'zh-CN': 'zh-CN',
};

// Midday avoids a date shifting when the browser applies a local timezone.
export function parseServiceDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

export function toServiceDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function hongKongToday(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function addDays(date: string, amount: number) {
  const next = parseServiceDate(date);
  next.setDate(next.getDate() + amount);
  return toServiceDate(next);
}

export function sevenDayWindow(start: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function formatServiceDate(
  date: string,
  language: Language,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(localeByLanguage[language], options).format(
    parseServiceDate(date),
  );
}

export function formatWeekRange(start: string, language: Language) {
  const end = addDays(start, 6);
  const startLabel = formatServiceDate(start, language, {
    day: 'numeric',
    month: 'short',
  });
  const endLabel = formatServiceDate(end, language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}
