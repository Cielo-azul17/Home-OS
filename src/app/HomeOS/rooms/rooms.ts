import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../shared/page-header/page-header';
import { Icon } from '../shared/icon/icon';
import { HomeStore } from '../core/home-store';
import { AddFlowService } from '../add/add-flow.service';

@Component({
  selector: 'app-rooms',
  imports: [PageHeader, Icon, RouterLink],
  templateUrl: './rooms.html',
  styleUrl: './rooms.css',
})
export class RoomsPage {
  private store = inject(HomeStore);
  private flow = inject(AddFlowService);

  rooms = this.store.roomSummaries;
  loading = this.store.loading;

  addAsset(): void {
    this.flow.open('Asset');
  }

  addRoom(): void {
    this.flow.open('Room');
  }

  /* Stops the card's navigation — the pencil edits the room, it doesn't
     open it. */
  renameRoom(event: Event, roomId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.flow.edit('Room', roomId);
  }
}
