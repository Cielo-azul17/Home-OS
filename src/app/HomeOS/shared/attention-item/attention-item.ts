import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { Truncated } from '../tooltip/truncated.directive';
import { AttentionEntry } from '../../core/models';

@Component({
  selector: 'app-attention-item',
  imports: [Icon, Truncated],
  templateUrl: './attention-item.html',
  styleUrl: './attention-item.css',
})
export class AttentionItemComponent {
  item = input.required<AttentionEntry>();
}
