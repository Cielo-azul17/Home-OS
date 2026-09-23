import { TestBed } from '@angular/core/testing';
import { HomeApi, HomeSnapshot } from './home-api';
import { HomeStore } from './home-store';
import { NotificationsService } from './notifications.service';
import { Asset, Expense, Reminder } from './models';

/* Notifications are derived, never stored — so these tests are really about
   whether the right things reach the bell, in the right order. */

function iso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function lastMonth(day = 15): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const EMPTY: HomeSnapshot = {
  rooms: [{ id: 'k', name: 'Kitchen', image: '' }],
  assets: [],
  reminders: [],
  expenses: [],
  documents: [],
  activity: [],
};

function asset(over: Partial<Asset> = {}): Asset {
  return { id: 'a1', name: 'Fridge', category: 'Appliances', roomId: 'k', history: [], ...over };
}

function reminder(over: Partial<Reminder> = {}): Reminder {
  return { id: 'r1', title: 'Service', dueDate: iso(1), repeat: 'none', completed: false, ...over };
}

function expense(over: Partial<Expense> = {}): Expense {
  return { id: 'e1', title: 'Power', amount: 1000, date: iso(0), category: 'Utilities', ...over };
}

async function setup(snapshot: Partial<HomeSnapshot> = {}) {
  let n = 0;
  const withId = <T extends { id: string }>(row: T): T => ({ ...row, id: `server-${++n}` });

  const api = {
    async loadSnapshot() {
      return { ...structuredClone(EMPTY), ...structuredClone(snapshot) };
    },
    async createAsset(a: any) { return withId(a); },
    async updateAsset(a: any) { return a; },
    async deleteAsset(id: string) { return id; },
    async createReminder(r: any) { return withId(r); },
    async updateReminder(r: any) { return r; },
    async deleteReminder(id: string) { return id; },
    async createExpense(e: any) { return withId(e); },
    async updateExpense(e: any) { return e; },
    async deleteExpense(id: string) { return id; },
    async createDocument(d: any) { return withId(d); },
    async updateDocument(d: any) { return d; },
    async deleteDocument(id: string) { return id; },
    async createRoom(r: any) { return withId(r); },
    async updateRoom(r: any) { return r; },
    async logActivity(entry: any) { return entry; },
  };

  // Lets a single test build two independent homes to compare.
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: HomeApi, useValue: api }] });

  const store = TestBed.inject(HomeStore);
  await store.load();
  return { store, notifications: TestBed.inject(NotificationsService) };
}

describe('NotificationsService', () => {
  it('says nothing about a quiet home', async () => {
    const { notifications } = await setup();
    expect(notifications.all()).toEqual([]);
    expect(notifications.unreadCount()).toBe(0);
  });

  it('raises overdue reminders as action, in red', async () => {
    const { notifications } = await setup({ reminders: [reminder({ dueDate: iso(-3) })] });

    const [item] = notifications.all();
    expect(item.group).toBe('action');
    expect(item.severity).toBe('error');
    expect(item.status).toContain('Overdue');
    expect(item.link).toBe('/reminders');
  });

  it('ignores reminders that are neither due nor overdue', async () => {
    const { notifications } = await setup({ reminders: [reminder({ dueDate: iso(40) })] });
    expect(notifications.all()).toEqual([]);
  });

  it('ignores completed reminders however late', async () => {
    const { notifications } = await setup({
      reminders: [reminder({ dueDate: iso(-30), completed: true })],
    });
    expect(notifications.all()).toEqual([]);
  });

  it('warns about a warranty inside 30 days and shouts inside 7', async () => {
    const { notifications } = await setup({
      assets: [asset({ id: 'far', warrantyExpiry: iso(20) }), asset({ id: 'near', warrantyExpiry: iso(3) })],
    });

    const near = notifications.all().find((n) => n.id === 'warranty:near');
    const far = notifications.all().find((n) => n.id === 'warranty:far');

    expect(near?.severity).toBe('error');
    expect(far?.severity).toBe('warning');
    expect(far?.group).toBe('action');
  });

  it('mentions a warranty that lapsed this month as an update, not an action', async () => {
    const { notifications } = await setup({ assets: [asset({ warrantyExpiry: iso(-10) })] });

    const [item] = notifications.all();
    expect(item.id).toContain('warranty-gone');
    expect(item.group).toBe('update');
    expect(item.severity).toBe('neutral');
  });

  it('forgets a warranty that lapsed long ago', async () => {
    const { notifications } = await setup({ assets: [asset({ warrantyExpiry: iso(-120) })] });
    expect(notifications.all()).toEqual([]);
  });

  it('puts what needs doing above what is merely news', async () => {
    const { notifications } = await setup({
      assets: [asset({ warrantyExpiry: iso(-5) })],
      reminders: [reminder({ dueDate: iso(-1) })],
    });

    const groups = notifications.all().map((n) => n.group);
    expect(groups[0]).toBe('action');
    expect(groups[groups.length - 1]).toBe('update');
  });

  it('flags a spending jump but stays quiet about a small drift', async () => {
    const big = await setup({
      expenses: [expense({ id: '1', amount: 2000 }), expense({ id: '2', amount: 1000, date: lastMonth() })],
    });
    expect(big.notifications.all().some((n) => n.id.startsWith('spend:'))).toBe(true);

    const small = await setup({
      expenses: [expense({ id: '1', amount: 1050 }), expense({ id: '2', amount: 1000, date: lastMonth() })],
    });
    expect(small.notifications.all().some((n) => n.id.startsWith('spend:'))).toBe(false);
  });

  it('cannot divide by a month with no spending', async () => {
    const { notifications } = await setup({ expenses: [expense({ amount: 500 })] });
    expect(notifications.all().some((n) => n.id.startsWith('spend:'))).toBe(false);
  });

  it('reports recent activity but not old activity', async () => {
    const { notifications } = await setup({
      activity: [
        { id: 'new', icon: 'box', title: 'Added a TV', context: 'Living room', at: iso(-2) },
        { id: 'old', icon: 'box', title: 'Added a lamp', context: 'Study', at: iso(-30) },
      ],
    });

    const ids = notifications.all().map((n) => n.id);
    expect(ids).toContain('activity:new');
    expect(ids).not.toContain('activity:old');
  });

  it('marks one as read without touching the rest', async () => {
    const { notifications } = await setup({
      reminders: [reminder({ id: 'r1', dueDate: iso(-1) }), reminder({ id: 'r2', dueDate: iso(-2) })],
    });

    expect(notifications.unreadCount()).toBe(2);
    notifications.markRead('reminder:r1');

    expect(notifications.isRead('reminder:r1')).toBe(true);
    expect(notifications.isRead('reminder:r2')).toBe(false);
    expect(notifications.unreadCount()).toBe(1);
  });

  it('marks everything read at once', async () => {
    const { notifications } = await setup({
      reminders: [reminder({ id: 'r1', dueDate: iso(-1) }), reminder({ id: 'r2', dueDate: iso(-2) })],
    });

    notifications.markAllRead();
    expect(notifications.unreadCount()).toBe(0);
    // Still listed — read is not dismissed.
    expect(notifications.all().length).toBe(2);
  });

  it('hides a dismissed notification and can bring it back', async () => {
    const { notifications } = await setup({ reminders: [reminder({ id: 'r1', dueDate: iso(-1) })] });

    notifications.dismiss('reminder:r1');
    expect(notifications.all()).toEqual([]);
    expect(notifications.dismissedCount()).toBe(1);

    notifications.restoreDismissed();
    expect(notifications.all().length).toBe(1);
  });

  it('splits action from update', async () => {
    const { notifications } = await setup({
      reminders: [reminder({ dueDate: iso(-1) })],
      activity: [{ id: 'x', icon: 'box', title: 'Added a TV', context: '', at: iso(-1) }],
    });

    expect(notifications.needsAction().length).toBe(1);
    expect(notifications.updates().length).toBe(1);
  });

  it('follows the store, so a new record shows up unread', async () => {
    const { store, notifications } = await setup();
    expect(notifications.unreadCount()).toBe(0);

    await store.addReminder({ title: 'Urgent', dueDate: iso(-1), repeat: 'none' });

    expect(notifications.needsAction().length).toBe(1);
    expect(notifications.unreadCount()).toBeGreaterThan(0);
  });

  it('names the room and asset a reminder belongs to', async () => {
    const { notifications } = await setup({
      assets: [asset({ id: 'a1', name: 'Fridge', roomId: 'k' })],
      reminders: [reminder({ assetId: 'a1', dueDate: iso(-1) })],
    });

    expect(notifications.all()[0].context).toBe('Kitchen · Fridge');
  });

  it('calls an unlinked reminder household', async () => {
    const { notifications } = await setup({ reminders: [reminder({ dueDate: iso(-1) })] });
    expect(notifications.all()[0].context).toBe('Household');
  });
});
