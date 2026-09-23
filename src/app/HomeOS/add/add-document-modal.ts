import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../shared/modal/modal';
import { Icon } from '../shared/icon/icon';
import { Truncated } from '../shared/tooltip/truncated.directive';
import { HomeStore } from '../core/home-store';
import { ToastService } from '../shared/toast/toast';
import { AddFlowService } from './add-flow.service';
import { friendlyError } from '../core/errors';
import { DOCUMENT_KINDS, DocumentKind, HomeDocument } from '../core/models';

@Component({
  selector: 'app-add-document-modal',
  imports: [Modal, Icon, FormsModule, Truncated],
  template: `
    <app-modal
      [title]="editing() ? 'Edit document' : 'Add a document'"
      subtitle="Warranties, invoices, manuals and policies."
      (closed)="close()"
    >
      <div class="form">
        <label class="dropzone" [class.has-file]="fileName()">
          <input type="file" (change)="onFile($event)" hidden />
          @if (fileName(); as name) {
            <app-icon name="file-text" [size]="20" />
            <div class="file-meta">
              <span class="file-name" appTruncated>{{ name }}</span>
              <span class="file-size">{{ sizeLabel() }}</span>
            </div>
            <span class="replace">Replace</span>
          } @else {
            <app-icon name="upload" [size]="20" />
            <span>Choose a file to upload</span>
          }
        </label>

        <div class="field">
          <label class="field-label" for="doc-title">Title</label>
          <input id="doc-title" class="input" [(ngModel)]="title" placeholder="e.g. LG Fridge — Invoice" />
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="doc-kind">Type</label>
            <select id="doc-kind" class="select" [(ngModel)]="kind">
              @for (k of kinds; track k) {
                <option [value]="k">{{ k }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="doc-asset">Related asset</label>
            <select id="doc-asset" class="select" [(ngModel)]="assetId">
              <option value="">None</option>
              @for (asset of assets(); track asset.id) {
                <option [value]="asset.id">{{ asset.name }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      @if (saveError()) {
        <p class="save-error">{{ saveError() }}</p>
      }

      <ng-container modalFooter>
        <button type="button" class="btn btn-ghost" (click)="close()">Cancel</button>
        <button type="button" class="btn btn-primary" [disabled]="!canSave || saving()" (click)="save()">
          {{ saving() ? 'Saving…' : editing() ? 'Save changes' : 'Add document' }}
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

    .dropzone {
      display: flex;
      align-items: center;
      gap: var(--spacing-12);
      padding: var(--spacing-16);
      background: var(--color-eggshell);
      border: 1px dashed var(--color-soft-stone);
      border-radius: var(--radius-card);
      color: var(--color-smoke);
      font-size: var(--text-body-sm);
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .dropzone:hover {
      border-color: var(--color-sage);
      background: var(--color-sage-soft);
    }

    .dropzone.has-file {
      border-style: solid;
      color: var(--color-charcoal);
    }

    .file-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .file-name {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size {
      font-size: var(--text-caption);
      color: var(--color-smoke);
    }

    .replace {
      margin-left: auto;
      font-size: var(--text-caption);
      color: var(--color-sage);
      font-weight: 500;
    }
  `,
})
export class AddDocumentModal implements OnInit {
  private store = inject(HomeStore);
  private toasts = inject(ToastService);
  private flow = inject(AddFlowService);

  kinds = DOCUMENT_KINDS;
  assets = this.store.assets;
  saving = signal(false);
  saveError = signal('');
  fileName = signal('');
  sizeLabel = signal('');
  fileUrl = signal('');
  mimeType = signal('');

  title = '';
  kind: DocumentKind = 'Invoice';
  assetId = '';

  editing = signal<HomeDocument | null>(null);

  ngOnInit(): void {
    const { editId, assetId } = this.flow.options();
    const existing = editId
      ? this.store.documents().find((d) => d.id === editId)
      : undefined;

    if (existing) {
      this.editing.set(existing);
      this.title = existing.title;
      this.kind = existing.kind;
      this.assetId = existing.assetId ?? '';
      this.fileName.set(existing.fileName);
      this.sizeLabel.set(existing.sizeLabel);
      this.fileUrl.set(existing.fileUrl ?? '');
      this.mimeType.set(existing.mimeType ?? '');
      return;
    }

    this.assetId = assetId ?? '';
  }

  get canSave(): boolean {
    return this.title.trim().length > 0 && !!this.fileName();
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileName.set(file.name);
    this.sizeLabel.set(this.formatSize(file.size));
    this.mimeType.set(file.type);
    if (!this.title.trim()) {
      this.title = file.name.replace(/\.[^.]+$/, '');
    }

    // Keep the contents, not just the name — otherwise the document can
    // never be opened again.
    const reader = new FileReader();
    reader.onload = () => this.fileUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async save(): Promise<void> {
    if (!this.canSave || this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');

    const fields = {
      title: this.title.trim(),
      kind: this.kind,
      assetId: this.assetId || undefined,
      fileName: this.fileName(),
      sizeLabel: this.sizeLabel(),
      fileUrl: this.fileUrl() || undefined,
      mimeType: this.mimeType() || undefined,
    };

    try {
      const existing = this.editing();
      if (existing) {
        await this.store.updateDocument({ ...existing, ...fields });
      } else {
        await this.store.addDocument(fields);
      }
      this.toasts.show(existing ? 'Document updated' : 'Document added', 'file-plus');
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
