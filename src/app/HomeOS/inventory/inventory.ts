import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PageHeader } from '../shared/page-header/page-header';
import { AssetCard } from '../shared/asset-card/asset-card';
import { Icon } from '../shared/icon/icon';
import { EmptyState } from '../shared/empty-state/empty-state';
import { StatusBadge } from '../shared/status-badge/status-badge';
import { SmartSearch, SearchSuggestion } from '../shared/smart-search/smart-search';
import { HomeStore, warrantyBadge } from '../core/home-store';
import { AddFlowService } from '../add/add-flow.service';
import { ASSET_CATEGORIES } from '../core/models';
import { formatCurrency } from '../core/format';

@Component({
  selector: 'app-inventory',
  imports: [
    PageHeader,
    AssetCard,
    Icon,
    EmptyState,
    StatusBadge,
    SmartSearch,
    FormsModule,
    RouterLink,
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class InventoryPage {
  private store = inject(HomeStore);
  private flow = inject(AddFlowService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categories = ASSET_CATEGORIES;
  rooms = this.store.rooms;
  loading = this.store.loading;

  private queryParam = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('q') ?? '')),
    { initialValue: '' },
  );

  search = signal('');
  roomFilter = signal('');
  categoryFilter = signal('');
  view = signal<'grid' | 'list'>('grid');

  constructor() {
    const initial = this.queryParam();
    if (initial) this.search.set(initial);
  }

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const room = this.roomFilter();
    const category = this.categoryFilter();

    return this.store.assets().filter((a) => {
      if (room && a.roomId !== room) return false;
      if (category && a.category !== category) return false;
      if (!term) return true;
      return (
        a.name.toLowerCase().includes(term) ||
        (a.brand ?? '').toLowerCase().includes(term) ||
        a.category.toLowerCase().includes(term) ||
        this.store.roomName(a.roomId).toLowerCase().includes(term)
      );
    });
  });

  readonly hasFilters = computed(
    () => !!this.search() || !!this.roomFilter() || !!this.categoryFilter(),
  );

  /* Suggestions come from what's actually in the inventory — products first,
     then the brands, categories and rooms that group them. */
  readonly suggestions = computed<SearchSuggestion[]>(() => {
    const term = this.search().trim().toLowerCase();
    if (term.length < 1) return [];

    const assets = this.store.assets();
    const out: SearchSuggestion[] = [];
    const seen = new Set<string>();

    const add = (id: string, label: string, detail: string, icon: SearchSuggestion['icon']) => {
      const key = id.toLowerCase();
      if (seen.has(key) || !label.toLowerCase().includes(term)) return;
      seen.add(key);
      out.push({ id, label, detail, icon });
    };

    for (const a of assets) {
      add(`asset:${a.id}`, a.name, `${this.store.roomName(a.roomId)} · ${a.category}`, 'box');
    }
    for (const a of assets) {
      if (a.brand) add(`term:${a.brand}`, a.brand, 'Brand', 'tag');
    }
    for (const c of this.categories) {
      add(`category:${c}`, c, 'Category', 'tag');
    }
    for (const r of this.rooms()) {
      add(`room:${r.id}`, r.name, 'Room', 'door');
    }

    return out.slice(0, 8);
  });

  onSuggestion(suggestion: SearchSuggestion): void {
    const [kind, value] = [
      suggestion.id.slice(0, suggestion.id.indexOf(':')),
      suggestion.id.slice(suggestion.id.indexOf(':') + 1),
    ];

    if (kind === 'asset') {
      this.router.navigate(['/inventory', value]);
      return;
    }
    if (kind === 'room') {
      this.search.set('');
      this.roomFilter.set(value);
      return;
    }
    if (kind === 'category') {
      this.search.set('');
      this.categoryFilter.set(value);
      return;
    }
    this.search.set(value);
  }

  readonly totalValue = computed(() =>
    this.filtered().reduce((sum, a) => sum + (a.purchasePrice ?? 0), 0),
  );

  badge = warrantyBadge;
  money = formatCurrency;

  roomName(id: string): string {
    return this.store.roomName(id);
  }

  clearFilters(): void {
    this.search.set('');
    this.roomFilter.set('');
    this.categoryFilter.set('');
  }

  addAsset(): void {
    this.flow.open('Asset');
  }
}
