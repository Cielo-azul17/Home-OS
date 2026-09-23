import { Component, inject, Injectable, signal } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../../core/models';

export interface Toast {
  id: number;
  icon: IconName;
  message: string;
  tone: 'default' | 'error';
}

/** Failures get longer on screen — they're worth reading twice. */
const LIFETIME = { default: 3200, error: 6000 };

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  show(message: string, icon: IconName = 'check-circle'): void {
    this.push(message, icon, 'default');
  }

  /** Something the user tried to do didn't happen. Always say why. */
  error(message: string, icon: IconName = 'alert-triangle'): void {
    this.push(message, icon, 'error');
  }

  private push(message: string, icon: IconName, tone: Toast['tone']): void {
    const toast: Toast = { id: this.nextId++, icon, message, tone };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), LIFETIME[tone]);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}

@Component({
  selector: 'app-toast-host',
  imports: [Icon],
  template: `
    <div class="toast-host" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class.error]="toast.tone === 'error'" (click)="toasts.dismiss(toast.id)"
          [attr.role]="toast.tone === 'error' ? 'alert' : 'status'">
          <app-icon [name]="toast.icon" [size]="18" />
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-host {
      position: fixed;
      right: var(--spacing-24);
      bottom: var(--spacing-24);
      z-index: 80;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-8);
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: var(--spacing-12);
      padding: var(--spacing-12) var(--spacing-16);
      background: var(--color-charcoal);
      color: var(--color-surface);
      border-radius: var(--radius-button);
      box-shadow: var(--shadow-subtle);
      font-size: var(--text-body-sm);
      pointer-events: auto;
      cursor: pointer;
      animation: toast-in 0.18s ease-out;
      max-width: 420px;
    }

    .toast.error {
      background: var(--color-error);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 700px) {
      .toast-host {
        right: var(--spacing-16);
        left: var(--spacing-16);
        bottom: var(--spacing-80);
      }
    }
  `,
})
export class ToastHost {
  toasts = inject(ToastService);
}
