import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Icon } from '../shared/icon/icon';
import { StatusBadge } from '../shared/status-badge/status-badge';
import { EmptyState } from '../shared/empty-state/empty-state';
import { HomeStore, reminderBadge, warrantyBadge } from '../core/home-store';
import { AddFlowService } from '../add/add-flow.service';
import { ToastService } from '../shared/toast/toast';
import { DocumentViewerService } from '../shared/document-viewer/document-viewer.service';
import { CATEGORY_ICON } from '../core/models';
import { friendlyError } from '../core/errors';
import { daysUntil, formatCurrency, formatDate, relativeDay } from '../core/format';

@Component({
  selector: 'app-asset-detail',
  imports: [Icon, StatusBadge, EmptyState, RouterLink],
  templateUrl: './asset-detail.html',
  styleUrl: './asset-detail.css',
})
export class AssetDetail {
  private store = inject(HomeStore);
  private flow = inject(AddFlowService);
  private toasts = inject(ToastService);
  private viewer = inject(DocumentViewerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = this.store.loading;
  imageFailed = signal(false);
  removing = signal(false);

  private id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  readonly asset = computed(() => this.store.asset(this.id()));

  readonly roomName = computed(() => {
    const a = this.asset();
    return a ? this.store.roomName(a.roomId) : '';
  });

  readonly showImage = computed(() => !!this.asset()?.image && !this.imageFailed());
  readonly fallbackIcon = computed(() =>
    this.asset() ? CATEGORY_ICON[this.asset()!.category] : 'box',
  );
  readonly badge = computed(() => {
    const a = this.asset();
    return a ? warrantyBadge(a) : null;
  });

  readonly warrantyDays = computed(() => {
    const a = this.asset();
    return a?.warrantyExpiry ? daysUntil(a.warrantyExpiry) : null;
  });

  readonly documents = computed(() =>
    this.asset() ? this.store.documentsForAsset(this.asset()!.id) : [],
  );

  readonly reminders = computed(() =>
    this.asset()
      ? this.store
          .remindersForAsset(this.asset()!.id)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      : [],
  );

  readonly expenses = computed(() =>
    this.asset() ? this.store.expensesForAsset(this.asset()!.id) : [],
  );

  readonly history = computed(() =>
    [...(this.asset()?.history ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
  );

  money = formatCurrency;
  date = formatDate;
  relative = relativeDay;
  remBadge = reminderBadge;

  edit(): void {
    this.flow.edit('Asset', this.id());
  }

  editDocument(documentId: string): void {
    this.flow.edit('Document', documentId);
  }

  editReminder(reminderId: string): void {
    this.flow.edit('Reminder', reminderId);
  }

  editExpense(expenseId: string): void {
    this.flow.edit('Expense', expenseId);
  }

  addReminder(): void {
    this.flow.open('Reminder', { assetId: this.id() });
  }

  addDocument(): void {
    this.flow.open('Document', { assetId: this.id() });
  }

  /* Opens with every document on this asset, so the viewer's list can move
     between them without coming back here. */
  viewDocument(documentId: string): void {
    this.viewer.open(this.documents(), documentId);
  }

  addExpense(): void {
    this.flow.open('Expense', { assetId: this.id() });
  }

  async toggleReminder(reminderId: string): Promise<void> {
    try {
      await this.store.toggleReminder(reminderId);
    } catch (err) {
      this.toasts.error(friendlyError(err, "That didn't save."));
    }
  }

  async remove(): Promise<void> {
    const a = this.asset();
    if (!a || this.removing()) return;
    if (!confirm(`Remove ${a.name} from your inventory?`)) return;

    this.removing.set(true);
    try {
      await this.store.removeAsset(a.id);
      this.toasts.show(`${a.name} removed`, 'trash');
      this.router.navigate(['/inventory']);
    } catch (err) {
      // Stay on the page: the asset is still there, and now they know why.
      this.toasts.error(friendlyError(err, `${a.name} could not be removed.`));
    } finally {
      this.removing.set(false);
    }
  }
}
