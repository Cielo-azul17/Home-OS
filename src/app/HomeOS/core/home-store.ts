import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { HomeApi } from './home-api';
import { Supabase } from './backend/supabase-client';
import { SupabaseBackend } from './backend/supabase-backend';
import {
  ActivityEntry,
  Asset,
  AttentionEntry,
  Expense,
  ExpenseCategory,
  HomeDocument,
  IconName,
  OverviewStat,
  Reminder,
  ReminderState,
  Room,
  StatusBadgeModel,
} from './models';
import {
  daysUntil,
  formatCurrency,
  isSameMonth,
  monthsAgo,
  relativeDay,
} from './format';

/** A warranty inside this window counts as "expiring soon". */
const WARRANTY_SOON_DAYS = 30;
/** A reminder inside this window counts as "due" rather than "upcoming". */
const REMINDER_DUE_DAYS = 3;

export function warrantyBadge(asset: Asset): StatusBadgeModel | null {
  if (!asset.warrantyExpiry) return null;
  const days = daysUntil(asset.warrantyExpiry);
  if (days < 0) return { label: 'Warranty expired', tone: 'neutral' };
  if (days <= WARRANTY_SOON_DAYS)
    return { label: `Expiring · ${days}d left`, tone: 'warning' };
  return { label: `Warranty · ${days}d left`, tone: 'success' };
}

export function reminderState(reminder: Reminder): ReminderState {
  if (reminder.completed) return 'completed';
  const days = daysUntil(reminder.dueDate);
  if (days < 0) return 'overdue';
  if (days <= REMINDER_DUE_DAYS) return 'due';
  return 'upcoming';
}

export function reminderBadge(reminder: Reminder): StatusBadgeModel {
  switch (reminderState(reminder)) {
    case 'completed':
      return { label: 'Completed', tone: 'success' };
    case 'overdue':
      return { label: 'Overdue', tone: 'error' };
    case 'due':
      return { label: 'Due', tone: 'warning' };
    default:
      return { label: 'Upcoming', tone: 'neutral' };
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

@Injectable({ providedIn: 'root' })
export class HomeStore {
  private api = inject(HomeApi);
  private supabase = inject(Supabase);
  private backend = inject(SupabaseBackend);

  readonly rooms = signal<Room[]>([]);
  readonly assets = signal<Asset[]>([]);
  readonly reminders = signal<Reminder[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly documents = signal<HomeDocument[]>([]);
  readonly activity = signal<ActivityEntry[]>([]);
  readonly loading = signal(true);

  private loaded = false;

  /** Set when a load fails, so the UI can say so instead of looking empty. */
  readonly loadError = signal('');

  constructor() {
    if (!this.supabase.configured) {
      this.load();
      return;
    }

    /* With a project wired up, the data belongs to whoever is signed in —
       so the snapshot follows the session rather than the app's lifetime. */
    effect(() => {
      const user = this.supabase.user();
      if (!this.supabase.ready()) return;

      untracked(() => {
        this.backend.reset();
        this.clear();
        if (user) {
          void this.reload();
        } else {
          this.loading.set(false);
        }
      });
    });
  }

  /** Fetches once per session; later calls are no-ops. Use reload() to force. */
  async load(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    this.loading.set(true);
    this.loadError.set('');

    try {
      const snap = await this.api.loadSnapshot();
      this.rooms.set(snap.rooms);
      this.assets.set(snap.assets);
      this.reminders.set(snap.reminders);
      this.expenses.set(snap.expenses);
      this.documents.set(snap.documents);
      this.activity.set(snap.activity);
    } catch (err) {
      // A failed load must not leave the app spinning forever.
      this.loaded = false;
      this.loadError.set(
        err instanceof Error ? err.message : 'Could not reach your home data.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  /** Fetches again regardless of what was loaded before: a retry after a
      failure, and the switch to a different account's home. */
  async reload(): Promise<void> {
    this.loaded = false;
    await this.load();
  }

  private clear(): void {
    this.rooms.set([]);
    this.assets.set([]);
    this.reminders.set([]);
    this.expenses.set([]);
    this.documents.set([]);
    this.activity.set([]);
  }

  /* ---------- Lookups ---------- */

  room(id: string): Room | undefined {
    return this.rooms().find((r) => r.id === id);
  }

  roomName(id: string): string {
    return this.room(id)?.name ?? 'Unassigned';
  }

  asset(id: string): Asset | undefined {
    return this.assets().find((a) => a.id === id);
  }

  assetsInRoom(roomId: string): Asset[] {
    return this.assets().filter((a) => a.roomId === roomId);
  }

  documentsForAsset(assetId: string): HomeDocument[] {
    return this.documents().filter((d) => d.assetId === assetId);
  }

  remindersForAsset(assetId: string): Reminder[] {
    return this.reminders().filter((r) => r.assetId === assetId);
  }

  expensesForAsset(assetId: string): Expense[] {
    return this.expenses().filter((e) => e.assetId === assetId);
  }

  /* ---------- Derived ---------- */

  readonly roomSummaries = computed(() =>
    this.rooms().map((room) => ({
      ...room,
      assetCount: this.assets().filter((a) => a.roomId === room.id).length,
    })),
  );

  readonly openReminders = computed(() =>
    this.reminders()
      .filter((r) => !r.completed)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
  );

  readonly monthlySpend = computed(() =>
    this.expenses()
      .filter((e) => isSameMonth(e.date))
      .reduce((sum, e) => sum + e.amount, 0),
  );

  readonly lastMonthSpend = computed(() => {
    const ref = monthsAgo(1);
    return this.expenses()
      .filter((e) => isSameMonth(e.date, ref))
      .reduce((sum, e) => sum + e.amount, 0);
  });

  readonly spendByCategory = computed(() => {
    const totals = new Map<ExpenseCategory, number>();
    for (const e of this.expenses().filter((x) => isSameMonth(x.date))) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    }
    const total = this.monthlySpend();
    return [...totals.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        percent: total ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  readonly expiringWarranties = computed(() =>
    this.assets()
      .filter((a) => {
        if (!a.warrantyExpiry) return false;
        const d = daysUntil(a.warrantyExpiry);
        return d >= 0 && d <= WARRANTY_SOON_DAYS;
      })
      .sort((a, b) => a.warrantyExpiry!.localeCompare(b.warrantyExpiry!)),
  );

  readonly needsAttention = computed<AttentionEntry[]>(() => {
    const entries: AttentionEntry[] = [];

    for (const r of this.openReminders()) {
      const state = reminderState(r);
      if (state !== 'due' && state !== 'overdue') continue;
      entries.push({
        icon: r.assetId ? 'wrench' : 'receipt',
        title: r.title,
        context: r.assetId ? this.assetContext(r.assetId) : 'Household',
        status: state === 'overdue' ? relativeDay(r.dueDate) : relativeDay(r.dueDate),
        severity: state === 'overdue' ? 'error' : 'warning',
        link: '/reminders',
      });
    }

    for (const a of this.expiringWarranties()) {
      entries.push({
        icon: 'shield',
        title: `${a.name} warranty`,
        context: `${this.roomName(a.roomId)} · ${a.category}`,
        status: `Expires in ${daysUntil(a.warrantyExpiry!)} days`,
        severity: 'warning',
        link: `/inventory/${a.id}`,
      });
    }

    return entries;
  });

  readonly overviewStats = computed<OverviewStat[]>(() => {
    const spend = this.monthlySpend();
    const last = this.lastMonthSpend();
    const diff = last ? Math.round(((spend - last) / last) * 100) : 0;
    const dueSoon = this.openReminders().filter((r) => {
      const s = reminderState(r);
      return s === 'due' || s === 'overdue';
    }).length;

    return [
      {
        icon: 'box',
        value: String(this.assets().length),
        label: 'Assets',
        trend: { text: `${this.addedThisMonth()} this month`, tone: 'positive', direction: 'up' },
      },
      {
        icon: 'door',
        value: String(this.rooms().length),
        label: 'Rooms',
        trend: { text: '', tone: 'neutral', direction: 'none' },
      },
      {
        icon: 'bell',
        value: String(this.openReminders().length),
        label: 'Reminders',
        trend: {
          text: dueSoon ? `${dueSoon} need attention` : 'All clear',
          tone: dueSoon ? 'attention' : 'positive',
          direction: 'none',
        },
      },
      {
        icon: 'wallet',
        value: formatCurrency(spend),
        label: 'Spent this month',
        trend: {
          text: last ? `${Math.abs(diff)}% ${diff <= 0 ? 'lower' : 'higher'}` : '',
          tone: diff <= 0 ? 'positive' : 'attention',
          direction: diff <= 0 ? 'down' : 'up',
        },
      },
    ];
  });

  private addedThisMonth(): string {
    const n = this.assets().filter(
      (a) => a.purchaseDate && isSameMonth(a.purchaseDate),
    ).length;
    return n ? `+${n}` : 'No new';
  }

  private assetContext(assetId: string): string {
    const a = this.asset(assetId);
    return a ? `${this.roomName(a.roomId)} · ${a.name}` : 'Household';
  }

  /* ---------- Mutations ---------- */

  private logActivity(icon: IconName, title: string, context: string): void {
    const entry: ActivityEntry = {
      id: uid('ac'),
      icon,
      title,
      context,
      at: new Date().toISOString().slice(0, 10),
    };
    this.activity.update((list) => [entry, ...list]);
    // The log is a side effect of the real action, so it's never awaited.
    void this.api.logActivity(entry);
  }

  /* Every create takes the row the API hands BACK, not the draft it was
     given: a real backend issues the id, and a stored file comes back as a
     URL. Trusting the draft is what silently breaks when the mock is swapped
     for Postgres. */

  async addAsset(input: Omit<Asset, 'id' | 'history'>): Promise<Asset> {
    const draft: Asset = { ...input, id: uid('a'), history: [] };
    const asset = await this.api.createAsset(draft);
    this.assets.update((list) => [asset, ...list]);
    this.logActivity('box', `Added ${asset.name}`, this.roomName(asset.roomId));
    return asset;
  }

  async updateAsset(asset: Asset): Promise<void> {
    const saved = await this.api.updateAsset(asset);
    this.assets.update((list) => list.map((a) => (a.id === saved.id ? saved : a)));
    this.logActivity('edit', `Updated ${saved.name}`, this.roomName(saved.roomId));
  }

  async removeAsset(id: string): Promise<void> {
    const name = this.asset(id)?.name ?? 'asset';
    await this.api.deleteAsset(id);
    this.assets.update((list) => list.filter((a) => a.id !== id));
    this.logActivity('trash', `Removed ${name}`, 'Inventory');
  }

  async addReminder(input: Omit<Reminder, 'id' | 'completed'>): Promise<Reminder> {
    const draft: Reminder = { ...input, id: uid('r'), completed: false };
    const reminder = await this.api.createReminder(draft);
    this.reminders.update((list) => [...list, reminder]);
    this.logActivity('bell-plus', `Created a reminder`, reminder.title);
    return reminder;
  }

  async toggleReminder(id: string): Promise<void> {
    const found = this.reminders().find((r) => r.id === id);
    if (!found) return;
    const saved = await this.api.updateReminder({ ...found, completed: !found.completed });
    this.reminders.update((list) => list.map((r) => (r.id === id ? saved : r)));
    if (saved.completed) {
      this.logActivity('check-circle', `Completed ${saved.title}`, 'Reminders');
    }
  }

  /** A full edit, as opposed to toggleReminder's single flag. */
  async updateReminder(reminder: Reminder): Promise<void> {
    const saved = await this.api.updateReminder(reminder);
    this.reminders.update((list) => list.map((r) => (r.id === saved.id ? saved : r)));
    this.logActivity('edit', `Updated a reminder`, saved.title);
  }

  async removeReminder(id: string): Promise<void> {
    await this.api.deleteReminder(id);
    this.reminders.update((list) => list.filter((r) => r.id !== id));
  }

  async addExpense(input: Omit<Expense, 'id'>): Promise<Expense> {
    const draft: Expense = { ...input, id: uid('e') };
    const expense = await this.api.createExpense(draft);
    this.expenses.update((list) => [expense, ...list]);
    this.logActivity('receipt', `Logged ${expense.title}`, expense.category);
    return expense;
  }

  async updateExpense(expense: Expense): Promise<void> {
    const saved = await this.api.updateExpense(expense);
    this.expenses.update((list) => list.map((e) => (e.id === saved.id ? saved : e)));
    this.logActivity('edit', `Updated ${saved.title}`, saved.category);
  }

  async removeExpense(id: string): Promise<void> {
    await this.api.deleteExpense(id);
    this.expenses.update((list) => list.filter((e) => e.id !== id));
  }

  async addDocument(input: Omit<HomeDocument, 'id' | 'addedDate'>): Promise<HomeDocument> {
    const draft: HomeDocument = {
      ...input,
      id: uid('d'),
      addedDate: new Date().toISOString().slice(0, 10),
    };
    const doc = await this.api.createDocument(draft);
    this.documents.update((list) => [doc, ...list]);
    this.logActivity('file-plus', 'Added a new document', `${doc.kind} · ${doc.title}`);
    return doc;
  }

  /** Keeps the stored file — only the title, kind or link changes here. */
  async updateDocument(doc: HomeDocument): Promise<void> {
    const saved = await this.api.updateDocument(doc);
    this.documents.update((list) => list.map((d) => (d.id === saved.id ? saved : d)));
    this.logActivity('edit', `Updated ${saved.title}`, saved.kind);
  }

  async removeDocument(id: string): Promise<void> {
    await this.api.deleteDocument(id);
    this.documents.update((list) => list.filter((d) => d.id !== id));
  }

  async addRoom(name: string, image?: string): Promise<Room> {
    const draft: Room = { id: uid('room'), name, image: image ?? '' };
    const room = await this.api.createRoom(draft);
    this.rooms.update((list) => [...list, room]);
    this.logActivity('door', `Added ${room.name}`, 'Rooms');
    return room;
  }

  async updateRoom(room: Room): Promise<void> {
    const saved = await this.api.updateRoom(room);
    this.rooms.update((list) => list.map((r) => (r.id === saved.id ? saved : r)));
    this.logActivity('edit', `Renamed a room to ${saved.name}`, 'Rooms');
  }
}
