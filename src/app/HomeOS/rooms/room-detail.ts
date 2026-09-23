import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Icon } from '../shared/icon/icon';
import { AssetCard } from '../shared/asset-card/asset-card';
import { EmptyState } from '../shared/empty-state/empty-state';
import { PageHeader } from '../shared/page-header/page-header';
import { HomeStore } from '../core/home-store';
import { AddFlowService } from '../add/add-flow.service';
import { formatCurrency } from '../core/format';

@Component({
  selector: 'app-room-detail',
  imports: [Icon, AssetCard, EmptyState, PageHeader, RouterLink],
  templateUrl: './room-detail.html',
  styleUrl: './room-detail.css',
})
export class RoomDetail {
  private store = inject(HomeStore);
  private flow = inject(AddFlowService);
  private route = inject(ActivatedRoute);

  loading = this.store.loading;

  private id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  readonly room = computed(() => this.store.room(this.id()));
  readonly assets = computed(() => this.store.assetsInRoom(this.id()));
  readonly totalValue = computed(() =>
    this.assets().reduce((sum, a) => sum + (a.purchasePrice ?? 0), 0),
  );

  readonly subtitle = computed(() => {
    const count = this.assets().length;
    const label = `${count} ${count === 1 ? 'item' : 'items'}`;
    const value = this.totalValue();
    return value ? `${label} · ${formatCurrency(value)} total value` : label;
  });

  addAsset(): void {
    this.flow.open('Asset', { roomId: this.id() });
  }

  rename(): void {
    this.flow.edit('Room', this.id());
  }
}
