import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../shared/modal/modal';
import { Icon } from '../shared/icon/icon';
import { PhotoUpload } from '../shared/photo-upload/photo-upload';
import { HomeStore } from '../core/home-store';
import { AiService } from '../core/ai.service';
import { ToastService } from '../shared/toast/toast';
import { AddFlowService } from './add-flow.service';
import { friendlyError } from '../core/errors';
import {
  AiDocumentDraft,
  AiExpenseDraft,
  Asset,
  ASSET_CATEGORIES,
  AssetCategory,
} from '../core/models';

/* Manual asset entry, with an optional photo. If the photo turns out to be
   an invoice or a warranty card, it implies more than an asset — so the
   expense and the document are offered here rather than making the user go
   and add them from two other screens. */

@Component({
  selector: 'app-add-asset-modal',
  imports: [Modal, Icon, PhotoUpload, FormsModule],
  templateUrl: './add-asset-modal.html',
  styleUrl: './add-asset-modal.css',
})
export class AddAssetModal implements OnInit {
  private store = inject(HomeStore);
  private ai = inject(AiService);
  private toasts = inject(ToastService);
  private flow = inject(AddFlowService);

  categories = ASSET_CATEGORIES;
  rooms = this.store.rooms;

  saving = signal(false);
  saveError = signal('');
  photo = signal<string | null>(null);
  reading = signal(false);
  aiStatus = signal('Reading your photo…');
  aiError = signal('');

  expenseExtra = signal<(AiExpenseDraft & { amount: number | null }) | null>(null);
  documentExtra = signal<AiDocumentDraft | null>(null);
  keepExpense = signal(true);
  keepDocument = signal(true);
  /** Products on the bill beyond the one this form holds. */
  extraAssets = signal(0);

  name = '';
  brand = '';
  category: AssetCategory = 'Electronics';
  roomId = '';
  purchaseDate = '';
  purchasePrice: number | null = null;
  warrantyExpiry = '';
  serialNumber = '';
  notes = '';

  /* Editing reuses this whole form — the only differences are that the
     fields start filled, the photo step is hidden, and save() writes over
     the original instead of creating a second copy. */
  editing = signal<Asset | null>(null);

  ngOnInit(): void {
    const { editId, roomId } = this.flow.options();
    const existing = editId ? this.store.asset(editId) : undefined;

    if (existing) {
      this.editing.set(existing);
      this.name = existing.name;
      this.brand = existing.brand ?? '';
      this.category = existing.category;
      this.roomId = existing.roomId;
      this.purchaseDate = existing.purchaseDate ?? '';
      this.purchasePrice = existing.purchasePrice ?? null;
      this.warrantyExpiry = existing.warrantyExpiry ?? '';
      this.serialNumber = existing.serialNumber ?? '';
      this.notes = existing.notes ?? '';
      this.photo.set(existing.image ?? null);
      return;
    }

    this.roomId = roomId ?? this.rooms()[0]?.id ?? '';
  }

  get canSave(): boolean {
    return this.name.trim().length > 0 && !!this.roomId;
  }

  readonly extraCount = computed(() => {
    let n = 0;
    if (this.expenseExtra() && this.keepExpense()) n++;
    if (this.documentExtra() && this.keepDocument()) n++;
    return n;
  });

  readonly saveLabel = computed(() => {
    if (this.editing()) return 'Save changes';
    const extras = this.extraCount();
    if (!extras) return 'Add asset';
    return `Add asset + ${extras} ${extras === 1 ? 'record' : 'records'}`;
  });

  roomName(id: string): string {
    return this.store.roomName(id);
  }

  async onPhoto(urls: string[]): Promise<void> {
    const dataUrl = urls[0];
    if (!dataUrl) return;
    this.photo.set(dataUrl);
    this.aiError.set('');
    this.aiStatus.set('Reading your photo…');
    this.reading.set(true);

    try {
      const found = await this.ai.identify(dataUrl, this.rooms(), (m) =>
        this.aiStatus.set(m),
      );

      /* This form holds one asset, so it takes the first purchase the scan
         found and points elsewhere if there are more. */
      const [first] = found.groups;
      const firstAsset = first?.asset;

      if (firstAsset) {
        const a = firstAsset;
        this.name = a.name;
        this.brand = a.brand ?? '';
        this.category = a.category;
        if (this.rooms().some((r) => r.id === a.roomId)) this.roomId = a.roomId;
        this.purchaseDate = a.purchaseDate ?? this.purchaseDate;
        this.purchasePrice = a.purchasePrice ?? this.purchasePrice;
        this.warrantyExpiry = a.warrantyExpiry ?? this.warrantyExpiry;
        this.serialNumber = a.serialNumber ?? this.serialNumber;
      }

      const firstExpense = first?.expense;
      const firstDocument = first?.document;
      this.expenseExtra.set(firstExpense ? { ...firstExpense } : null);
      this.documentExtra.set(firstDocument ? { ...firstDocument } : null);
      this.keepExpense.set(!!firstExpense);
      this.keepDocument.set(!!firstDocument);

      // A multi-purchase scan belongs in the photo-led flow, which can
      // create all of them.
      this.extraAssets.set(Math.max(0, found.groups.length - 1));
    } catch (err) {
      this.aiError.set(
        err instanceof Error ? err.message : 'Could not read that photo.',
      );
    } finally {
      this.reading.set(false);
    }
  }

  /** Replacing the picture of an existing asset — no AI, no overwriting. */
  onPhotoOnly(urls: string[]): void {
    if (urls[0]) this.photo.set(urls[0]);
  }

  clearPhoto(): void {
    this.photo.set(null);
    this.aiError.set('');
    this.expenseExtra.set(null);
    this.documentExtra.set(null);
    this.extraAssets.set(0);
  }

  /** Hand a multi-product bill to the flow that can create all of them. */
  openSmartAdd(): void {
    this.flow.open('Anything');
  }

  async save(): Promise<void> {
    if (!this.canSave || this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');

    const fields = {
      name: this.name.trim(),
      brand: this.brand.trim() || undefined,
      category: this.category,
      roomId: this.roomId,
      image: this.photo() ?? undefined,
      purchaseDate: this.purchaseDate || undefined,
      purchasePrice: this.purchasePrice ?? undefined,
      warrantyExpiry: this.warrantyExpiry || undefined,
      serialNumber: this.serialNumber.trim() || undefined,
      notes: this.notes.trim() || undefined,
    };

    try {
      const existing = this.editing();
      if (existing) {
        await this.store.updateAsset({ ...existing, ...fields });
        this.toasts.show(`${fields.name} updated`, 'edit');
        this.flow.close();
        return;
      }

      const created = await this.store.addAsset(fields);

      /* The asset is saved by this point. If a linked record fails, say so
         rather than rolling back something the user can see was created. */
      const failed: string[] = [];

      const expense = this.expenseExtra();
      if (expense && this.keepExpense()) {
        try {
          await this.store.addExpense({
            title: expense.title.trim(),
            amount: Number(expense.amount ?? 0),
            date: expense.date,
            category: expense.category,
            assetId: created.id,
          });
        } catch {
          failed.push('the expense');
        }
      }

      const doc = this.documentExtra();
      if (doc && this.keepDocument()) {
        try {
          await this.store.addDocument({
            title: doc.title.trim(),
            kind: doc.kind,
            fileName: doc.fileName,
            sizeLabel: doc.sizeLabel,
            fileUrl: this.photo() ?? undefined,
            mimeType: this.photoMime(),
            assetId: created.id,
          });
        } catch {
          failed.push('the document');
        }
      }

      if (failed.length) {
        this.toasts.error(
          `${created.name} was added, but ${failed.join(' and ')} could not be saved.`,
        );
      } else {
        const extras = this.extraCount();
        this.toasts.show(
          extras
            ? `${created.name} added with ${extras} linked ${extras === 1 ? 'record' : 'records'}`
            : `${created.name} added to ${this.roomName(this.roomId)}`,
        );
      }

      this.flow.close();
    } catch (err) {
      // Leave the modal open with everything typed still in it.
      this.saveError.set(friendlyError(err));
    } finally {
      this.saving.set(false);
    }
  }

  /** The scan's own type, rather than assuming every photo is a JPEG. */
  private photoMime(): string {
    const photo = this.photo() ?? '';
    const match = /^data:([^;,]+)/.exec(photo);
    return match?.[1] ?? 'image/jpeg';
  }

  close(): void {
    this.flow.close();
  }
}
