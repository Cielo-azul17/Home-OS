import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p>{{ subtitle() }}</p>
        }
      </div>
      <div class="actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--spacing-16);
      flex-wrap: wrap;
      margin-bottom: var(--spacing-24);
    }

    h1 {
      font-size: var(--text-heading-sm);
      font-weight: 500;
      letter-spacing: -0.01em;
      color: var(--color-charcoal);
    }

    p {
      margin-top: var(--spacing-4);
      font-size: var(--text-body-sm);
      color: var(--color-smoke);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-12);
    }
  `,
})
export class PageHeader {
  title = input.required<string>();
  subtitle = input('');
}
