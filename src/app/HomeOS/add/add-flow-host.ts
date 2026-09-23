import { Component, inject } from '@angular/core';
import { AddFlowService } from './add-flow.service';
import { AddAssetModal } from './add-asset-modal';
import { AddExpenseModal } from './add-expense-modal';
import { AddReminderModal } from './add-reminder-modal';
import { AddDocumentModal } from './add-document-modal';
import { AddRoomModal } from './add-room-modal';
import { SmartAddModal } from './smart-add-modal';

/* Rendered once in the Shell so any page or the topbar can open a flow
   through AddFlowService without owning the modal itself. */

@Component({
  selector: 'app-add-flow-host',
  imports: [
    AddAssetModal,
    AddExpenseModal,
    AddReminderModal,
    AddDocumentModal,
    AddRoomModal,
    SmartAddModal,
  ],
  template: `
    @switch (flow.active()) {
      @case ('Anything') {
        <app-smart-add-modal />
      }
      @case ('Asset') {
        <app-add-asset-modal />
      }
      @case ('Expense') {
        <app-add-expense-modal />
      }
      @case ('Reminder') {
        <app-add-reminder-modal />
      }
      @case ('Document') {
        <app-add-document-modal />
      }
      @case ('Room') {
        <app-add-room-modal />
      }
    }
  `,
})
export class AddFlowHost {
  flow = inject(AddFlowService);
}
