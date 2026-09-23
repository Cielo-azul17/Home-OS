import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../shared/modal/modal';
import { HomeStore } from '../core/home-store';
import { ToastService } from '../shared/toast/toast';
import { AddFlowService } from './add-flow.service';
import { friendlyError } from '../core/errors';
import { Reminder } from '../core/models';

@Component({
  selector: 'app-add-reminder-modal',
  imports: [Modal, FormsModule],
  template: `
    <app-modal
      [title]="editing() ? 'Edit reminder' : 'New reminder'"
      subtitle="Stay ahead of services, bills and maintenance."
      (closed)="close()"
    >
      <div class="form">
        <div class="field">
          <label class="field-label" for="rm-title">Title</label>
          <input id="rm-title" class="input" [(ngModel)]="title" placeholder="e.g. AC filter cleaning" />
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="rm-date">Due date</label>
            <input id="rm-date" class="input" type="date" [(ngModel)]="dueDate" />
          </div>
          <div class="field">
            <label class="field-label" for="rm-repeat">Repeats</label>
            <select id="rm-repeat" class="select" [(ngModel)]="repeat">
              <option value="none">Does not repeat</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="rm-asset">Related asset</label>
          <select id="rm-asset" class="select" [(ngModel)]="assetId">
            <option value="">Not related to an asset</option>
            @for (asset of assets(); track asset.id) {
              <option [value]="asset.id">{{ asset.name }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label class="field-label" for="rm-notes">Notes</label>
          <textarea id="rm-notes" class="textarea" [(ngModel)]="notes" placeholder="Optional"></textarea>
        </div>
      </div>

      @if (saveError()) {
        <p class="save-error">{{ saveError() }}</p>
      }

      <ng-container modalFooter>
        <button type="button" class="btn btn-ghost" (click)="close()">Cancel</button>
        <button type="button" class="btn btn-primary" [disabled]="!canSave || saving()" (click)="save()">
          {{ saving() ? 'Saving…' : editing() ? 'Save changes' : 'Create reminder' }}
        </button>
      </ng-container>
    </app-modal>
  `,
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-16);
    }
  `,
})
export class AddReminderModal implements OnInit {
  private store = inject(HomeStore);
  private toasts = inject(ToastService);
  private flow = inject(AddFlowService);

  assets = this.store.assets;
  saving = signal(false);
  saveError = signal('');

  title = '';
  dueDate = '';
  repeat: Reminder['repeat'] = 'none';
  assetId = '';
  notes = '';

  editing = signal<Reminder | null>(null);

  ngOnInit(): void {
    const { editId, assetId } = this.flow.options();
    const existing = editId
      ? this.store.reminders().find((r) => r.id === editId)
      : undefined;

    if (existing) {
      this.editing.set(existing);
      this.title = existing.title;
      this.dueDate = existing.dueDate;
      this.repeat = existing.repeat;
      this.assetId = existing.assetId ?? '';
      this.notes = existing.notes ?? '';
      return;
    }

    this.assetId = assetId ?? '';
    const d = new Date();
    d.setDate(d.getDate() + 7);
    this.dueDate = d.toISOString().slice(0, 10);
  }

  get canSave(): boolean {
    return this.title.trim().length > 0 && !!this.dueDate;
  }

  async save(): Promise<void> {
    if (!this.canSave || this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');

    const fields = {
      title: this.title.trim(),
      dueDate: this.dueDate,
      repeat: this.repeat,
      assetId: this.assetId || undefined,
      notes: this.notes.trim() || undefined,
    };

    try {
      const existing = this.editing();
      if (existing) {
        await this.store.updateReminder({ ...existing, ...fields });
      } else {
        await this.store.addReminder(fields);
      }
      this.toasts.show(existing ? 'Reminder updated' : 'Reminder created', 'bell-plus');
      this.flow.close();
    } catch (err) {
      this.saveError.set(friendlyError(err));
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    this.flow.close();
  }
}
