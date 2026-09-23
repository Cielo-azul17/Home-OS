import { Component, inject } from '@angular/core';
import { PageHeader } from '../shared/page-header/page-header';
import { Icon } from '../shared/icon/icon';
import { HomeStore } from '../core/home-store';
import { formatCurrency } from '../core/format';

@Component({
  selector: 'app-settings',
  imports: [PageHeader, Icon],
  template: `
    <div class="page-container">
      <app-page-header title="Settings" subtitle="Your home and how HomeOS works for you." />

      <section class="panel">
        <h2>Your home</h2>
        <dl class="facts">
          <div>
            <dt>Rooms</dt>
            <dd>{{ store.rooms().length }}</dd>
          </div>
          <div>
            <dt>Assets tracked</dt>
            <dd>{{ store.assets().length }}</dd>
          </div>
          <div>
            <dt>Documents stored</dt>
            <dd>{{ store.documents().length }}</dd>
          </div>
          <div>
            <dt>Open reminders</dt>
            <dd>{{ store.openReminders().length }}</dd>
          </div>
          <div>
            <dt>Estimated value</dt>
            <dd>{{ money(totalValue()) }}</dd>
          </div>
        </dl>
      </section>

      <section class="panel">
        <h2>Rooms</h2>
        <ul class="room-list">
          @for (room of store.roomSummaries(); track room.id) {
            <li>
              <span class="room-name">{{ room.name }}</span>
              <span class="room-count">{{ room.assetCount }} items</span>
            </li>
          }
        </ul>
      </section>

      <section class="panel muted-panel">
        <div class="soon">
          <app-icon name="sparkle" [size]="18" />
          <div>
            <p class="soon-title">Accounts, sharing and notifications</p>
            <p class="soon-text">
              Arriving with the backend. V1 keeps HomeOS to a single home on this device.
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .panel {
      background: var(--color-surface);
      border: 1px solid var(--color-soft-stone);
      border-radius: var(--radius-card);
      padding: var(--card-padding);
      margin-bottom: var(--spacing-24);
    }

    h2 {
      font-size: var(--text-body);
      font-weight: 500;
      color: var(--color-charcoal);
      margin-bottom: var(--spacing-16);
    }

    .facts {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-12);
    }

    .facts div {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--spacing-16);
    }

    dt {
      font-size: var(--text-body-sm);
      color: var(--color-smoke);
    }

    dd {
      margin: 0;
      font-size: var(--text-body-sm);
      font-weight: 500;
      color: var(--color-charcoal);
    }

    .room-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .room-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-12) 0;
      border-bottom: 1px solid var(--color-soft-stone);
    }

    .room-list li:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .room-list li:first-child {
      padding-top: 0;
    }

    .room-name {
      font-size: var(--text-body-sm);
      color: var(--color-charcoal);
    }

    .room-count {
      font-size: var(--text-caption);
      color: var(--color-smoke);
    }

    .muted-panel {
      background: var(--color-sage-soft);
      border-color: color-mix(in srgb, var(--color-sage) 18%, transparent);
    }

    .soon {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-12);
      color: var(--color-sage);
    }

    .soon-title {
      font-size: var(--text-body-sm);
      font-weight: 500;
      color: var(--color-charcoal);
    }

    .soon-text {
      margin-top: var(--spacing-4);
      font-size: var(--text-body-sm);
      color: var(--color-graphite);
    }
  `,
})
export class SettingsPage {
  store = inject(HomeStore);
  money = formatCurrency;

  totalValue(): number {
    return this.store.assets().reduce((sum, a) => sum + (a.purchasePrice ?? 0), 0);
  }
}
