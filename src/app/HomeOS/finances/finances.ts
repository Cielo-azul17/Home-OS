import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../shared/page-header/page-header';
import { Icon } from '../shared/icon/icon';
import { EmptyState } from '../shared/empty-state/empty-state';
import { SmartSearch, SearchSuggestion } from '../shared/smart-search/smart-search';
import { Truncated } from '../shared/tooltip/truncated.directive';
import { colorAt, DonutChart, DonutSegment } from '../shared/donut-chart/donut-chart';
import { HomeStore } from '../core/home-store';
import { AddFlowService } from '../add/add-flow.service';
import { ToastService } from '../shared/toast/toast';
import { ConfirmService } from '../shared/confirm.service';
import { friendlyError } from '../core/errors';
import { EXPENSE_CATEGORIES, Expense, ExpenseCategory } from '../core/models';
import {
  formatCurrency,
  formatDate,
  formatMonth,
  isInMonth,
  monthKey,
  shiftMonth,
} from '../core/format';

/** How many rows to add each time the list is extended. */
const PAGE = 15;
/** Bands the sage ramp can still be told apart at. */
const MAX_SLICES = 5;

@Component({
  selector: 'app-finances',
  imports: [PageHeader, Icon, EmptyState, SmartSearch, FormsModule, Truncated, DonutChart],
  templateUrl: './finances.html',
  styleUrl: './finances.css',
})
export class FinancesPage {
  private store = inject(HomeStore);
  private flow = inject(AddFlowService);
  private toasts = inject(ToastService);
  private confirm = inject(ConfirmService);

  loading = this.store.loading;
  categories = EXPENSE_CATEGORIES;

  /* The whole page reads from one selected month rather than always "now",
     so last year's bills are reachable instead of being cut off at 12. */
  month = signal(monthKey());
  search = signal('');
  categoryFilter = signal('');
  shown = signal(PAGE);

  readonly monthLabel = computed(() => formatMonth(this.month()));
  readonly previousLabel = computed(() => formatMonth(shiftMonth(this.month(), -1)));

  /** No navigating into months that haven't happened. */
  readonly atCurrentMonth = computed(() => this.month() >= monthKey());

  private readonly inMonth = computed(() =>
    this.store.expenses().filter((e) => isInMonth(e.date, this.month())),
  );

  private readonly inPreviousMonth = computed(() => {
    const previous = shiftMonth(this.month(), -1);
    return this.store.expenses().filter((e) => isInMonth(e.date, previous));
  });

  readonly monthlySpend = computed(() =>
    this.inMonth().reduce((sum, e) => sum + e.amount, 0),
  );

  readonly lastMonthSpend = computed(() =>
    this.inPreviousMonth().reduce((sum, e) => sum + e.amount, 0),
  );

  readonly change = computed(() => {
    const last = this.lastMonthSpend();
    if (!last) return null;
    const diff = Math.round(((this.monthlySpend() - last) / last) * 100);
    return { diff: Math.abs(diff), lower: diff <= 0 };
  });

  readonly breakdown = computed(() => {
    const totals = new Map<ExpenseCategory, number>();
    for (const e of this.inMonth()) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    }
    const total = this.monthlySpend();
    return [...totals.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        percent: total ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  /* The ring is a sage ramp, and a monochrome ramp stops being legible past
     about five bands — so the tail folds into one "Other" slice rather than
     becoming four shades nobody can tell apart. */
  readonly slices = computed<DonutSegment[]>(() => {
    const rows = this.breakdown();
    const total = this.monthlySpend();
    if (!total) return [];

    const top = rows.slice(0, MAX_SLICES - 1);
    const rest = rows.slice(MAX_SLICES - 1);

    const segments: DonutSegment[] = top.map((row) => ({
      label: row.category,
      value: row.amount,
      percent: row.percent,
    }));

    if (rest.length) {
      const value = rest.reduce((sum, row) => sum + row.amount, 0);
      segments.push({
        label: 'Other',
        value,
        percent: Math.round((value / total) * 100),
      });
    }

    // Only fold when it actually saves a band.
    return rows.length <= MAX_SLICES
      ? rows.map((row) => ({ label: row.category, value: row.amount, percent: row.percent }))
      : segments;
  });

  sliceColor = colorAt;

  /* The list is deliberately NOT limited to the selected month — searching
     for "plumber" should find it whenever it was paid. Clearing the search
     brings the month back as the boundary. */
  readonly searching = computed(() => !!this.search().trim());

  readonly filtered = computed<Expense[]>(() => {
    const term = this.search().trim().toLowerCase();
    const category = this.categoryFilter();

    return this.store
      .expenses()
      .filter((e) => {
        if (category && e.category !== category) return false;
        if (!term) return isInMonth(e.date, this.month());
        return (
          e.title.toLowerCase().includes(term) ||
          e.category.toLowerCase().includes(term) ||
          this.assetName(e.assetId).toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly visible = computed(() => this.filtered().slice(0, this.shown()));
  readonly remaining = computed(() => Math.max(0, this.filtered().length - this.shown()));

  readonly inMonthCount = computed(() => this.inMonth().length);

  readonly listTotal = computed(() =>
    this.filtered().reduce((sum, e) => sum + e.amount, 0),
  );

  /* Only a search leaves the month behind, so only a search changes the
     heading — a category filter still reads as "this month, narrowed". */
  readonly listTitle = computed(() => {
    if (!this.searching()) return `Expenses in ${this.monthLabel()}`;
    const n = this.filtered().length;
    return `${n} matching ${n === 1 ? 'expense' : 'expenses'}`;
  });

  readonly suggestions = computed<SearchSuggestion[]>(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return [];

    const out: SearchSuggestion[] = [];
    const seen = new Set<string>();
    const add = (id: string, label: string, detail: string, icon: SearchSuggestion['icon']) => {
      const key = id.toLowerCase();
      if (seen.has(key) || !label.toLowerCase().includes(term)) return;
      seen.add(key);
      out.push({ id, label, detail, icon });
    };

    for (const e of this.store.expenses()) {
      add(`expense:${e.title}`, e.title, `${formatCurrency(e.amount)} · ${e.category}`, 'receipt');
    }
    for (const c of this.categories) {
      add(`category:${c}`, c, 'Category', 'tag');
    }

    return out.slice(0, 8);
  });

  onSuggestion(suggestion: SearchSuggestion): void {
    const at = suggestion.id.indexOf(':');
    const kind = suggestion.id.slice(0, at);
    const value = suggestion.id.slice(at + 1);

    this.shown.set(PAGE);

    if (kind === 'category') {
      this.search.set('');
      this.categoryFilter.set(value);
      return;
    }
    this.search.set(value);
  }

  money = formatCurrency;
  date = formatDate;

  assetName(assetId?: string): string {
    if (!assetId) return '';
    return this.store.asset(assetId)?.name ?? '';
  }

  stepMonth(delta: number): void {
    if (delta > 0 && this.atCurrentMonth()) return;
    this.month.update((key) => shiftMonth(key, delta));
    this.shown.set(PAGE);
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.shown.set(PAGE);
  }

  onCategory(value: string): void {
    this.categoryFilter.set(value);
    this.shown.set(PAGE);
  }

  clearFilters(): void {
    this.search.set('');
    this.categoryFilter.set('');
    this.shown.set(PAGE);
  }

  showMore(): void {
    this.shown.update((n) => n + PAGE);
  }

  edit(id: string): void {
    this.flow.edit('Expense', id);
  }

  async remove(id: string): Promise<void> {
    const title = this.store.expenses().find((e) => e.id === id)?.title ?? 'Expense';

    const confirmed = await this.confirm.confirm({
      title: 'Delete Expense',
      message: `Permanently delete "${title}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      await this.store.removeExpense(id);
      this.toasts.show(`${title} deleted`, 'trash');
    } catch (err) {
      this.toasts.error(friendlyError(err, `${title} could not be deleted.`));
    }
  }

  addExpense(): void {
    this.flow.open('Expense');
  }
}
