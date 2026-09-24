import { Injectable, signal } from '@angular/core';

export interface ConfirmDialog {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  dialog = signal<ConfirmDialog | null>(null);

  confirm(options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialog.set({
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Delete',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => {
          this.dialog.set(null);
          resolve(true);
        },
        onCancel: () => {
          this.dialog.set(null);
          resolve(false);
        },
      });
    });
  }
}
