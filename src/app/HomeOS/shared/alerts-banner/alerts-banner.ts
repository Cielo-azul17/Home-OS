import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '../icon/icon';
import { AlertsService } from '../../core/alerts.service';

@Component({
  selector: 'app-alerts-banner',
  imports: [CommonModule, Icon],
  template: `
    @if (alerts.criticalCount() > 0; as count) {
      <div class="alerts-banner" [class]="'severity-' + topAlert?.severity">
        <div class="alerts-content">
          <app-icon [name]="topAlert?.icon || 'alert-triangle'" [size]="20" />
          <div class="alert-text">
            <strong>{{ topAlert?.title }}</strong>
            <p>{{ topAlert?.message }}</p>
          </div>
          @if (count > 1) {
            <span class="badge">+{{ count - 1 }}</span>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .alerts-banner {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 14px;
    }

    .alerts-banner.severity-critical {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #7f1d1d;
    }

    .alerts-banner.severity-warning {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      color: #78350f;
    }

    .alerts-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .alert-text {
      flex: 1;
    }

    .alert-text strong {
      display: block;
      font-weight: 600;
    }

    .alert-text p {
      margin: 4px 0 0 0;
      opacity: 0.9;
    }

    .badge {
      background: rgba(0, 0, 0, 0.1);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
  `]
})
export class AlertsBanner {
  alerts = inject(AlertsService);

  get topAlert() {
    const alerts = this.alerts.alerts();
    return alerts.find(a => a.severity === 'critical') || alerts[0];
  }
}
