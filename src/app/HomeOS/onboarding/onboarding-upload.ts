import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icon } from '../shared/icon/icon';
import { HomeStore } from '../core/home-store';
import { Supabase } from '../core/backend/supabase-client';
import { AiService } from '../core/ai.service';
import { ASSET_CATEGORIES, EXPENSE_CATEGORIES, DOCUMENT_KINDS } from '../core/models';

interface ExtractedItem {
  key: string;
  kind: 'asset' | 'expense' | 'document';
  keep: boolean;
  open: boolean;
  data: any;
}

interface ProcessingState {
  totalBills: number;
  currentBill: number;
  startTime: number;
  elapsedSeconds: number;
}

@Component({
  selector: 'app-onboarding-upload',
  standalone: true,
  imports: [CommonModule, Icon, FormsModule],
  template: `
    <div class="upload-overlay">
      <div class="upload-modal">
        <div class="modal-header">
          <div class="header-content">
            <h2>Get Started with HomeOS</h2>
            <p class="header-description">
              Your AI-powered home management assistant.<br/>
              Upload bills and invoices to automatically organize your home.
            </p>
          </div>
          <button type="button" class="close-btn" (click)="close()">
            <app-icon name="x" [size]="24" />
          </button>
        </div>


        <div class="upload-content">
                @if (!uploading() && !reviewing()) {
                  <div
                    class="upload-area"
                    (dragover)="dragOver.set(true)"
                    (dragleave)="dragOver.set(false)"
                    (drop)="onDrop($event)"
                    [class.drag-active]="dragOver()"
                  >
                    <app-icon name="camera" [size]="64" class="upload-icon" />
                    <h3>Upload Bills or Invoices</h3>
                    <p class="upload-hint">Drag multiple files here or click to select</p>
                    <input
                      type="file"
                      #fileInput
                      hidden
                      accept="image/*,.pdf"
                      multiple
                      (change)="onFileSelected($event)"
                    />
                    <button
                      type="button"
                      class="btn btn-primary"
                      (click)="fileInput.click()"
                    >
                      Choose File
                    </button>
                  </div>
                } @else if (uploading()) {
                  <div class="loading-content">
                    <div class="spinner"></div>
                    <p>Processing your bill...</p>
                    <p class="loading-subtext">AI is extracting details and organizing items</p>
                    @if (processingState().totalBills > 0) {
                      <div class="progress-info">
                        <span class="bill-counter">Bill {{ processingState().currentBill }} of {{ processingState().totalBills }}</span>
                        <span class="elapsed-time">{{ processingState().elapsedSeconds }}s</span>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="(processingState().currentBill / processingState().totalBills) * 100"></div>
                      </div>
                    }
                  </div>
                } @else if (reviewing()) {
                  <div class="review-container">
                    <h3>Review Extracted Items</h3>
                    @if (extractionError()) {
                      <div class="error-message">
                        <div class="error-icon">⚠️</div>
                        <div class="error-content">
                          <p class="error-title">Extraction Failed</p>
                          <p class="error-text">{{ extractionError() }}</p>
                        </div>
                      </div>
                      <div class="error-actions">
                        <button type="button" class="btn btn-secondary" (click)="cancelReview()">Back</button>
                        <button type="button" class="btn btn-primary" (click)="retryExtraction()">Retry</button>
                      </div>
                    } @else if (extractedItems().length === 0) {
                      <p class="empty-message">No items extracted from the bills.</p>
                    } @else {
                      <div class="items-list">
                        @for (item of extractedItems(); track item.key) {
                          <div class="item-record" [class.off]="!item.keep">
                            <div class="record-head">
                              <button
                                type="button"
                                class="check"
                                [class.on]="item.keep"
                                (click)="toggleItem(item.key)"
                              >
                                @if (item.keep) {
                                  <app-icon name="check" [size]="12" />
                                }
                              </button>

                              <button type="button" class="record-main" (click)="toggleOpen(item.key)">
                                @if (item.kind === 'asset') {
                                  <app-icon name="box" [size]="16" />
                                  <span class="record-kind">Product</span>
                                  <span class="record-title">{{ item.data.name }}</span>
                                  @if (item.data.brand) { <span class="record-detail">{{ item.data.brand }}</span> }
                                } @else if (item.kind === 'expense') {
                                  <app-icon name="receipt" [size]="16" />
                                  <span class="record-kind">Expense</span>
                                  <span class="record-title">{{ item.data.title }}</span>
                                  <span class="record-detail">₹{{ item.data.amount }}</span>
                                } @else if (item.kind === 'document') {
                                  <app-icon name="file-text" [size]="16" />
                                  <span class="record-kind">Document</span>
                                  <span class="record-title">{{ item.data.title }}</span>
                                }
                                <app-icon [name]="item.open ? 'chevron-down' : 'chevron-right'" [size]="16" class="caret" />
                              </button>
                            </div>

                            @if (item.open) {
                              <div class="record-edit">
                                @if (item.kind === 'asset') {
                                  <div class="field">
                                    <label class="field-label">Name</label>
                                    <input class="input" [(ngModel)]="item.data.name" />
                                  </div>
                                  <div class="field-row">
                                    <div class="field">
                                      <label class="field-label">Brand</label>
                                      <input class="input" [(ngModel)]="item.data.brand" />
                                    </div>
                                    <div class="field">
                                      <label class="field-label">Category</label>
                                      <select class="select" [(ngModel)]="item.data.category">
                                        @for (cat of assetCategories; track cat) {
                                          <option [value]="cat">{{ cat }}</option>
                                        }
                                      </select>
                                    </div>
                                  </div>
                                  <div class="field">
                                    <label class="field-label">Room</label>
                                    <select class="select" [(ngModel)]="item.data.roomId">
                                      @for (room of rooms(); track room.id) {
                                        <option [value]="room.id">{{ room.name }}</option>
                                      }
                                    </select>
                                  </div>
                                  <div class="field-row">
                                    <div class="field">
                                      <label class="field-label">Purchase Date</label>
                                      <input class="input" type="date" [(ngModel)]="item.data.purchaseDate" />
                                    </div>
                                    <div class="field">
                                      <label class="field-label">Price</label>
                                      <input class="input" type="number" [(ngModel)]="item.data.purchasePrice" />
                                    </div>
                                  </div>
                                  <div class="field-row">
                                    <div class="field">
                                      <label class="field-label">Warranty Expiry</label>
                                      <input class="input" type="date" [(ngModel)]="item.data.warrantyExpiry" />
                                    </div>
                                    <div class="field">
                                      <label class="field-label">Serial Number</label>
                                      <input class="input" [(ngModel)]="item.data.serialNumber" />
                                    </div>
                                  </div>
                                } @else if (item.kind === 'expense') {
                                  <div class="field">
                                    <label class="field-label">Title</label>
                                    <input class="input" [(ngModel)]="item.data.title" />
                                  </div>
                                  <div class="field-row">
                                    <div class="field">
                                      <label class="field-label">Amount (₹)</label>
                                      <input class="input" type="number" [(ngModel)]="item.data.amount" />
                                    </div>
                                    <div class="field">
                                      <label class="field-label">Date</label>
                                      <input class="input" type="date" [(ngModel)]="item.data.date" />
                                    </div>
                                  </div>
                                  <div class="field">
                                    <label class="field-label">Category</label>
                                    <select class="select" [(ngModel)]="item.data.category">
                                      @for (cat of expenseCategories; track cat) {
                                        <option [value]="cat">{{ cat }}</option>
                                      }
                                    </select>
                                  </div>
                                } @else if (item.kind === 'document') {
                                  <div class="field">
                                    <label class="field-label">Title</label>
                                    <input class="input" [(ngModel)]="item.data.title" />
                                  </div>
                                  <div class="field">
                                    <label class="field-label">Type</label>
                                    <select class="select" [(ngModel)]="item.data.kind">
                                      @for (kind of documentKinds; track kind) {
                                        <option [value]="kind">{{ kind }}</option>
                                      }
                                    </select>
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>
                      <div class="review-actions">
                        <button type="button" class="btn btn-secondary" (click)="cancelReview()">Back</button>
                        <button type="button" class="btn btn-primary" (click)="saveItems()" [disabled]="extractedItems().filter(i => i.keep).length === 0">
                          Save Items
                        </button>
                      </div>
                    }
                  </div>
                }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
    }

    .upload-modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      padding: 0;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9f9f9;
    }

    .header-content {
      flex: 1;
    }

    .modal-header h2 {
      margin: 0 0 8px 0;
      font-size: 22px;
      font-weight: 700;
      color: #1f2937;
    }

    .header-description {
      margin: 0;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
    }

    .close-btn:hover {
      color: #333;
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      gap: 0;
    }

    .tab {
      flex: 1;
      padding: 16px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab:hover {
      color: #333;
    }

    .tab.active {
      color: #4b5563;
      border-bottom-color: #4b5563;
    }

    .tab-content {
      flex: 1;
      padding: 24px;
    }

    .description {
      margin: 0 0 20px 0;
      color: #666;
      font-size: 14px;
    }

    .upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 48px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 300px;
      background: white;
    }

    .upload-area:hover {
      border-color: #4b5563;
      background: #f9fafb;
    }

    .upload-area.drag-active {
      border-color: #4b5563;
      background: #f0f4ff;
      border-width: 2px;
    }

    .upload-icon {
      color: #4b5563;
    }

    .upload-area h3 {
      margin: 8px 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .upload-hint {
      margin: 0 0 20px 0;
      color: #666;
      font-size: 14px;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .loading-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .loading-subtext {
      color: #999;
      font-size: 12px !important;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: 300px;
      font-size: 13px;
      color: #666;
      margin-top: 20px;
      margin-bottom: 12px;
    }

    .bill-counter {
      font-weight: 500;
    }

    .elapsed-time {
      color: #999;
    }

    .progress-bar {
      width: 100%;
      max-width: 300px;
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .progress-fill {
      height: 100%;
      background: #4b5563;
      transition: width 0.3s ease;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .form-group input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #4b5563;
      box-shadow: 0 0 0 3px rgba(75, 85, 99, 0.1);
    }


    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e5e7eb;
      border-top-color: #4b5563;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-top: 24px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #ecfdf5;
      border: 1px solid #d1fae5;
      border-radius: 6px;
      color: #065f46;
      font-size: 14px;
      margin-top: 12px;
    }

    .success-message app-icon {
      color: #10b981;
      flex-shrink: 0;
    }

    .room-form {
      margin-bottom: 20px;
    }

    .room-form .form-group {
      margin-bottom: 0;
    }

    .input-with-button {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .input-with-button input {
      flex: 1;
    }

    .rooms-list {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .rooms-list .btn {
      width: 100%;
    }

    .rooms-list h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .rooms-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .room-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .room-card:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    .room-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #e5e7eb;
      border-radius: 6px;
      color: #4b5563;
      flex-shrink: 0;
    }

    .room-info {
      flex: 1;
    }

    .room-name {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    }

    .room-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .icon-btn:hover {
      background: #e5e7eb;
      color: #333;
    }

    .icon-btn.delete:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .review-container {
      padding: 20px;
      min-height: 300px;
      display: flex;
      flex-direction: column;
    }

    .review-container h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .empty-message {
      text-align: center;
      color: #666;
      padding: 40px 20px;
      font-size: 14px;
    }

    .items-list {
      flex: 1;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow-y: auto;
      margin-bottom: 16px;
      max-height: 450px;
      background: white;
    }

    .item-record {
      border-bottom: 1px solid #f3f4f6;
    }

    .item-record:last-child {
      border-bottom: none;
    }

    .item-record.off {
      opacity: 0.6;
      background: #fafafa;
    }

    .record-head {
      display: flex;
      align-items: stretch;
    }

    .check {
      width: 40px;
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d1d5db;
      flex-shrink: 0;
      border-right: 1px solid #f3f4f6;
      transition: all 0.2s;
    }

    .check:hover {
      background: #f9fafb;
      color: #9ca3af;
    }

    .check.on {
      color: #4b5563;
      background: #f0f4ff;
    }

    .record-main {
      flex: 1;
      border: none;
      background: none;
      cursor: pointer;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: inherit;
      text-align: left;
      transition: background 0.2s;
    }

    .record-main:hover {
      background: #f9fafb;
    }

    .record-main app-icon:first-child {
      color: #4b5563;
      flex-shrink: 0;
    }

    .record-kind {
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      background: #4b5563;
      padding: 2px 8px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .record-title {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .record-detail {
      font-size: 13px;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .caret {
      color: #9ca3af;
      flex-shrink: 0;
    }

    .record-edit {
      padding: 16px;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
      display: grid;
      gap: 12px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .field-label {
      font-size: 12px;
      font-weight: 600;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input,
    .select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .input:focus,
    .select:focus {
      outline: none;
      border-color: #4b5563;
      box-shadow: 0 0 0 3px rgba(75, 85, 99, 0.1);
    }

    .review-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .review-actions .btn {
      min-width: 100px;
    }

    .error-message {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .error-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .error-content {
      flex: 1;
    }

    .error-title {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: #991b1b;
    }

    .error-text {
      margin: 0;
      font-size: 13px;
      color: #7f1d1d;
      line-height: 1.4;
    }

    .error-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .error-actions .btn {
      min-width: 100px;
    }
  `]
})
export class OnboardingUpload {
  private store = inject(HomeStore);
  private supabase = inject(Supabase);
  private ai = inject(AiService);

  dragOver = signal(false);
  uploading = signal(false);
  reviewing = signal(false);
  extractionError = signal('');
  extractedItems = signal<ExtractedItem[]>([]);

  // For edit forms
  assetCategories = ASSET_CATEGORIES;
  expenseCategories = EXPENSE_CATEGORIES;
  documentKinds = DOCUMENT_KINDS;
  rooms = this.store.rooms;

  processingState = signal<ProcessingState>({ totalBills: 0, currentBill: 0, startTime: 0, elapsedSeconds: 0 });

  private abortController: AbortController | null = null;
  private timerInterval: number | null = null;
  private lastFiles: FileList | null = null;

  onClose = output<void>();

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.processFiles(files);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.processFiles(input.files);
    }
  }

  async processFiles(files: FileList) {
    this.uploading.set(true);
    this.abortController = new AbortController();
    this.extractedItems.set([]);
    this.extractionError.set('');
    this.lastFiles = files;

    const startTime = Date.now();
    this.processingState.set({ totalBills: files.length, currentBill: 0, startTime, elapsedSeconds: 0 });

    // Start timer to update elapsed seconds
    this.timerInterval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      this.processingState.update(state => ({ ...state, elapsedSeconds: elapsed }));
    }, 100);

    try {
      const fileArray = Array.from(files);
      const urls = await Promise.all(fileArray.map(f => this.fileToDataUrl(f)));
      const rooms = this.store.rooms();

      for (let i = 0; i < urls.length; i++) {
        if (this.abortController.signal.aborted) break;

        this.processingState.update(state => ({ ...state, currentBill: i + 1 }));

        try {
          const found = await this.ai.identify(urls[i], rooms, undefined, this.abortController.signal);
          console.log(`[Bill ${i + 1}] Gemini extracted:`, found);
          console.log(`[Bill ${i + 1}] Groups count:`, found.groups?.length ?? 0);

          if (!found.groups || found.groups.length === 0) {
            console.warn(`[Bill ${i + 1}] No items extracted`);
          }

          found.groups?.forEach((group, gi) => {
            if (group.asset) {
              const a = group.asset;
              const roomId = rooms.some(r => r.id === a.roomId) ? a.roomId : (rooms[0]?.id ?? '');
              this.extractedItems.update(items => [...items, {
                key: `asset-${i}-${gi}`,
                kind: 'asset',
                keep: true,
                open: false,
                data: { name: a.name, brand: a.brand ?? '', category: a.category, roomId, purchaseDate: a.purchaseDate ?? '', purchasePrice: a.purchasePrice, warrantyExpiry: a.warrantyExpiry ?? '', serialNumber: a.serialNumber ?? '' }
              }]);
            }
            if (group.expense) {
              const e = group.expense;
              this.extractedItems.update(items => [...items, {
                key: `expense-${i}-${gi}`,
                kind: 'expense',
                keep: true,
                open: false,
                data: { title: e.title, amount: e.amount, date: e.date, category: e.category }
              }]);
            }
            if (group.document && group.document.fileName) {
              const d = group.document;
              this.extractedItems.update(items => [...items, {
                key: `doc-${i}-${gi}`,
                kind: 'document',
                keep: true,
                open: false,
                data: { title: d.title, kind: d.kind, fileName: d.fileName, sizeLabel: d.sizeLabel ?? '' }
              }]);
            }
          });
        } catch (err) {
          console.error('Error processing file', i, err);
        }
      }

      this.uploading.set(false);
      if (this.timerInterval) clearInterval(this.timerInterval);

      // Check if any items were extracted
      if (this.extractedItems().length === 0) {
        console.warn('No items extracted from all bills');
        this.extractionError.set('No items could be extracted from the bills. The image may be unclear or invalid. Try uploading a clearer bill image.');
        this.reviewing.set(true);
      } else {
        this.reviewing.set(true);
      }
    } catch (err) {
      console.error('Error in processFiles', err);
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.uploading.set(false);
      this.extractionError.set(err instanceof Error ? err.message : 'Failed to process bills. Please try again.');
      this.reviewing.set(true);
    }
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  toggleItem(key: string) {
    this.extractedItems.update(items =>
      items.map(item => item.key === key ? { ...item, keep: !item.keep } : item)
    );
  }

  toggleOpen(key: string) {
    this.extractedItems.update(items =>
      items.map(item => item.key === key ? { ...item, open: !item.open } : item)
    );
  }

  retryExtraction() {
    if (this.lastFiles) {
      this.reviewing.set(false);
      this.processFiles(this.lastFiles);
    }
  }

  async saveItems() {
    for (const item of this.extractedItems()) {
      if (!item.keep) continue;
      if (item.kind === 'asset') {
        void this.store.addAsset(item.data);
      } else if (item.kind === 'expense') {
        void this.store.addExpense(item.data);
      } else if (item.kind === 'document') {
        void this.store.addDocument(item.data);
      }
    }
    this.finishAndClose();
  }

  cancelReview() {
    this.reviewing.set(false);
    this.extractedItems.set([]);
  }

  private finishAndClose() {
    this.reviewing.set(false);
    this.onClose.emit();
  }

  close() {
    this.onClose.emit();
  }
}
