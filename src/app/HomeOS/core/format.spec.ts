import {
  daysUntil,
  formatCurrency,
  formatDate,
  formatDayMonth,
  formatMonth,
  isInMonth,
  isSameMonth,
  monthKey,
  relativeDay,
  shiftMonth,
} from './format';

/* Dates drive warranty badges, reminder states and the Finances month, so
   off-by-one errors here show up as wrong colours and missing rows. */

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

describe('daysUntil', () => {
  it('is 0 for today', () => {
    expect(daysUntil(isoDaysFromNow(0))).toBe(0);
  });

  it('counts forward', () => {
    expect(daysUntil(isoDaysFromNow(30))).toBe(30);
  });

  it('goes negative for the past', () => {
    expect(daysUntil(isoDaysFromNow(-5))).toBe(-5);
  });

  it('ignores the time of day', () => {
    // Both are "today" regardless of when the test runs.
    expect(daysUntil(`${isoDaysFromNow(0)}T23:59:59`)).toBe(0);
  });

  /* A DST boundary makes a "day" 23 or 25 hours long. Rounding, rather than
     flooring, is what keeps that from reporting 29 days for 30. */
  it('survives a month spanning a DST change', () => {
    expect(daysUntil(isoDaysFromNow(60))).toBe(60);
    expect(daysUntil(isoDaysFromNow(180))).toBe(180);
  });
});

describe('relativeDay', () => {
  it('names the days around today', () => {
    expect(relativeDay(isoDaysFromNow(0))).toBe('Today');
    expect(relativeDay(isoDaysFromNow(1))).toBe('Tomorrow');
    expect(relativeDay(isoDaysFromNow(-1))).toBe('Yesterday');
  });

  it('counts in both directions', () => {
    expect(relativeDay(isoDaysFromNow(9))).toBe('In 9 days');
    expect(relativeDay(isoDaysFromNow(-9))).toBe('9 days ago');
  });
});

describe('formatCurrency', () => {
  it('uses the Indian grouping', () => {
    // 1,00,000 rather than 100,000.
    expect(formatCurrency(100000)).toBe('₹1,00,000');
    expect(formatCurrency(4299)).toBe('₹4,299');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('₹0');
  });
});

describe('formatDate', () => {
  it('reads as a date, not an ISO string', () => {
    expect(formatDate('2026-09-21')).toBe('Sep 21, 2026');
  });
});

describe('formatDayMonth', () => {
  it('pads the day and uppercases the month', () => {
    expect(formatDayMonth('2026-03-07')).toEqual({ day: '07', month: 'MAR' });
  });
});

describe('isSameMonth', () => {
  it('compares month and year together', () => {
    const ref = new Date(2026, 8, 15); // September 2026
    expect(isSameMonth('2026-09-01', ref)).toBe(true);
    expect(isSameMonth('2026-09-30', ref)).toBe(true);
    expect(isSameMonth('2026-08-31', ref)).toBe(false);
    // Same month, different year — the classic bug.
    expect(isSameMonth('2025-09-15', ref)).toBe(false);
  });
});

describe('month keys', () => {
  it('pads single-digit months', () => {
    expect(monthKey(new Date(2026, 0, 9))).toBe('2026-01');
    expect(monthKey(new Date(2026, 11, 9))).toBe('2026-12');
  });

  it('matches a date by its ISO prefix', () => {
    expect(isInMonth('2026-09-21', '2026-09')).toBe(true);
    expect(isInMonth('2026-10-01', '2026-09')).toBe(false);
  });

  it('shifts across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-09', -12)).toBe('2025-09');
  });

  it('sorts and compares as plain strings', () => {
    // The Finances page relies on this for "is this the current month?".
    expect('2026-09' < '2026-10').toBe(true);
    expect('2025-12' < '2026-01').toBe(true);
  });

  it('drops the year only for the current one', () => {
    const thisYear = new Date().getFullYear();
    expect(formatMonth(`${thisYear}-09`)).toBe('Sep');
    expect(formatMonth(`${thisYear - 1}-09`)).toBe(`Sep ${thisYear - 1}`);
  });
});
