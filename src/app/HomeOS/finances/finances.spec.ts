import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FinancesPage } from './finances';
import { HomeApi, HomeSnapshot } from '../core/home-api';
import { HomeStore } from '../core/home-store';
import { Expense } from '../core/models';
import { monthKey, shiftMonth } from '../core/format';

/* The month is the frame for the whole page, and search deliberately steps
   outside it. Those two rules interact, which is where this gets subtle. */

function dateIn(monthsBack: number, day = 15): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsBack);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function expense(over: Partial<Expense> = {}): Expense {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'Power bill',
    amount: 1000,
    date: dateIn(0),
    category: 'Utilities',
    ...over,
  };
}

async function setup(expenses: Expense[]) {
  const snapshot: HomeSnapshot = {
    rooms: [{ id: 'k', name: 'Kitchen', image: '' }],
    assets: [
      { id: 'a1', name: 'LG Fridge', category: 'Appliances', roomId: 'k', history: [] },
    ],
    reminders: [],
    expenses,
    documents: [],
    activity: [],
  };

  const api = {
    async loadSnapshot() {
      return structuredClone(snapshot);
    },
    async deleteExpense(id: string) {
      return id;
    },
    async logActivity(entry: any) {
      return entry;
    },
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: HomeApi, useValue: api }],
  });

  await TestBed.inject(HomeStore).load();
  return TestBed.createComponent(FinancesPage).componentInstance;
}

describe('FinancesPage', () => {
  it('opens on the current month', async () => {
    const page = await setup([]);
    expect(page.month()).toBe(monthKey());
    expect(page.atCurrentMonth()).toBe(true);
  });

  it('totals only the selected month', async () => {
    const page = await setup([
      expense({ amount: 300 }),
      expense({ amount: 200 }),
      expense({ amount: 999, date: dateIn(1) }),
    ]);

    expect(page.monthlySpend()).toBe(500);
    expect(page.lastMonthSpend()).toBe(999);
    expect(page.inMonthCount()).toBe(2);
  });

  it('moves back a month and re-totals', async () => {
    const page = await setup([expense({ amount: 300 }), expense({ amount: 999, date: dateIn(1) })]);

    page.stepMonth(-1);

    expect(page.month()).toBe(shiftMonth(monthKey(), -1));
    expect(page.monthlySpend()).toBe(999);
    expect(page.atCurrentMonth()).toBe(false);
  });

  it('refuses to walk into the future', async () => {
    const page = await setup([]);
    page.stepMonth(1);
    expect(page.month()).toBe(monthKey());
  });

  it('comes back to the present', async () => {
    const page = await setup([]);
    page.stepMonth(-3);
    page.stepMonth(1);
    expect(page.month()).toBe(shiftMonth(monthKey(), -2));
  });

  it('reports the change against the previous month', async () => {
    const page = await setup([
      expense({ amount: 800 }),
      expense({ amount: 1000, date: dateIn(1) }),
    ]);

    expect(page.change()).toEqual({ diff: 20, lower: true });
  });

  it('has nothing to compare when last month was empty', async () => {
    const page = await setup([expense({ amount: 800 })]);
    expect(page.change()).toBeNull();
  });

  it('breaks the month down by share', async () => {
    const page = await setup([
      expense({ amount: 600, category: 'Utilities' }),
      expense({ amount: 400, category: 'Repairs' }),
    ]);

    expect(page.breakdown()).toEqual([
      { category: 'Utilities', amount: 600, percent: 60 },
      { category: 'Repairs', amount: 400, percent: 40 },
    ]);
  });

  it('lists the month, newest first', async () => {
    const page = await setup([
      expense({ id: 'early', date: dateIn(0, 2) }),
      expense({ id: 'late', date: dateIn(0, 27) }),
    ]);

    expect(page.filtered().map((e) => e.id)).toEqual(['late', 'early']);
  });

  it('searches every month, not just this one', async () => {
    const page = await setup([
      expense({ title: 'Plumber', date: dateIn(8) }),
      expense({ title: 'Power bill' }),
    ]);

    expect(page.filtered().length).toBe(1);

    page.onSearch('plumber');

    expect(page.searching()).toBe(true);
    expect(page.filtered().map((e) => e.title)).toEqual(['Plumber']);
  });

  it('finds an expense by its linked asset', async () => {
    const page = await setup([expense({ title: 'Repair', assetId: 'a1', date: dateIn(5) })]);

    page.onSearch('LG Fridge');

    expect(page.filtered().length).toBe(1);
  });

  it('keeps a category filter inside the month', async () => {
    const page = await setup([
      expense({ category: 'Repairs', amount: 100 }),
      expense({ category: 'Repairs', amount: 200, date: dateIn(2) }),
    ]);

    page.onCategory('Repairs');

    // Filtering narrows the month; it doesn't leave it.
    expect(page.searching()).toBe(false);
    expect(page.filtered().length).toBe(1);
    expect(page.listTitle()).toContain('Expenses in');
  });

  it('says how many matched once searching', async () => {
    const page = await setup([expense({ title: 'Plumber' }), expense({ title: 'Plumber again' })]);
    page.onSearch('plumber');

    expect(page.listTitle()).toBe('2 matching expenses');
  });

  it('pages instead of dumping every row', async () => {
    const many = Array.from({ length: 40 }, (_, i) => expense({ amount: i + 1 }));
    const page = await setup(many);

    expect(page.visible().length).toBe(15);
    expect(page.remaining()).toBe(25);

    page.showMore();
    expect(page.visible().length).toBe(30);

    page.showMore();
    expect(page.visible().length).toBe(40);
    expect(page.remaining()).toBe(0);
  });

  it('starts paging again after changing month or filter', async () => {
    const page = await setup(Array.from({ length: 40 }, () => expense()));
    page.showMore();
    expect(page.visible().length).toBe(30);

    page.stepMonth(-1);
    expect(page.visible().length).toBe(0);

    page.stepMonth(1);
    expect(page.visible().length).toBe(15);
  });

  it('totals what is on screen, not just the page shown', async () => {
    const page = await setup(Array.from({ length: 20 }, () => expense({ amount: 100 })));
    expect(page.listTotal()).toBe(2000);
  });

  it('suggests expense names and categories as you type', async () => {
    const page = await setup([expense({ title: 'Plumber visit' })]);

    page.onSearch('plum');

    const suggestions = page.suggestions();
    expect(suggestions.some((s) => s.label === 'Plumber visit')).toBe(true);
    expect(suggestions.length).toBeLessThanOrEqual(8);
  });

  it('applies a picked category as a filter rather than a search', async () => {
    const page = await setup([expense({ category: 'Repairs' })]);

    page.onSearch('rep');
    page.onSuggestion({ id: 'category:Repairs', label: 'Repairs', icon: 'tag' });

    expect(page.search()).toBe('');
    expect(page.categoryFilter()).toBe('Repairs');
  });

  it('clears both filters at once', async () => {
    const page = await setup([expense()]);
    page.onSearch('x');
    page.onCategory('Repairs');

    page.clearFilters();

    expect(page.search()).toBe('');
    expect(page.categoryFilter()).toBe('');
  });

  it('folds the tail into Other only when it saves a band', async () => {
    const five = await setup([
      expense({ category: 'Utilities', amount: 500 }),
      expense({ category: 'Repairs', amount: 400 }),
      expense({ category: 'Purchases', amount: 300 }),
      expense({ category: 'Services', amount: 200 }),
      expense({ category: 'Maintenance', amount: 100 }),
    ]);

    // Exactly five categories fit the ramp, so nothing is folded.
    expect(five.slices().length).toBe(5);
    expect(five.slices().some((s) => s.label === 'Other')).toBe(false);

    const six = await setup([
      expense({ category: 'Utilities', amount: 500 }),
      expense({ category: 'Repairs', amount: 400 }),
      expense({ category: 'Purchases', amount: 300 }),
      expense({ category: 'Services', amount: 200 }),
      expense({ category: 'Maintenance', amount: 100 }),
      expense({ category: 'Other', amount: 50 }),
    ]);

    expect(six.slices().length).toBe(5);
    const other = six.slices().find((s) => s.label === 'Other');
    expect(other?.value).toBe(150); // Maintenance + Other
  });

  it('has no ring when the month is empty', async () => {
    const page = await setup([]);
    expect(page.slices()).toEqual([]);
  });
});
