import { computed, inject, Injectable, signal } from '@angular/core';
import { HomeStore, reminderState } from './home-store';
import { HomeNotification } from './models';
import { daysUntil, formatCurrency, relativeDay } from './format';

/** Warranties inside this window are worth telling the user about. */
const WARRANTY_SOON_DAYS = 30;
/** Only recent history counts as news — older activity belongs in the log. */
const ACTIVITY_WINDOW_DAYS = 7;
/** Spending has to move by more than this before it's worth a notification. */
const SPEND_JUMP_PERCENT = 15;

/* Nothing here is persisted: notifications are a reading of the current data,
   so the read/dismissed sets live in memory alongside the rest of the store. */

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private store = inject(HomeStore);

  private readIds = signal<ReadonlySet<string>>(new Set());
  private dismissedIds = signal<ReadonlySet<string>>(new Set());

  /* A side panel rather than a page: notifications are something you glance
     at and act on, without losing the screen you were working in. */
  readonly panelOpen = signal(false);

  openPanel(): void {
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  togglePanel(): void {
    this.panelOpen.update((open) => !open);
  }

  /** Everything the home currently has to say, soonest or newest first. */
  readonly all = computed<HomeNotification[]>(() => {
    const dismissed = this.dismissedIds();
    return [
      ...this.reminderNotifications(),
      ...this.warrantyNotifications(),
      ...this.spendNotifications(),
      ...this.activityNotifications(),
    ]
      .filter((n) => !dismissed.has(n.id))
      .sort((a, b) => this.weight(a) - this.weight(b) || b.date.localeCompare(a.date));
  });

  readonly needsAction = computed(() => this.all().filter((n) => n.group === 'action'));
  readonly updates = computed(() => this.all().filter((n) => n.group === 'update'));

  readonly unread = computed(() => {
    const read = this.readIds();
    return this.all().filter((n) => !read.has(n.id));
  });

  readonly unreadCount = computed(() => this.unread().length);

  isRead(id: string): boolean {
    return this.readIds().has(id);
  }

  markRead(id: string): void {
    this.readIds.update((set) => new Set(set).add(id));
  }

  markAllRead(): void {
    this.readIds.set(new Set(this.all().map((n) => n.id)));
  }

  dismiss(id: string): void {
    this.dismissedIds.update((set) => new Set(set).add(id));
  }

  /** Brings back anything dismissed this session — the list is derived, so
      nothing was actually lost. */
  restoreDismissed(): void {
    this.dismissedIds.set(new Set());
  }

  readonly dismissedCount = computed(() => this.dismissedIds().size);

  /* ---------- Sources ---------- */

  /** Overdue first, then due soon: the two states that need a decision. */
  private reminderNotifications(): HomeNotification[] {
    const out: HomeNotification[] = [];

    for (const r of this.store.openReminders()) {
      const state = reminderState(r);
      if (state !== 'overdue' && state !== 'due') continue;

      out.push({
        id: `reminder:${r.id}`,
        group: 'action',
        icon: r.assetId ? 'wrench' : 'bell',
        title: r.title,
        context: this.assetContext(r.assetId),
        status: state === 'overdue' ? `Overdue · ${relativeDay(r.dueDate)}` : relativeDay(r.dueDate),
        severity: state === 'overdue' ? 'error' : 'warning',
        date: r.dueDate,
        link: '/reminders',
      });
    }

    return out;
  }

  private warrantyNotifications(): HomeNotification[] {
    const out: HomeNotification[] = [];

    for (const a of this.store.assets()) {
      if (!a.warrantyExpiry) continue;
      const days = daysUntil(a.warrantyExpiry);

      /* A warranty that lapsed this month still matters — it changes what the
         user can do about a fault today. */
      if (days < 0 && days >= -WARRANTY_SOON_DAYS) {
        out.push({
          id: `warranty-gone:${a.id}`,
          group: 'update',
          icon: 'shield',
          title: `${a.name} is out of warranty`,
          context: `${this.store.roomName(a.roomId)} · ${a.category}`,
          status: `Expired ${relativeDay(a.warrantyExpiry).toLowerCase()}`,
          severity: 'neutral',
          date: a.warrantyExpiry,
          link: `/inventory/${a.id}`,
        });
        continue;
      }

      if (days < 0 || days > WARRANTY_SOON_DAYS) continue;

      out.push({
        id: `warranty:${a.id}`,
        group: 'action',
        icon: 'shield',
        title: `${a.name} warranty ends soon`,
        context: `${this.store.roomName(a.roomId)} · ${a.category}`,
        status: days === 0 ? 'Expires today' : `${days} days left`,
        severity: days <= 7 ? 'error' : 'warning',
        date: a.warrantyExpiry,
        link: `/inventory/${a.id}`,
      });
    }

    return out;
  }

  /** One line on the month's spending, and only when it actually moved. */
  private spendNotifications(): HomeNotification[] {
    const spend = this.store.monthlySpend();
    const last = this.store.lastMonthSpend();
    if (!spend || !last) return [];

    const diff = Math.round(((spend - last) / last) * 100);
    if (Math.abs(diff) < SPEND_JUMP_PERCENT) return [];

    const up = diff > 0;
    return [
      {
        id: `spend:${new Date().toISOString().slice(0, 7)}`,
        group: 'update',
        icon: 'wallet',
        title: up ? 'Spending is up this month' : 'Spending is down this month',
        context: `${formatCurrency(spend)} so far · ${formatCurrency(last)} last month`,
        status: `${Math.abs(diff)}% ${up ? 'higher' : 'lower'}`,
        severity: up ? 'warning' : 'neutral',
        date: new Date().toISOString().slice(0, 10),
        link: '/finances',
      },
    ];
  }

  /** What the home recorded lately, so the screen isn't only bad news. */
  private activityNotifications(): HomeNotification[] {
    return this.store
      .activity()
      .filter((entry) => {
        const age = daysUntil(entry.at);
        return age <= 0 && age >= -ACTIVITY_WINDOW_DAYS;
      })
      .slice(0, 6)
      .map((entry) => ({
        id: `activity:${entry.id}`,
        group: 'update' as const,
        icon: entry.icon,
        title: entry.title,
        context: entry.context,
        status: relativeDay(entry.at),
        severity: 'neutral' as const,
        date: entry.at,
      }));
  }

  /* ---------- Helpers ---------- */

  /** Sort key: things to do outrank things to know, worst state first. */
  private weight(n: HomeNotification): number {
    if (n.group === 'update') return 3;
    return n.severity === 'error' ? 0 : 1;
  }

  private assetContext(assetId?: string): string {
    if (!assetId) return 'Household';
    const asset = this.store.asset(assetId);
    return asset ? `${this.store.roomName(asset.roomId)} · ${asset.name}` : 'Household';
  }
}
