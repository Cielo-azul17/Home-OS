import {
  Component,
  computed,
  effect,
  HostListener,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Icon } from '../icon/icon';
import { StatusBadge } from '../status-badge/status-badge';
import { Truncated } from '../tooltip/truncated.directive';
import { DocumentViewerService } from './document-viewer.service';
import { HomeStore } from '../../core/home-store';
import { ScrollLock } from '../../core/scroll-lock.service';
import { formatDate } from '../../core/format';
import { DOCUMENT_KINDS } from '../../core/models';

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const FIT = 1;

@Component({
  selector: 'app-document-viewer',
  imports: [Icon, StatusBadge, FormsModule, Truncated],
  templateUrl: './document-viewer.html',
  styleUrl: './document-viewer.css',
})
export class DocumentViewer implements OnDestroy {
  viewer = inject(DocumentViewerService);
  private store = inject(HomeStore);
  private sanitizer = inject(DomSanitizer);
  private scrollLock = inject(ScrollLock);

  date = formatDate;
  kinds = DOCUMENT_KINDS;

  search = signal('');
  kindFilter = signal('');
  sort = signal<'latest' | 'oldest' | 'name'>('latest');
  zoom = signal(FIT);
  naturalWidth = signal(0);

  readonly documents = this.viewer.documents;

  constructor() {
    this.scrollLock.lock();

    // A new document should always start at fit, never inherit the last
    // document's zoom.
    effect(() => {
      this.viewer.activeId();
      this.zoom.set(FIT);
    });
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock();
  }

  /* ---------- List ---------- */

  readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const kind = this.kindFilter();
    const sort = this.sort();

    const matched = this.documents().filter((doc) => {
      if (kind && doc.kind !== kind) return false;
      if (!term) return true;
      return (
        doc.title.toLowerCase().includes(term) ||
        doc.fileName.toLowerCase().includes(term) ||
        doc.kind.toLowerCase().includes(term) ||
        this.assetName(doc.assetId).toLowerCase().includes(term)
      );
    });

    return [...matched].sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title);
      if (sort === 'oldest') return a.addedDate.localeCompare(b.addedDate);
      return b.addedDate.localeCompare(a.addedDate);
    });
  });

  readonly hasFilters = computed(() => !!this.search() || !!this.kindFilter());

  readonly active = computed(() => {
    const id = this.viewer.activeId();
    return this.documents().find((d) => d.id === id) ?? null;
  });

  /** Position within the filtered list — -1 when the active doc is filtered out. */
  readonly index = computed(() => {
    const id = this.viewer.activeId();
    return this.visible().findIndex((d) => d.id === id);
  });

  clearFilters(): void {
    this.search.set('');
    this.kindFilter.set('');
  }

  /* ---------- Preview ---------- */

  readonly isImage = computed(() => {
    const doc = this.active();
    if (!doc?.fileUrl) return false;
    return (doc.mimeType ?? '').startsWith('image/') || doc.fileUrl.startsWith('data:image');
  });

  readonly isPdf = computed(() => {
    const doc = this.active();
    if (!doc?.fileUrl) return false;
    return (doc.mimeType ?? '').includes('pdf') || doc.fileUrl.startsWith('data:application/pdf');
  });

  /* Angular strips data: URLs in resource contexts; these files are ones the
     user just supplied themselves, so trusting them is safe here. */
  readonly pdfUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.active()?.fileUrl;
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));
  readonly canZoomIn = computed(() => this.zoom() < ZOOM_STEPS[ZOOM_STEPS.length - 1]);
  readonly canZoomOut = computed(() => this.zoom() > ZOOM_STEPS[0]);

  /* At fit the image is sized by CSS so it contains. Beyond that it gets an
     explicit pixel width, which lets the pane scroll naturally instead of
     needing a transform that layout can't see. */
  readonly scaledWidth = computed(() => {
    if (this.zoom() === FIT || !this.naturalWidth()) return null;
    return `${Math.round(this.naturalWidth() * this.zoom())}px`;
  });

  onImageLoad(event: Event): void {
    this.naturalWidth.set((event.target as HTMLImageElement).naturalWidth);
  }

  zoomIn(): void {
    const next = ZOOM_STEPS.find((s) => s > this.zoom());
    if (next) this.zoom.set(next);
  }

  zoomOut(): void {
    const prev = [...ZOOM_STEPS].reverse().find((s) => s < this.zoom());
    if (prev) this.zoom.set(prev);
  }

  resetZoom(): void {
    this.zoom.set(FIT);
  }

  /* ---------- Navigation ---------- */

  assetName(assetId?: string): string {
    if (!assetId) return '';
    return this.store.asset(assetId)?.name ?? '';
  }

  select(id: string): void {
    this.viewer.select(id);
  }

  prev(): void {
    const list = this.visible();
    const i = this.index();
    if (i > 0) this.viewer.select(list[i - 1].id);
    else if (i === -1 && list.length) this.viewer.select(list[0].id);
  }

  next(): void {
    const list = this.visible();
    const i = this.index();
    if (i >= 0 && i < list.length - 1) this.viewer.select(list[i + 1].id);
    else if (i === -1 && list.length) this.viewer.select(list[0].id);
  }

  close(): void {
    this.viewer.close();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const typing = (event.target as HTMLElement)?.tagName === 'INPUT';

    if (event.key === 'Escape') {
      this.close();
      return;
    }
    if (typing) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') this.prev();
    if (event.key === '+' || event.key === '=') this.zoomIn();
    if (event.key === '-') this.zoomOut();
    if (event.key === '0') this.resetZoom();
  }

  /** Done programmatically so the sanitizer never sees the data URL. */
  download(): void {
    const doc = this.active();
    if (!doc?.fileUrl) return;
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.click();
  }
}
