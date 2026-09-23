import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../shared/modal/modal';
import { Icon } from '../shared/icon/icon';
import { PhotoUpload } from '../shared/photo-upload/photo-upload';
import { Truncated } from '../shared/tooltip/truncated.directive';
import { HomeStore } from '../core/home-store';
import { AiService } from '../core/ai.service';
import { ToastService } from '../shared/toast/toast';
import { AddFlowService } from './add-flow.service';
import { friendlyError } from '../core/errors';
import {
  AiDocumentDraft,
  AiRecordGroup,
  ASSET_CATEGORIES,
  AssetCategory,
  DOCUMENT_KINDS,
  DocumentKind,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  SCAN_LABEL,
  ScanKind,
} from '../core/models';

type Step = 'upload' | 'reading' | 'review';

interface Scan {
  index: number;
  photo: string;
  kind: ScanKind;
  summary: string;
  error: string;
}

interface AssetForm {
  name: string;
  brand: string;
  category: AssetCategory;
  roomId: string;
  purchaseDate: string;
  purchasePrice: number | null;
  warrantyExpiry: string;
  serialNumber: string;
}

interface ExpenseForm {
  title: string;
  amount: number | null;
  date: string;
  category: ExpenseCategory;
}

interface Row {
  key: string;
  groupKey: string;
  kind: 'asset' | 'expense' | 'document';
  keep: boolean;
  open: boolean;
  asset?: AssetForm;
  expense?: ExpenseForm;
  document?: AiDocumentDraft;
}

/** One purchase from one photo — its records stay together in the review. */
interface Group {
  key: string;
  scanIndex: number;
  label: string;
}

const KIND_LABEL: Record<Row['kind'], string> = {
  asset: 'Product',
  expense: 'Expense',
  document: 'Document',
};

@Component({
  selector: 'app-smart-add-modal',
  imports: [Modal, Icon, PhotoUpload, FormsModule, Truncated],
  templateUrl: './smart-add-modal.html',
  styleUrl: './smart-add-modal.css',
})
export class SmartAddModal implements OnDestroy {
  private store = inject(HomeStore);
  private ai = inject(AiService);
  private toasts = inject(ToastService);
  private flow = inject(AddFlowService);

  categories = ASSET_CATEGORIES;
  expenseCategories = EXPENSE_CATEGORIES;
  documentKinds = DOCUMENT_KINDS;
  rooms = this.store.rooms;
  scanLabel = SCAN_LABEL;

  step = signal<Step>('upload');
  saving = signal(false);
  saveError = signal('');
  status = signal('');
  done = signal(0);
  total = signal(0);

  /* Plain arrays rather than signals — the templates bind straight into these
     objects via ngModel, and the app runs with zone change detection. */
  scans: Scan[] = [];
  groups: Group[] = [];
  rows: Row[] = [];

  /* Closing the modal has to stop the run — otherwise the loop keeps
     calling Gemini for photos nobody is waiting on. */
  private reader: AbortController | null = null;
  private destroyed = false;

  kindLabel = KIND_LABEL;

  get selectedCount(): number {
    return this.rows.filter((r) => r.keep).length;
  }

  get failedScans(): Scan[] {
    return this.scans.filter((s) => s.error);
  }

  /** How many purchases were found, across every photo. */
  get purchaseCount(): number {
    return this.groups.length;
  }

  get assetCount(): number {
    return this.rows.filter((r) => r.kind === 'asset').length;
  }

  get expenseCount(): number {
    return this.rows.filter((r) => r.kind === 'expense').length;
  }

  get documentCount(): number {
    return this.rows.filter((r) => r.kind === 'document').length;
  }

  groupsFor(scanIndex: number): Group[] {
    return this.groups.filter((g) => g.scanIndex === scanIndex);
  }

  rowsFor(groupKey: string): Row[] {
    return this.rows.filter((r) => r.groupKey === groupKey);
  }

  keptIn(groupKey: string): number {
    return this.rowsFor(groupKey).filter((r) => r.keep).length;
  }

  /* Files are read one after another rather than in parallel — a batch of
     bills fired at the model at once is what triggers the 503s. */
  async onPhotos(urls: string[]): Promise<void> {
    if (!urls.length) return;

    this.reader?.abort();
    const reader = new AbortController();
    this.reader = reader;

    this.scans = urls.map((photo, index) => ({
      index,
      photo,
      kind: 'unknown' as ScanKind,
      summary: '',
      error: '',
    }));
    this.groups = [];
    this.rows = [];
    this.total.set(urls.length);
    this.done.set(0);
    this.step.set('reading');

    for (let i = 0; i < urls.length; i++) {
      if (reader.signal.aborted) break;

      this.status.set(
        urls.length > 1 ? `Reading ${i + 1} of ${urls.length}…` : 'Reading your photo…',
      );

      try {
        const found = await this.ai.identify(
          urls[i],
          this.rooms(),
          (m) => this.status.set(urls.length > 1 ? `${m} (${i + 1} of ${urls.length})` : m),
          reader.signal,
        );
        this.scans[i].kind = found.scanKind;
        this.scans[i].summary = found.summary;
        this.collect(i, found.groups);
      } catch (err) {
        // A cancel isn't a failure — don't mark the photo as unreadable.
        if (reader.signal.aborted) break;
        this.scans[i].error =
          err instanceof Error ? err.message : 'Could not read this photo.';
      }

      this.done.set(i + 1);
    }

    // The component may already be gone if the modal was closed mid-read.
    if (this.destroyed) return;

    /* Cancelling keeps whatever was already read — those photos cost time
       and a model call, so throwing them away would be the wrong default. */
    if (reader.signal.aborted && !this.rows.length) {
      this.restart();
      return;
    }

    this.step.set('review');
  }

  /** Stops after the photo in flight; everything read so far is kept. */
  cancelReading(): void {
    this.reader?.abort();
    this.status.set('Stopping…');
  }

  /* Rows are pushed in asset -> expense -> document order within each group,
     so a bill's three records always read in the same sequence. */
  private collect(scanIndex: number, groups: AiRecordGroup[]): void {
    groups.forEach((group, gi) => {
      const key = `g-${scanIndex}-${gi}`;
      this.groups.push({ key, scanIndex, label: group.label });

      if (group.asset) {
        const a = group.asset;
        this.rows.push({
          key: `${key}-asset`,
          groupKey: key,
          kind: 'asset',
          keep: true,
          open: false,
          asset: {
            name: a.name,
            brand: a.brand ?? '',
            category: a.category,
            roomId: this.rooms().some((r) => r.id === a.roomId)
              ? a.roomId
              : (this.rooms()[0]?.id ?? ''),
            purchaseDate: a.purchaseDate ?? '',
            purchasePrice: a.purchasePrice ?? null,
            warrantyExpiry: a.warrantyExpiry ?? '',
            serialNumber: a.serialNumber ?? '',
          },
        });
      }

      if (group.expense) {
        const e = group.expense;
        this.rows.push({
          key: `${key}-expense`,
          groupKey: key,
          kind: 'expense',
          keep: true,
          open: false,
          expense: { title: e.title, amount: e.amount, date: e.date, category: e.category },
        });
      }

      if (group.document) {
        this.rows.push({
          key: `${key}-document`,
          groupKey: key,
          kind: 'document',
          keep: true,
          open: false,
          document: { ...group.document },
        });
      }
    });
  }

  toggle(row: Row): void {
    row.keep = !row.keep;
  }

  toggleOpen(row: Row): void {
    row.open = !row.open;
  }

  setAll(keep: boolean): void {
    this.rows.forEach((r) => (r.keep = keep));
  }

  setCategory(row: Row, value: string): void {
    if (row.asset) row.asset.category = value as AssetCategory;
  }

  setExpenseCategory(row: Row, value: string): void {
    if (row.expense) row.expense.category = value as ExpenseCategory;
  }

  setDocumentKind(row: Row, value: string): void {
    if (row.document) row.document.kind = value as DocumentKind;
  }

  rowTitle(row: Row): string {
    if (row.asset) return row.asset.name;
    if (row.expense) return row.expense.title;
    return row.document?.title ?? '';
  }

  rowDetail(row: Row): string {
    if (row.asset) {
      return `${this.store.roomName(row.asset.roomId)} · ${row.asset.category}`;
    }
    if (row.expense) return `₹${row.expense.amount} · ${row.expense.category}`;
    return `${row.document?.kind} · ${row.document?.sizeLabel}`;
  }

  rowIcon(row: Row): 'box' | 'receipt' | 'file-text' {
    if (row.kind === 'asset') return 'box';
    if (row.kind === 'expense') return 'receipt';
    return 'file-text';
  }

  /* Created per GROUP, not per photo — with four bills in one image, linking
     per photo would attach every expense to the first bill's asset. */
  async confirm(): Promise<void> {
    if (!this.selectedCount || this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');

    /* One bad row must not cost the user the other ten. Each record is saved
       independently, failures are counted, and anything that did save is
       kept — so a retry doesn't duplicate what already worked. */
    let saved = 0;
    const failures: string[] = [];

    for (const group of this.groups) {
      const kept = this.rowsFor(group.key).filter((r) => r.keep);
      if (!kept.length) continue;

      const photo = this.scans[group.scanIndex]?.photo;
      let assetId: string | undefined;

      for (const row of kept.filter((r) => r.kind === 'asset')) {
        const form = row.asset!;
        try {
          const created = await this.store.addAsset({
            name: form.name.trim(),
            brand: form.brand.trim() || undefined,
            category: form.category,
            roomId: form.roomId,
            image: photo,
            purchaseDate: form.purchaseDate || undefined,
            purchasePrice: form.purchasePrice ?? undefined,
            warrantyExpiry: form.warrantyExpiry || undefined,
            serialNumber: form.serialNumber.trim() || undefined,
          });
          assetId ??= created.id;
          row.keep = false;
          saved++;
        } catch (err) {
          failures.push(friendlyError(err));
        }
      }

      for (const row of kept.filter((r) => r.kind === 'expense')) {
        const form = row.expense!;
        try {
          await this.store.addExpense({
            title: form.title.trim(),
            amount: Number(form.amount ?? 0),
            date: form.date,
            category: form.category,
            assetId,
          });
          row.keep = false;
          saved++;
        } catch (err) {
          failures.push(friendlyError(err));
        }
      }

      for (const row of kept.filter((r) => r.kind === 'document')) {
        const form = row.document!;
        try {
          await this.store.addDocument({
            title: form.title.trim(),
            kind: form.kind,
            fileName: form.fileName,
            sizeLabel: form.sizeLabel,
            // The scan IS the document — keep it so it can be opened later.
            fileUrl: photo,
            mimeType: this.photoMime(photo),
            assetId,
          });
          row.keep = false;
          saved++;
        } catch (err) {
          failures.push(friendlyError(err));
        }
      }
    }

    this.saving.set(false);

    if (failures.length) {
      // Still selected = still unsaved, so the button now offers a retry.
      this.saveError.set(
        `${saved} of ${saved + failures.length} records saved. ${failures[0]}`,
      );
      if (saved) this.toasts.show(`Added ${saved} ${saved === 1 ? 'record' : 'records'}`);
      return;
    }

    this.toasts.show(`Added ${saved} ${saved === 1 ? 'record' : 'records'} from your photos`);
    this.flow.close();
  }

  /** The scan's own type, rather than assuming every photo is a JPEG. */
  private photoMime(photo: string | undefined): string {
    const match = /^data:([^;,]+)/.exec(photo ?? '');
    return match?.[1] ?? 'image/jpeg';
  }

  restart(): void {
    this.reader?.abort();
    this.reader = null;
    this.scans = [];
    this.groups = [];
    this.rows = [];
    this.status.set('');
    this.done.set(0);
    this.total.set(0);
    this.step.set('upload');
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.reader?.abort();
  }

  manual(): void {
    this.flow.open('Asset');
  }

  close(): void {
    this.flow.close();
  }
}
