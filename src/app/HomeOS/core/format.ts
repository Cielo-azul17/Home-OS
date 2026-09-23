const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseDate(iso: string): Date {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysUntil(iso: string): number {
  const ms = parseDate(iso).getTime() - today().getTime();
  return Math.round(ms / 86_400_000);
}

export function formatDate(iso: string): string {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDayMonth(iso: string): { day: string; month: string } {
  const d = parseDate(iso);
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: MONTHS[d.getMonth()].toUpperCase(),
  };
}

/** "Due tomorrow", "3 days ago", "in 12 days" — relative phrasing for dates. */
export function relativeDay(iso: string): string {
  const n = daysUntil(iso);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${Math.abs(n)} days ago`;
  return `In ${n} days`;
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function isSameMonth(iso: string, ref: Date = new Date()): boolean {
  const d = parseDate(iso);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

/* Months are handled as "YYYY-MM" keys: they sort, compare and shift without
   any timezone surprises, and they slice an ISO date with no parsing. */

export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isInMonth(iso: string, key: string): boolean {
  return iso.slice(0, 7) === key;
}

export function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return monthKey(d);
}

export function formatMonth(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const now = new Date();
  const label = `${MONTHS[month - 1]} ${year}`;
  return year === now.getFullYear() ? MONTHS[month - 1] : label;
}

export function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}
