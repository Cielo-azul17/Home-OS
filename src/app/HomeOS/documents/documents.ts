import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../shared/page-header/page-header';
import { Icon } from '../shared/icon/icon';
import { EmptyState } from '../shared/empty-state/empty-state';
import { StatusBadge } from '../shared/status-badge/status-badge';
import { SmartSearch, SearchSuggestion } from '../shared/smart-search/smart-search';
import { Truncated } from '../shared/tooltip/truncated.directive';
import { HomeStore } from '../core/home-store';
import { AddFlowService } from '../add/add-flow.service';
import { DocumentViewerService } from '../shared/document-viewer/document-viewer.service';
import { ToastService } from '../shared/toast/toast';
import { ConfirmService } from '../shared/confirm.service';
import { friendlyError } from '../core/errors';
import { DOCUMENT_KINDS } from '../core/models';
import { formatDate } from '../core/format';

@Component({
  selector: 'app-documents',
  imports: [PageHeader, Icon, EmptyState, StatusBadge, SmartSearch, FormsModule, Truncated],
  templateUrl: './documents.html',
  styleUrl: './documents.css',
})
export class DocumentsPage {
  private store = inject(HomeStore);
  private flow = inject(AddFlowService);
  private viewer = inject(DocumentViewerService);
  private toasts = inject(ToastService);
  private confirm = inject(ConfirmService);

  loading = this.store.loading;
  kinds = DOCUMENT_KINDS;

  search = signal('');
  kindFilter = signal('');
  sort = signal<'latest' | 'oldest' | 'name'>('latest');

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const kind = this.kindFilter();
    const sort = this.sort();

    return this.store
      .documents()
      .filter((d) => {
        if (kind && d.kind !== kind) return false;
        if (!term) return true;
        return (
          d.title.toLowerCase().includes(term) ||
          d.fileName.toLowerCase().includes(term) ||
          d.kind.toLowerCase().includes(term) ||
          this.assetName(d.assetId).toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (sort === 'name') return a.title.localeCompare(b.title);
        if (sort === 'oldest') return a.addedDate.localeCompare(b.addedDate);
        return b.addedDate.localeCompare(a.addedDate);
      });
  });

  readonly hasFilters = computed(() => !!this.search() || !!this.kindFilter());

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

    for (const d of this.store.documents()) {
      add(`doc:${d.id}`, d.title, `${d.kind} · ${d.sizeLabel}`, 'file-text');
    }
    for (const d of this.store.documents()) {
      const name = this.assetName(d.assetId);
      if (name) add(`term:${name}`, name, 'Related asset', 'box');
    }
    for (const k of this.kinds) {
      add(`kind:${k}`, k, 'Type', 'tag');
    }

    return out.slice(0, 8);
  });

  onSuggestion(suggestion: SearchSuggestion): void {
    const at = suggestion.id.indexOf(':');
    const kind = suggestion.id.slice(0, at);
    const value = suggestion.id.slice(at + 1);

    if (kind === 'doc') {
      this.view(value);
      return;
    }
    if (kind === 'kind') {
      this.search.set('');
      this.kindFilter.set(value);
      return;
    }
    this.search.set(value);
  }

  date = formatDate;

  assetName(assetId?: string): string {
    if (!assetId) return '';
    return this.store.asset(assetId)?.name ?? '';
  }

  /* Opens with the current filtered list, so the viewer's list matches what
     the user was actually looking at. */
  view(documentId: string): void {
    this.viewer.open(this.filtered(), documentId);
  }

  edit(id: string): void {
    this.flow.edit('Document', id);
  }

  async remove(id: string): Promise<void> {
    const title = this.store.documents().find((d) => d.id === id)?.title ?? 'document';

    const confirmed = await this.confirm.confirm({
      title: 'Delete Document',
      message: `Permanently delete "${title}" and its file? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      await this.store.removeDocument(id);
      this.toasts.show(`${title} deleted`, 'trash');
    } catch (err) {
      this.toasts.error(friendlyError(err, `${title} could not be deleted.`));
    }
  }

  addDocument(): void {
    this.flow.open('Document');
  }
}
