import { Component, computed, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from '../shared/icon/icon';
import { EmptyState } from '../shared/empty-state/empty-state';
import { Truncated } from '../shared/tooltip/truncated.directive';
import { NotificationsService } from '../core/notifications.service';
import { ScrollLock } from '../core/scroll-lock.service';
import { HomeNotification } from '../core/models';

type Filter = 'all' | 'unread' | 'action' | 'update';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'action', label: 'Needs action' },
  { id: 'update', label: 'Updates' },
];

interface NotificationSection {
  key: string;
  label: string;
  items: HomeNotification[];
}

/* Slides in over the right edge. Only rendered while open, so the scroll lock
   can simply follow the component's life. */

@Component({
  selector: 'app-notifications-panel',
  imports: [Icon, EmptyState, Truncated],
  templateUrl: './notifications-panel.html',
  styleUrl: './notifications-panel.css',
})
export class NotificationsPanel implements OnDestroy {
  private notifications = inject(NotificationsService);
  private scrollLock = inject(ScrollLock);
  private router = inject(Router);

  filters = FILTERS;
  filter = signal<Filter>('all');

  readonly unreadCount = this.notifications.unreadCount;
  readonly dismissedCount = this.notifications.dismissedCount;

  constructor() {
    this.scrollLock.lock();
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock();
  }

  readonly counts = computed(() => ({
    all: this.notifications.all().length,
    unread: this.notifications.unreadCount(),
    action: this.notifications.needsAction().length,
    update: this.notifications.updates().length,
  }));

  private readonly visible = computed(() => {
    switch (this.filter()) {
      case 'unread':
        return this.notifications.unread();
      case 'action':
        return this.notifications.needsAction();
      case 'update':
        return this.notifications.updates();
      default:
        return this.notifications.all();
    }
  });

  /* Two sections rather than date buckets: what the home needs from you is a
     different kind of thing from what it's telling you. */
  readonly sections = computed<NotificationSection[]>(() =>
    [
      {
        key: 'action',
        label: 'Needs action',
        items: this.visible().filter((n) => n.group === 'action'),
      },
      { key: 'update', label: 'Updates', items: this.visible().filter((n) => n.group === 'update') },
    ].filter((s) => s.items.length > 0),
  );

  readonly isEmpty = computed(() => this.sections().length === 0);

  readonly subtitle = computed(() => {
    const action = this.counts().action;
    if (!this.counts().all) return 'Everything is up to date';
    const unread = this.unreadCount();
    return `${unread} unread · ${action} ${action === 1 ? 'item needs' : 'items need'} action`;
  });

  isRead(id: string): boolean {
    return this.notifications.isRead(id);
  }

  setFilter(filter: Filter): void {
    this.filter.set(filter);
  }

  countFor(id: Filter): number {
    return this.counts()[id];
  }

  /** Following a notification means leaving this screen, so the panel goes. */
  open(notification: HomeNotification): void {
    this.notifications.markRead(notification.id);
    if (!notification.link) return;
    this.close();
    this.router.navigateByUrl(notification.link);
  }

  dismiss(event: Event, id: string): void {
    event.stopPropagation();
    this.notifications.dismiss(id);
  }

  markAllRead(): void {
    this.notifications.markAllRead();
  }

  restore(): void {
    this.notifications.restoreDismissed();
  }

  close(): void {
    this.notifications.closePanel();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  emptyMessage(): string {
    switch (this.filter()) {
      case 'unread':
        return 'You have read everything. New alerts show up here as warranties, reminders and bills come due.';
      case 'action':
        return 'No overdue reminders and no warranties running out.';
      case 'update':
        return 'No recent changes to report yet.';
      default:
        return 'HomeOS watches your reminders, warranties and spending, and tells you here when something needs you.';
    }
  }
}
