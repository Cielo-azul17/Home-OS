import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../shared/modal/modal';
import { HomeStore } from '../core/home-store';
import { ToastService } from '../shared/toast/toast';
import { AddFlowService } from './add-flow.service';
import { friendlyError } from '../core/errors';
import { Expense, EXPENSE_CATEGORIES, ExpenseCategory } from '../core/models';

@Component({
  selector: 'app-add-expense-modal',
  imports: [Modal, FormsModule],
  template: `
    <app-modal
      [title]="editing() ? 'Edit expense' : 'Log an expense'"
      subtitle="Keep a light record of what your home costs."
      (closed)="close()"
    >
      <div class="form">
        <div class="field">
          <label class="field-label" for="ex-title">What was it for?</label>
          <input id="ex-title" class="input" [(ngModel)]="title" placeholder="e.g. Electricity bill" />
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="ex-amount">Amount</label>
            <input id="ex-amount" class="input" type="number" [(ngModel)]="amount" placeholder="₹" />
          </div>
          <div class="field">
            <label class="field-label" for="ex-date">Date</label>
            <input id="ex-date" class="input" type="date" [(ngModel)]="date" />
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="ex-category">Category</label>
          <select id="ex-category" class="select" [(ngModel)]="category">
            @for (c of categories; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label class="field-label" for="ex-asset">Related asset</label>
          <select id="ex-asset" class="select" [(ngModel)]="assetId">
            <option value="">Not related to an asset</option>
            @for (asset of assets(); track asset.id) {
              <option [value]="asset.id">{{ asset.name }}</option>
            }
          </select>
        </div>
      </div>

      @if (saveError()) {
        <p class="save-error">{{ saveError() }}</p>
      }

      <ng-container modalFooter>
        <button type="button" class="btn btn-ghost" (click)="close()">Cancel</button>
        <button type="button" class="btn btn-primary" [disabled]="!canSave || saving()" (click)="save()">
          {{ saving() ? 'Saving…' : editing() ? 'Save changes' : 'Log expense' }}
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
export class AddExpenseModal implements OnInit {
  private store = inject(HomeStore);
  private toasts = inject(ToastService);
  private flow = inject(AddFlowService);

  categories = EXPENSE_CATEGORIES;
  assets = this.store.assets;
  saving = signal(false);
  saveError = signal('');

  title = '';
  amount: number | null = null;
  date = new Date().toISOString().slice(0, 10);
  category: ExpenseCategory = 'Utilities';
  assetId = '';

  editing = signal<Expense | null>(null);

  ngOnInit(): void {
    const { editId, assetId } = this.flow.options();
    const existing = editId
      ? this.store.expenses().find((e) => e.id === editId)
      : undefined;

    if (existing) {
      this.editing.set(existing);
      this.title = existing.title;
      this.amount = existing.amount;
      this.date = existing.date;
      this.category = existing.category;
      this.assetId = existing.assetId ?? '';
      return;
    }

    this.assetId = assetId ?? '';
  }

  get canSave(): boolean {
    return this.title.trim().length > 0 && !!this.amount && this.amount > 0;
  }

  async save(): Promise<void> {
    if (!this.canSave || this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');

    const fields = {
      title: this.title.trim(),
      amount: Number(this.amount),
      date: this.date,
      category: this.category,
      assetId: this.assetId || undefined,
    };

    try {
      const existing = this.editing();
      if (existing) {
        await this.store.updateExpense({ ...existing, ...fields });
      } else {
        await this.store.addExpense(fields);
      }
      this.toasts.show(existing ? 'Expense updated' : 'Expense logged', 'receipt');
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
