import { Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../../core/models';

@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  template: `
    <div class="empty">
      <div class="badge">
        <app-icon [name]="icon()" [size]="24" />
      </div>
      <h3>{{ title() }}</h3>
      <p>{{ message() }}</p>
      @if (actionLabel()) {
        <button type="button" class="btn btn-primary" (click)="action.emit()">
          <app-icon name="plus" [size]="16" />
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: `
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-12);
      padding: var(--spacing-48) var(--spacing-24);
      text-align: center;
    }

    .badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: var(--radius-full);
      background: var(--color-stone);
      color: var(--color-smoke);
      margin-bottom: var(--spacing-4);
    }

    h3 {
      font-size: var(--text-subheading);
      font-weight: 500;
      color: var(--color-charcoal);
    }

    p {
      font-size: var(--text-body-sm);
      color: var(--color-smoke);
      max-width: 340px;
      line-height: 1.5;
    }

    button {
      margin-top: var(--spacing-8);
    }
  `,
})
export class EmptyState {
  icon = input<IconName>('inbox');
  title = input.required<string>();
  message = input('');
  actionLabel = input('');
  action = output<void>();
}
