import { Component, inject } from '@angular/core';
import { Icon } from '../icon/icon';
import { AddFlowService } from '../../add/add-flow.service';

@Component({
  selector: 'app-ai-add-card',
  imports: [Icon],
  templateUrl: './ai-add-card.html',
  styleUrl: './ai-add-card.css',
})
export class AiAddCard {
  private flow = inject(AddFlowService);

  addWithPhoto(): void {
    this.flow.open('Anything');
  }

  addManually(): void {
    this.flow.open('Asset');
  }
}
