import { Component, computed, inject } from '@angular/core';
import { PageHeader } from '../shared/page-header/page-header';
import { Icon } from '../shared/icon/icon';
import { EmptyState } from '../shared/empty-state/empty-state';
import { StatusBadge } from '../shared/status-badge/status-badge';
import { HomeStore, reminderBadge, reminderState } from '../core/home-store';
import { AddFlowService } from '../add/add-flow.service';
import { ToastService } from '../shared/toast/toast';
import { ConfirmService } from '../shared/confirm.service';
import { friendlyError } from '../core/errors';
import { Reminder, ReminderState } from '../core/models';
import { formatDayMonth, relativeDay } from '../core/format';

interface ReminderGroup {
  state: ReminderState;
  label: string;
  items: Reminder[];
}

const GROUP_ORDER: { state: ReminderState; label: string }[] = [
  { state: 'overdue', label: 'Overdue' },
  { state: 'due', label: 'Due soon' },
  { state: 'upcoming', label: 'Upcoming' },
  { state: 'completed', label: 'Completed' },
];

@Component({
  selector: 'app-reminders',
  imports: [PageHeader, Icon, EmptyState, StatusBadge],
  templateUrl: './reminders.html',
  styleUrl: './reminders.css',
})
export class RemindersPage {
  private store = inject(HomeStore);
  private flow = inject(AddFlowService);
  private toasts = inject(ToastService);
  private confirm = inject(ConfirmService);

  loading = this.store.loading;

  readonly groups = computed<ReminderGroup[]>(() => {
    const all = [...this.store.reminders()].sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate),
    );
    return GROUP_ORDER.map(({ state, label }) => ({
      state,
      label,
      items: all.filter((r) => reminderState(r) === state),
    })).filter((g) => g.items.length > 0);
  });

  readonly total = computed(() => this.store.openReminders().length);

  badge = reminderBadge;
  dayMonth = formatDayMonth;
  relative = relativeDay;

  assetName(assetId?: string): string {
    if (!assetId) return 'Household';
    const asset = this.store.asset(assetId);
    return asset ? `${this.store.roomName(asset.roomId)} · ${asset.name}` : 'Household';
  }

  async toggle(id: string): Promise<void> {
    try {
      await this.store.toggleReminder(id);
    } catch (err) {
      // The tick stays as it was — the store only updates on success.
      this.toasts.error(friendlyError(err, "That didn't save."));
    }
  }

  edit(id: string): void {
    this.flow.edit('Reminder', id);
  }

  async remove(id: string): Promise<void> {
    const title = this.store.reminders().find((r) => r.id === id)?.title ?? 'Reminder';

    const confirmed = await this.confirm.confirm({
      title: 'Delete Reminder',
      message: `Permanently delete "${title}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      await this.store.removeReminder(id);
      this.toasts.show(`${title} deleted`, 'trash');
    } catch (err) {
      this.toasts.error(friendlyError(err, `${title} could not be deleted.`));
    }
  }

  addReminder(): void {
    this.flow.open('Reminder');
  }
}
