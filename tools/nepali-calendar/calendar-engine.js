import { BS_MONTH_LENGTHS, BS_MONTH_NAMES, BS_MONTH_NAMES_NP, BS_DATA_RANGE } from './calendar-data.js';

export { BS_MONTH_LENGTHS, BS_MONTH_NAMES, BS_MONTH_NAMES_NP, BS_DATA_RANGE };

const MS_PER_DAY = 86400000;
const BS_EPOCH = Date.UTC(1943, 3, 14); // 2000-01-01 BS

function assertInteger(value, label) {
  if (!Number.isInteger(value)) throw new RangeError(`${label} must be an integer`);
}

export function isLeapGregorianYear(year) {
  assertInteger(year, 'year');
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year, month) {
  assertInteger(year, 'year');
  assertInteger(month, 'month');
  const months = BS_MONTH_LENGTHS[year];
  if (!months) throw new RangeError(`Unsupported BS year: ${year}`);
  if (month < 1 || month > 12) throw new RangeError(`Invalid BS month: ${month}`);
  return months[month - 1];
}

export function validateBsDate(year, month, day) {
  const max = daysInMonth(year, month);
  assertInteger(day, 'day');
  if (day < 1 || day > max) throw new RangeError(`Invalid BS date: ${year}-${month}-${day}`);
  return true;
}

function parseIsoDate(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new RangeError('AD date must use YYYY-MM-DD format');
  }
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError(`Invalid AD date: ${iso}`);
  }
  return date;
}

function pad(value) { return String(value).padStart(2, '0'); }

export function bsToAd(year, month, day) {
  validateBsDate(year, month, day);
  let offset = day - 1;
  for (let y = BS_DATA_RANGE.minYear; y < year; y += 1) {
    offset += BS_MONTH_LENGTHS[y].reduce((sum, value) => sum + value, 0);
  }
  for (let m = 1; m < month; m += 1) offset += daysInMonth(year, m);
  const date = new Date(BS_EPOCH + offset * MS_PER_DAY);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function bsToAdIso(year, month, day) {
  const d = bsToAd(year, month, day);
  return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
}

export function adToBs(iso) {
  const date = parseIsoDate(iso);
  const offset = Math.floor((date.getTime() - BS_EPOCH) / MS_PER_DAY);
  if (offset < 0) throw new RangeError(`AD date is before supported range: ${iso}`);
  let remaining = offset;
  for (let year = BS_DATA_RANGE.minYear; year <= BS_DATA_RANGE.maxYear; year += 1) {
    const yearDays = BS_MONTH_LENGTHS[year].reduce((sum, value) => sum + value, 0);
    if (remaining < yearDays) {
      for (let month = 1; month <= 12; month += 1) {
        const monthDays = daysInMonth(year, month);
        if (remaining < monthDays) return { year, month, day: remaining + 1 };
        remaining -= monthDays;
      }
    }
    remaining -= yearDays;
  }
  throw new RangeError(`AD date is outside supported range: ${iso}`);
}

export function adToBsIso(iso) {
  const d = adToBs(iso);
  return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
}

export function formatBs(year, month, day, locale = 'en') {
  validateBsDate(year, month, day);
  const names = locale === 'ne' ? BS_MONTH_NAMES_NP : BS_MONTH_NAMES;
  return `${pad(day)} ${names[month - 1]} ${year}`;
}

export const calendarRange = Object.freeze({ ...BS_DATA_RANGE, epochAd: '1943-04-14' });
