import { Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { Truncated } from '../tooltip/truncated.directive';
import { ActivityEntry } from '../../core/models';
import { relativeDay } from '../../core/format';

@Component({
  selector: 'app-activity-item',
  imports: [Icon, Truncated],
  templateUrl: './activity-item.html',
  styleUrl: './activity-item.css',
})
export class ActivityItemComponent {
  item = input.required<ActivityEntry>();

  timestamp = computed(() => relativeDay(this.item().at));
}
