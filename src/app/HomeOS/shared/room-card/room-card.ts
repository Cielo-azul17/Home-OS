import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';
import { Truncated } from '../tooltip/truncated.directive';
import { RoomSummary } from '../../core/models';

@Component({
  selector: 'app-room-card',
  imports: [Icon, RouterLink, Truncated],
  templateUrl: './room-card.html',
  styleUrl: './room-card.css',
})
export class RoomCard {
  room = input.required<RoomSummary>();
}
