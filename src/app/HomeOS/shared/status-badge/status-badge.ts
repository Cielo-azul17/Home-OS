import { Component, input } from '@angular/core';
import { BadgeTone } from '../../core/models';

/* Design system: "Use compact pills for warranty active / expiring soon /
   maintenance due / repair pending / completed." */

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="'tone-' + tone()">{{ label() }}</span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px var(--spacing-8);
      border-radius: var(--radius-full);
      font-size: var(--text-caption);
      font-weight: 500;
      line-height: 1.4;
      white-space: nowrap;
    }

    .tone-success {
      background: var(--color-success-soft);
      color: var(--color-success);
    }

    .tone-warning {
      background: var(--color-warning-soft);
      color: var(--color-warning);
    }

    .tone-error {
      background: var(--color-error-soft);
      color: var(--color-error);
    }

    .tone-sage {
      background: var(--color-sage-soft);
      color: var(--color-sage);
    }

    .tone-neutral {
      background: var(--color-stone);
      color: var(--color-smoke);
    }
  `,
})
export class StatusBadge {
  label = input.required<string>();
  tone = input<BadgeTone>('neutral');
}
