import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { Truncated } from '../tooltip/truncated.directive';
import { OverviewStat } from '../../core/models';

@Component({
  selector: 'app-overview-card',
  imports: [Icon, Truncated],
  templateUrl: './overview-card.html',
  styleUrl: './overview-card.css',
})
export class OverviewCard {
  stat = input.required<OverviewStat>();
}
