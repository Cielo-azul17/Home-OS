import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '../icon/icon';
import { ConfirmService } from '../confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, Icon],
  template: `
    @if (confirm.dialog()) {
      <div class="confirm-overlay" (click)="onCancel()">
        <div class="confirm-modal" (click)="$event.stopPropagation()">
          <div class="confirm-header">
            <h2>{{ confirm.dialog()?.title }}</h2>
            <button type="button" class="close-btn" (click)="onCancel()">
              <app-icon name="x" [size]="24" />
            </button>
          </div>

          <div class="confirm-body">
            <p>{{ confirm.dialog()?.message }}</p>
          </div>

          <div class="confirm-footer">
            <button type="button" class="btn btn-secondary" (click)="onCancel()">
              {{ confirm.dialog()?.cancelText }}
            </button>
            <button type="button" class="btn btn-primary btn-danger" (click)="onConfirm()">
              {{ confirm.dialog()?.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .confirm-modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .confirm-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .confirm-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: #333;
    }

    .confirm-body {
      padding: 20px 24px;
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
    }

    .confirm-body p {
      margin: 0;
    }

    .confirm-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #e5e7eb;
      color: #333;
    }

    .btn-secondary:hover {
      background: #d1d5db;
    }

    .btn-primary {
      background: #4b5563;
      color: white;
    }

    .btn-primary:hover {
      background: #3a4350;
    }

    .btn-danger {
      background: #dc2626 !important;
    }

    .btn-danger:hover {
      background: #b91c1c !important;
    }
  `]
})
export class ConfirmDialog {
  confirm = inject(ConfirmService);

  onConfirm() {
    const dialog = this.confirm.dialog();
    if (dialog) {
      dialog.onConfirm();
    }
  }

  onCancel() {
    const dialog = this.confirm.dialog();
    if (dialog) {
      dialog.onCancel();
    }
  }
}
