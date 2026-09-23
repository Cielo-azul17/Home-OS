import { TestBed } from '@angular/core/testing';
import { HomeApi, HomeSnapshot } from './home-api';
import { HomeStore, reminderBadge, reminderState, warrantyBadge } from './home-store';
import { Asset, Expense, Reminder } from './models';

/* The store is where a warranty becomes a badge and a set of reminders
   becomes "needs attention", so these are the rules the whole UI reads. */

function iso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function monthsBack(months: number, day = 15): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function asset(over: Partial<Asset> = {}): Asset {
  return {
    id: 'a1',
    name: 'Fridge',
    category: 'Appliances',
    roomId: 'kitchen',
    history: [],
    ...over,
  };
}

function reminder(over: Partial<Reminder> = {}): Reminder {
  return {
    id: 'r1',
    title: 'Service the AC',
    dueDate: iso(10),
    repeat: 'none',
    completed: false,
    ...over,
  };
}

function expense(over: Partial<Expense> = {}): Expense {
  return { id: 'e1', title: 'Power bill', amount: 1000, date: iso(0), category: 'Utilities', ...over };
}

const EMPTY: HomeSnapshot = {
  rooms: [],
  assets: [],
  reminders: [],
  expenses: [],
  documents: [],
  activity: [],
};

/** Stands in for the network: records what it was asked, returns server rows. */
class FakeApi {
  snapshot: HomeSnapshot = structuredClone(EMPTY);
  calls: string[] = [];
  failNext = false;
  /** Mimics a backend that issues its own ids. */
  idPrefix = 'server-';
  private n = 0;

  private guard(name: string) {
    this.calls.push(name);
    if (this.failNext) {
      this.failNext = false;
      throw new Error('Failed to fetch');
    }
  }

  private withId<T extends { id: string }>(row: T): T {
    return { ...row, id: `${this.idPrefix}${++this.n}` };
  }

  async loadSnapshot() {
    this.guard('loadSnapshot');
    return structuredClone(this.snapshot);
  }
  async createAsset(a: Asset) { this.guard('createAsset'); return this.withId(a); }
  async updateAsset(a: Asset) { this.guard('updateAsset'); return a; }
  async deleteAsset(id: string) { this.guard('deleteAsset'); return id; }
  async createReminder(r: Reminder) { this.guard('createReminder'); return this.withId(r); }
  async updateReminder(r: Reminder) { this.guard('updateReminder'); return r; }
  async deleteReminder(id: string) { this.guard('deleteReminder'); return id; }
  async createExpense(e: Expense) { this.guard('createExpense'); return this.withId(e); }
  async updateExpense(e: Expense) { this.guard('updateExpense'); return e; }
  async deleteExpense(id: string) { this.guard('deleteExpense'); return id; }
  async createDocument(d: any) { this.guard('createDocument'); return this.withId(d); }
  async updateDocument(d: any) { this.guard('updateDocument'); return d; }
  async deleteDocument(id: string) { this.guard('deleteDocument'); return id; }
  async createRoom(r: any) { this.guard('createRoom'); return this.withId(r); }
  async updateRoom(r: any) { this.guard('updateRoom'); return r; }
  async logActivity(entry: any) { this.calls.push('logActivity'); return entry; }
}

function setup(snapshot: Partial<HomeSnapshot> = {}) {
  const api = new FakeApi();
  api.snapshot = { ...structuredClone(EMPTY), ...structuredClone(snapshot) };

  TestBed.configureTestingModule({
    providers: [{ provide: HomeApi, useValue: api }],
  });

  const store = TestBed.inject(HomeStore);
  return { store, api };
}

/* ---------- Pure badge rules ---------- */

describe('warrantyBadge', () => {
  it('is null without a warranty', () => {
    expect(warrantyBadge(asset())).toBeNull();
  });

  it('is neutral once expired', () => {
    expect(warrantyBadge(asset({ warrantyExpiry: iso(-1) }))).toEqual({
      label: 'Warranty expired',
      tone: 'neutral',
    });
  });

  it('warns inside the 30 day window', () => {
    expect(warrantyBadge(asset({ warrantyExpiry: iso(30) }))?.tone).toBe('warning');
    expect(warrantyBadge(asset({ warrantyExpiry: iso(1) }))?.tone).toBe('warning');
  });

  it('is calm outside it', () => {
    expect(warrantyBadge(asset({ warrantyExpiry: iso(31) }))?.tone).toBe('success');
  });

  it('expiring today still counts as active, not expired', () => {
    const badge = warrantyBadge(asset({ warrantyExpiry: iso(0) }));
    expect(badge?.tone).toBe('warning');
    expect(badge?.label).toContain('0d left');
  });
});

describe('reminderState', () => {
  it('prefers completed over any date', () => {
    expect(reminderState(reminder({ dueDate: iso(-30), completed: true }))).toBe('completed');
  });

  it('is overdue only in the past', () => {
    expect(reminderState(reminder({ dueDate: iso(-1) }))).toBe('overdue');
    expect(reminderState(reminder({ dueDate: iso(0) }))).toBe('due');
  });

  it('is due within three days', () => {
    expect(reminderState(reminder({ dueDate: iso(3) }))).toBe('due');
    expect(reminderState(reminder({ dueDate: iso(4) }))).toBe('upcoming');
  });

  it('maps each state to a tone', () => {
    expect(reminderBadge(reminder({ dueDate: iso(-1) })).tone).toBe('error');
    expect(reminderBadge(reminder({ dueDate: iso(1) })).tone).toBe('warning');
    expect(reminderBadge(reminder({ dueDate: iso(30) })).tone).toBe('neutral');
    expect(reminderBadge(reminder({ completed: true })).tone).toBe('success');
  });
});

/* ---------- Derived selectors ---------- */

describe('HomeStore selectors', () => {
  it('loads a snapshot', async () => {
    const { store } = setup({ assets: [asset()], rooms: [{ id: 'kitchen', name: 'Kitchen', image: '' }] });
    await store.load();

    expect(store.assets().length).toBe(1);
    expect(store.loading()).toBe(false);
    expect(store.roomName('kitchen')).toBe('Kitchen');
  });

  it('names an unknown room rather than showing a blank', async () => {
    const { store } = setup();
    await store.load();
    expect(store.roomName('nope')).toBe('Unassigned');
  });

  it('sorts open reminders by date and drops completed ones', async () => {
    const { store } = setup({
      reminders: [
        reminder({ id: 'late', dueDate: iso(20) }),
        reminder({ id: 'done', dueDate: iso(1), completed: true }),
        reminder({ id: 'soon', dueDate: iso(2) }),
      ],
    });
    await store.load();

    expect(store.openReminders().map((r) => r.id)).toEqual(['soon', 'late']);
  });

  it('counts only this month toward monthly spend', async () => {
    const { store } = setup({
      expenses: [
        expense({ id: 'now', amount: 500, date: iso(0) }),
        expense({ id: 'old', amount: 900, date: monthsBack(1) }),
      ],
    });
    await store.load();

    expect(store.monthlySpend()).toBe(500);
    expect(store.lastMonthSpend()).toBe(900);
  });

  it('breaks spending down by share of the month', async () => {
    const { store } = setup({
      expenses: [
        expense({ id: '1', amount: 750, category: 'Utilities' }),
        expense({ id: '2', amount: 250, category: 'Repairs' }),
      ],
    });
    await store.load();

    expect(store.spendByCategory()).toEqual([
      { category: 'Utilities', amount: 750, percent: 75 },
      { category: 'Repairs', amount: 250, percent: 25 },
    ]);
  });

  it('finds warranties inside the window, soonest first', async () => {
    const { store } = setup({
      assets: [
        asset({ id: 'far', warrantyExpiry: iso(200) }),
        asset({ id: 'soon', warrantyExpiry: iso(5) }),
        asset({ id: 'gone', warrantyExpiry: iso(-5) }),
        asset({ id: 'mid', warrantyExpiry: iso(20) }),
      ],
    });
    await store.load();

    expect(store.expiringWarranties().map((a) => a.id)).toEqual(['soon', 'mid']);
  });

  it('surfaces overdue reminders and expiring warranties as attention', async () => {
    const { store } = setup({
      reminders: [
        reminder({ id: 'overdue', dueDate: iso(-2) }),
        reminder({ id: 'later', dueDate: iso(40) }),
      ],
      assets: [asset({ id: 'tv', name: 'TV', warrantyExpiry: iso(10) })],
    });
    await store.load();

    const attention = store.needsAttention();
    expect(attention.length).toBe(2);
    expect(attention[0].severity).toBe('error');
    expect(attention[1].title).toBe('TV warranty');
    // Every entry carries somewhere to go.
    expect(attention.every((entry) => !!entry.link)).toBe(true);
  });

  it('reports all clear when nothing is due', async () => {
    const { store } = setup({ reminders: [reminder({ dueDate: iso(40) })] });
    await store.load();

    expect(store.needsAttention()).toEqual([]);
    const reminders = store.overviewStats().find((s) => s.label === 'Reminders');
    expect(reminders?.trend.text).toBe('All clear');
  });

  it('counts assets and rooms in the overview', async () => {
    const { store } = setup({
      assets: [asset({ id: 'a' }), asset({ id: 'b' })],
      rooms: [{ id: 'k', name: 'Kitchen', image: '' }],
    });
    await store.load();

    const stats = store.overviewStats();
    expect(stats.find((s) => s.label === 'Assets')?.value).toBe('2');
    expect(stats.find((s) => s.label === 'Rooms')?.value).toBe('1');
  });

  it('counts assets per room', async () => {
    const { store } = setup({
      rooms: [
        { id: 'k', name: 'Kitchen', image: '' },
        { id: 'b', name: 'Bedroom', image: '' },
      ],
      assets: [asset({ id: '1', roomId: 'k' }), asset({ id: '2', roomId: 'k' })],
    });
    await store.load();

    const summaries = store.roomSummaries();
    expect(summaries.find((r) => r.id === 'k')?.assetCount).toBe(2);
    expect(summaries.find((r) => r.id === 'b')?.assetCount).toBe(0);
  });
});

/* ---------- Mutations ---------- */

describe('HomeStore mutations', () => {
  it('keeps the id the backend issued, not the local draft id', async () => {
    const { store } = setup();
    await store.load();

    const created = await store.addAsset({
      name: 'Washer',
      category: 'Appliances',
      roomId: 'utility',
    });

    expect(created.id).toBe('server-1');
    // The list must hold the server's row, or the next edit hits nothing.
    expect(store.assets()[0].id).toBe('server-1');
  });

  it('uses server rows for every kind of record', async () => {
    const { store } = setup();
    await store.load();

    const reminder = await store.addReminder({ title: 'Service', dueDate: iso(3), repeat: 'none' });
    const expense = await store.addExpense({
      title: 'Gas',
      amount: 100,
      date: iso(0),
      category: 'Utilities',
    });
    const room = await store.addRoom('Study');

    expect([reminder.id, expense.id, room.id].every((id) => id.startsWith('server-'))).toBe(true);
    expect(store.reminders()[0].id).toBe(reminder.id);
    expect(store.expenses()[0].id).toBe(expense.id);
  });

  it('logs activity for a create', async () => {
    const { store } = setup({ rooms: [{ id: 'k', name: 'Kitchen', image: '' }] });
    await store.load();

    await store.addAsset({ name: 'Kettle', category: 'Kitchen', roomId: 'k' });

    expect(store.activity()[0].title).toBe('Added Kettle');
    expect(store.activity()[0].context).toBe('Kitchen');
  });

  it('removes an asset from the list', async () => {
    const { store } = setup({ assets: [asset({ id: 'a1' })] });
    await store.load();

    await store.removeAsset('a1');
    expect(store.assets()).toEqual([]);
  });

  it('toggles a reminder both ways', async () => {
    const { store } = setup({ reminders: [reminder({ id: 'r1' })] });
    await store.load();

    await store.toggleReminder('r1');
    expect(store.reminders()[0].completed).toBe(true);

    await store.toggleReminder('r1');
    expect(store.reminders()[0].completed).toBe(false);
  });

  it('replaces a record on update rather than duplicating it', async () => {
    const { store } = setup({ assets: [asset({ id: 'a1', name: 'Old' })] });
    await store.load();

    await store.updateAsset({ ...asset({ id: 'a1' }), name: 'New' });

    expect(store.assets().length).toBe(1);
    expect(store.assets()[0].name).toBe('New');
  });

  /* The critical one: a failed write must not look like it worked. */
  it('leaves state untouched when a save fails', async () => {
    const { store, api } = setup({ assets: [asset({ id: 'a1' })] });
    await store.load();

    api.failNext = true;
    await expect(
      store.addAsset({ name: 'Ghost', category: 'Other', roomId: 'k' }),
    ).rejects.toThrow('Failed to fetch');

    expect(store.assets().length).toBe(1);
    expect(store.assets().some((a) => a.name === 'Ghost')).toBe(false);
  });

  it('keeps a reminder ticked as it was when the toggle fails', async () => {
    const { store, api } = setup({ reminders: [reminder({ id: 'r1', completed: false })] });
    await store.load();

    api.failNext = true;
    await expect(store.toggleReminder('r1')).rejects.toThrow();

    expect(store.reminders()[0].completed).toBe(false);
  });

  it('reports a failed load instead of spinning forever', async () => {
    const { store, api } = setup();
    await store.load();

    api.failNext = true;
    await store.reload();

    expect(store.loading()).toBe(false);
    expect(store.loadError()).toBeTruthy();
  });

  it('can retry after a failed load', async () => {
    const { store, api } = setup({ assets: [asset()] });
    await store.load();

    api.failNext = true;
    await store.reload();
    expect(store.loadError()).toBeTruthy();

    await store.reload();

    expect(store.loadError()).toBe('');
    expect(store.assets().length).toBe(1);
  });

  it('load() is a no-op once loaded, reload() is not', async () => {
    const { store, api } = setup();
    await store.load();
    const first = api.calls.filter((c) => c === 'loadSnapshot').length;

    await store.load();
    expect(api.calls.filter((c) => c === 'loadSnapshot').length).toBe(first);

    await store.reload();
    expect(api.calls.filter((c) => c === 'loadSnapshot').length).toBe(first + 1);
  });
});
