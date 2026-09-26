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
import { ConfirmService } from '../shared/confirm.service';
import { DocumentViewerService } from '../shared/document-viewer/document-viewer.service';
import { RequestServiceModal } from '../add/request-service-modal';
import { ProviderSearch } from '../add/provider-search';
import { ServiceTracking } from './service-tracking';
import { CATEGORY_ICON, ServiceRequest, ServiceProvider, ServiceType } from '../core/models';
import { friendlyError } from '../core/errors';
import { daysUntil, formatCurrency, formatDate, relativeDay } from '../core/format';

@Component({
  selector: 'app-asset-detail',
  imports: [Icon, StatusBadge, EmptyState, RouterLink, RequestServiceModal, ProviderSearch, ServiceTracking],
  templateUrl: './asset-detail.html',
  styleUrl: './asset-detail.css',
})
export class AssetDetail {
  private store = inject(HomeStore);
  private flow = inject(AddFlowService);
  private toasts = inject(ToastService);
  private confirm = inject(ConfirmService);
  private viewer = inject(DocumentViewerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = this.store.loading;
  imageFailed = signal(false);
  removing = signal(false);

  // V2 Service Request flow
  showServiceModal = signal(false);
  showProviderSearch = signal(false);
  showServiceTracking = signal(false);
  serviceRequest = signal<ServiceRequest | null>(null);
  providers = signal<ServiceProvider[]>([]);
  selectedProvider = signal<ServiceProvider | null>(null);

  id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
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

  requestService(): void {
    this.showServiceModal.set(true);
  }

  async onServiceRequestSubmitted(data: {
    type: ServiceType;
    description: string;
    budgetRange: string;
    preferredTime: string;
  }): Promise<void> {
    try {
      const request = await this.store.createServiceRequest({
        assetId: this.id(),
        type: data.type,
        description: data.description,
        budgetRange: data.budgetRange,
        preferredTime: data.preferredTime,
      });
      this.serviceRequest.set(request);
      this.showServiceModal.set(false);

      // Search providers
      const foundProviders = await this.store.searchProviders(
        this.roomName(),
        data.type,
      );
      this.providers.set(foundProviders);
      this.showProviderSearch.set(true);
    } catch (err) {
      this.toasts.error(
        friendlyError(err, 'Could not create service request'),
      );
    }
  }

  async onProviderSelected(provider: ServiceProvider): Promise<void> {
    const request = this.serviceRequest();
    if (!request) return;

    try {
      const updated = await this.store.confirmServiceRequest(request.id, provider.id);
      this.serviceRequest.set(updated);
      this.selectedProvider.set(provider);
      this.showProviderSearch.set(false);
      this.showServiceTracking.set(true);
      this.toasts.show('Provider confirmed! Tracking your service request.', 'check-circle');
    } catch (err) {
      this.toasts.error(
        friendlyError(err, 'Could not confirm provider'),
      );
    }
  }

  closeServiceModal(): void {
    this.showServiceModal.set(false);
  }

  closeProviderSearch(): void {
    this.showProviderSearch.set(false);
  }

  closeServiceTracking(): void {
    this.showServiceTracking.set(false);
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

    const confirmed = await this.confirm.confirm({
      title: 'Delete Asset',
      message: `Permanently delete ${a.name} from your inventory? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

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
