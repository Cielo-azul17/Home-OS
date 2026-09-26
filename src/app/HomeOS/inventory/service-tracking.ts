import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceRequest, ServiceProvider } from '../core/models';

@Component({
  selector: 'app-service-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (request(); as req) {
      <div class="tracking-container">
        <div class="status-banner" [ngClass]="'status-' + req.status">
          <div class="status-icon">
            {{ getStatusIcon(req.status) }}
          </div>
          <div>
            <div class="status-title">{{ getStatusLabel(req.status) }}</div>
            @if (provider(); as p) {
              <div class="status-detail">{{ p.name }} — {{ req.scheduledDate }}</div>
            }
          </div>
        </div>

        <div class="timeline-section">
          <h3 class="section-title">Timeline</h3>
          <div class="timeline">
            <div class="timeline-item" [ngClass]="{ completed: isCompleted('submitted') }">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-date">{{ formatDate(req.createdAt) }}</div>
                <div class="timeline-text">Service request created</div>
              </div>
            </div>

            @if (req.status !== 'pending') {
              <div class="timeline-item" [ngClass]="{ completed: isCompleted('confirmed') }">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-date">{{ formatDate(req.updatedAt) }}</div>
                  <div class="timeline-text">Provider confirmed</div>
                </div>
              </div>
            }

            @if (req.status === 'in_progress' || req.status === 'completed') {
              <div class="timeline-item" [ngClass]="{ completed: isCompleted('in_progress') }">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-date">{{ req.scheduledDate }}</div>
                  <div class="timeline-text">Service in progress</div>
                </div>
              </div>
            }

            @if (req.status === 'completed') {
              <div class="timeline-item completed">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-date">{{ formatDate(req.updatedAt) }}</div>
                  <div class="timeline-text">Service completed</div>
                </div>
              </div>
            }
          </div>
        </div>

        @if (provider(); as p) {
          <div class="provider-section">
            <h3 class="section-title">Provider Contact</h3>
            <div class="provider-info">
              <div class="info-row">
                <span class="label">Name:</span>
                <span>{{ p.name }}</span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="phone">{{ p.phone }}</span>
              </div>
              <div class="info-row">
                <span class="label">Distance:</span>
                <span>{{ p.distance | number: '1.1-1' }} km away</span>
              </div>
            </div>
          </div>
        }

        @if (req.notes) {
          <div class="notes-section">
            <h3 class="section-title">Notes</h3>
            <p class="notes-text">{{ req.notes }}</p>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .tracking-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .status-banner {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .status-banner.status-pending {
      background: #fef3c7;
      border-color: #fbbf24;
    }

    .status-banner.status-confirmed {
      background: #dbeafe;
      border-color: #3b82f6;
    }

    .status-banner.status-in_progress {
      background: #d1fae5;
      border-color: #10b981;
    }

    .status-banner.status-completed {
      background: #dcfce7;
      border-color: #22c55e;
    }

    .status-banner.status-cancelled {
      background: #fee2e2;
      border-color: #ef4444;
    }

    .status-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .status-title {
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
    }

    .status-detail {
      font-size: 13px;
      color: #666;
      margin-top: 4px;
    }

    .timeline-section,
    .provider-section,
    .notes-section {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
    }

    .section-title {
      margin: 0 0 12px 0;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 0.5px;
    }

    .timeline {
      position: relative;
      padding-left: 30px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 20px;
      bottom: 0;
      width: 2px;
      background: #e5e7eb;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 20px;
    }

    .timeline-dot {
      position: absolute;
      left: -28px;
      top: 0;
      width: 12px;
      height: 12px;
      border: 3px solid white;
      border-radius: 50%;
      background: #d1d5db;
      box-shadow: 0 0 0 1px #d1d5db;
    }

    .timeline-item.completed .timeline-dot {
      background: #10b981;
      box-shadow: 0 0 0 1px #10b981;
    }

    .timeline-date {
      font-weight: 600;
      color: #1f2937;
      font-size: 13px;
    }

    .timeline-text {
      font-size: 13px;
      color: #666;
      margin-top: 2px;
    }

    .provider-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
    }

    .label {
      color: #666;
      font-weight: 500;
    }

    .phone {
      color: #0ea5e9;
      cursor: pointer;
    }

    .notes-text {
      margin: 0;
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    }
  `]
})
export class ServiceTracking {
  request = input.required<ServiceRequest>();
  provider = input<ServiceProvider | null>(null);

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: '⏳',
      confirmed: '✓',
      in_progress: '🔄',
      completed: '✅',
      cancelled: '✗',
    };
    return icons[status] || '•';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  isCompleted(stage: string): boolean {
    const request = this.request();
    const stageOrder = ['submitted', 'confirmed', 'in_progress', 'completed'];
    const statusOrder = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    return statusOrder.indexOf(request.status) >= stageOrder.indexOf(stage);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
