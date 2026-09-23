import { Component, computed, input } from '@angular/core';
import { Truncated } from '../tooltip/truncated.directive';
import { Reminder } from '../../core/models';
import { formatDayMonth } from '../../core/format';
import { reminderBadge } from '../../core/home-store';

@Component({
  selector: 'app-reminder-item',
  imports: [Truncated],
  templateUrl: './reminder-item.html',
  styleUrl: './reminder-item.css',
})
export class ReminderItemComponent {
  item = input.required<Reminder>();
  context = input('');

  date = computed(() => formatDayMonth(this.item().dueDate));

  /* Design system, Reminder Card: title, related asset, date and a clear
     status of Upcoming / Due / Overdue / Completed. */
  badge = computed(() => reminderBadge(this.item()));
}
