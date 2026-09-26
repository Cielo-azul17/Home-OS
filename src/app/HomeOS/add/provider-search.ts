import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modal } from '../shared/modal/modal';
import { Icon } from '../shared/icon/icon';
import { Map } from '../shared/map/map';
import { ServiceProvider } from '../core/models';

@Component({
  selector: 'app-provider-search',
  standalone: true,
  imports: [CommonModule, Modal, Map],
  template: `
    <app-modal
      [title]="selectedProvider() ? 'Provider Details' : 'Select Provider'"
      [subtitle]="selectedProvider() ? '' : 'Choose a service provider near you'"
      (closed)="close()"
    >
      @if (!selectedProvider()) {
        <div class="search-info">
          <p>Found {{ providers().length }} providers matching your needs</p>
        </div>

        <div class="providers-list">
          @for (provider of providers(); track provider.id) {
            <div class="provider-card" (click)="viewDetails(provider)">
              <div class="provider-header">
                <div>
                  <div class="provider-name">{{ provider.name }}</div>
                  <div class="provider-distance">{{ provider.distance | number: '1.1-1' }} km away • 📍 View details</div>
                </div>
                <div class="provider-rating">
                  <span class="stars">{{ getStars(provider.rating) }}</span>
                  <span>({{ provider.reviewCount }})</span>
                </div>
              </div>
              <div class="provider-details">
                <span>📞 {{ provider.phone }}</span>
                <span>{{ provider.priceRange }}</span>
              </div>
            </div>
          }
        </div>

        <ng-container modalFooter>
          <button type="button" class="btn btn-ghost" (click)="close()">Cancel</button>
        </ng-container>
      } @else if (selectedProvider(); as provider) {
        <div class="provider-detail-layout">
          <div class="provider-content">
            <div class="provider-details-column">
              <!-- Provider Header -->
              <div class="provider-header">
                <div class="provider-avatar">🏢</div>
                <div class="provider-info">
                  <div class="provider-name-badge">
                    <h3 class="provider-name">{{ provider.name }}</h3>
                    <span class="verified-badge">✓ Verified</span>
                  </div>
                  <p class="provider-type">Service Provider</p>
                  <div class="rating">
                    <span class="stars">{{ getStars(provider.rating) }}</span>
                    <span class="rating-value">{{ provider.rating | number: '1.1-1' }} ({{ provider.reviewCount }} reviews)</span>
                  </div>
                </div>
              </div>

              <!-- Address Section -->
              <div class="info-section">
                <div class="section-icon">📍</div>
                <div class="section-content">
                  <div class="address-header">
                    <div>
                      <div class="address-main">{{ provider.address }}</div>
                      <div class="address-sub">Pune, Maharashtra 411001</div>
                    </div>
                    <button type="button" class="get-directions-btn" (click)="openDirections(provider.lat, provider.lng, provider.address)">🧭 Get Directions</button>
                  </div>
                  <div class="distance-info">{{ provider.distance | number: '1.1-1' }} km away • Coordinates: ({{ provider.lat }}, {{ provider.lng }})</div>
                </div>
              </div>

              <!-- Phone Section -->
              <div class="info-section">
                <div class="section-icon">📞</div>
                <div class="section-content">
                  <div class="label">Phone</div>
                  <div class="value">{{ provider.phone }}</div>
                </div>
              </div>

              <!-- Price Section -->
              <div class="info-section">
                <div class="section-icon">💰</div>
                <div class="section-content">
                  <div class="label">Estimated Price</div>
                  <div class="value">{{ provider.priceRange }}</div>
                </div>
              </div>

              <!-- Service Areas Section -->
              <div class="info-section">
                <div class="section-icon">🚚</div>
                <div class="section-content">
                  <div class="label">Service Areas</div>
                  <div class="value">Pune, Kothrud, Karve Nagar, Shivajinagar, Deccan</div>
                </div>
              </div>
            </div>

            <div class="provider-map">
              <app-map
                [providerLocation]="{ lat: provider.lat, lng: provider.lng }"
                [providerName]="provider.name"
                [address]="provider.address"
              />
            </div>
          </div>

          <button type="button" class="btn btn-ghost" modalFooter (click)="selectedProvider.set(null)">Back</button>
          <button type="button" class="btn btn-primary" modalFooter (click)="bookService()">📅 Book Service</button>
        </div>
      }
    </app-modal>
  `,
  styles: [`
    .search-info {
      padding: 12px;
      background: #f0f4ff;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .search-info p {
      margin: 0;
      font-size: 14px;
      color: #4b5563;
      font-weight: 500;
    }

    .providers-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .provider-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .provider-card:hover {
      border-color: #4b5563;
      box-shadow: 0 2px 8px rgba(75, 85, 99, 0.1);
      background: #f9fafb;
    }

    .provider-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .provider-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
    }

    .provider-distance {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }

    .provider-rating {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #666;
    }

    .stars {
      color: #fbbf24;
      font-size: 14px;
    }

    .provider-details {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #666;
      padding-top: 8px;
      border-top: 1px solid #f3f4f6;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
    }

    .btn-ghost {
      background: transparent;
      color: #666;
      border: 1px solid #d1d5db;
    }

    .btn-ghost:hover {
      background: #f9fafb;
      color: #333;
    }

    /* 2-Column Layout */
    .provider-detail-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .provider-content {
      flex: 1;
      display: flex;
      gap: 24px;
      padding-bottom: 16px;
      overflow-y: auto;
    }

    .provider-details-column {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .provider-map {
      flex: 0 0 350px;
      min-height: 300px;
    }

    /* Provider Header */
    .provider-header {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .provider-avatar {
      width: 56px;
      height: 56px;
      min-flex: 0;
      background: #e8eef5;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }

    .provider-info {
      flex: 1;
      min-width: 0;
    }

    .provider-name-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .provider-name {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .verified-badge {
      background: #d1fae5;
      color: #047857;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .provider-type {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #666;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .stars {
      color: #fbbf24;
      font-size: 16px;
      letter-spacing: 2px;
    }

    .rating-value {
      font-size: 13px;
      color: #666;
      font-weight: 500;
    }

    /* Info Sections */
    .info-section {
      display: flex;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .provider-details-column > .info-section:last-of-type {
      border-bottom: none;
    }

    .section-icon {
      font-size: 24px;
      min-flex: 0;
    }

    .section-content {
      flex: 1;
      min-width: 0;
    }

    .label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 500;
    }

    .address-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }

    .address-main {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 2px;
    }

    .address-sub {
      font-size: 13px;
      color: #666;
    }

    .distance-info {
      font-size: 12px;
      color: #999;
      margin-top: 8px;
    }

    .get-directions-btn {
      background: #e8eef5;
      color: #4b5563;
      border: none;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .get-directions-btn:hover {
      background: #d1dff0;
    }

  `]
})
export class ProviderSearch {
  providers = input.required<ServiceProvider[]>();
  selected = output<ServiceProvider>();
  closeModal = output<void>();

  selectedProvider = signal<ServiceProvider | null>(null);

  viewDetails(provider: ServiceProvider): void {
    this.selectedProvider.set(provider);
  }

  bookService(): void {
    const provider = this.selectedProvider();
    if (provider) {
      this.selected.emit(provider);
    }
  }

  close(): void {
    this.closeModal.emit();
  }

  getStars(rating: number): string {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(5 - full - half);
  }

  openDirections(lat: number, lng: number, address: string): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  }
}
