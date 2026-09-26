import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modal } from '../shared/modal/modal';
import { Icon } from '../shared/icon/icon';
import { ServiceProvider } from '../core/models';

@Component({
  selector: 'app-provider-search',
  standalone: true,
  imports: [CommonModule, Modal],
  template: `
    <app-modal
      [title]="selectedProvider() ? 'Provider Details' : 'Select Provider'"
      [subtitle]="selectedProvider() ? selectedProvider()!.name : 'Choose a service provider near you'"
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
        <div class="provider-detail">
          <div class="detail-section">
            <div class="back-btn" (click)="selectedProvider.set(null)">← Back to providers</div>

            <div class="detail-rating">
              <span class="stars">{{ getStars(provider.rating) }}</span>
              <span class="rating-count">({{ provider.reviewCount }} reviews)</span>
            </div>
          </div>

          <div class="detail-section">
            <p class="section-title">📍 Location</p>
            <div class="map-container">
              <div class="map-view">📍 Map: {{ provider.address }} ({{ provider.lat }}, {{ provider.lng }})</div>
              <p class="distance">{{ provider.distance | number: '1.1-1' }} km away</p>
            </div>
          </div>

          <div class="detail-section">
            <p class="section-title">📞 Contact</p>
            <p class="detail-text">{{ provider.phone }}</p>
          </div>

          <div class="detail-section">
            <p class="section-title">💰 Price Range</p>
            <p class="detail-text">{{ provider.priceRange }}</p>
          </div>

          <ng-container modalFooter>
            <button type="button" class="btn btn-ghost" (click)="selectedProvider.set(null)">Back</button>
            <button type="button" class="btn btn-primary" (click)="bookService()">✓ Book Service</button>
          </ng-container>
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

    .provider-detail {
      padding: 0 -12px;
    }

    .back-btn {
      cursor: pointer;
      color: #4b5563;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
      display: inline-block;
    }

    .back-btn:hover {
      color: #1f2937;
    }

    .detail-rating {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }

    .rating-count {
      font-size: 13px;
      color: #666;
    }

    .detail-section {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .detail-section:last-child {
      border-bottom: none;
    }

    .section-title {
      margin: 0 0 8px 0;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 0.5px;
    }

    .detail-text {
      margin: 0;
      font-size: 14px;
      color: #1f2937;
    }

    .map-container {
      padding: 12px;
      background: #f0f4ff;
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .map-view {
      margin: 0;
      padding: 8px;
      background: #e8eef5;
      border-radius: 4px;
      font-size: 13px;
      color: #4b5563;
      text-align: center;
    }

    .distance {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #666;
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
}
