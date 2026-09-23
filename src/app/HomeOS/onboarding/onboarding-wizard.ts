import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '../shared/icon/icon';
import { OnboardingService } from '../core/onboarding.service';
import { HomeStore } from '../core/home-store';
import { AddFlowService } from '../add/add-flow.service';

@Component({
  selector: 'app-onboarding-wizard',
  imports: [CommonModule, Icon],
  template: `
    <div class="onboarding-overlay">
      <div class="onboarding-modal">
        @switch (onboarding.step()) {
          @case ('welcome') {
            <div class="step welcome-step">
              <app-icon name="sparkle" [size]="48" />
              <h1>Welcome to HomeOS</h1>
              <p>Your AI-powered home management assistant.</p>
              <p>Upload a bill or warranty card, and let AI organize your home.</p>
              <button class="btn btn-primary" (click)="openSmartAdd()">
                📸 Upload Your First Bill
              </button>
              <p class="skip-text">
                <button type="button" class="btn-link" (click)="skip()">Or skip for now</button>
              </p>
            </div>
          }
          @case ('explore') {
            <div class="step explore-step">
              <app-icon name="check-circle" [size]="48" />
              <h2>You're All Set!</h2>
              @if (createdCount > 0) {
                <p>✨ AI created <strong>{{ createdCount }} item{{ createdCount > 1 ? 's' : '' }}</strong> and organized them into rooms.</p>
              } @else {
                <p>Ready to start organizing your home with HomeOS.</p>
              }
              <p>Explore the dashboard to manage your assets, track warranties, and stay on top of maintenance.</p>

              <div class="feature-list">
                <div class="feature">
                  <app-icon name="shield" [size]="20" />
                  <span>Track warranty expirations</span>
                </div>
                <div class="feature">
                  <app-icon name="bell" [size]="20" />
                  <span>Get maintenance reminders</span>
                </div>
                <div class="feature">
                  <app-icon name="wallet" [size]="20" />
                  <span>Monitor your spending</span>
                </div>
              </div>

              <button class="btn btn-primary" (click)="completeOnboarding()">
                Explore Dashboard
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .onboarding-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .onboarding-modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      padding: 48px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-height: 90vh;
      overflow-y: auto;
    }

    .step {
      display: flex;
      flex-direction: column;
      gap: 24px;
      text-align: center;
    }

    .welcome-step app-icon,
    .explore-step app-icon {
      margin: 0 auto;
      color: #4b5563;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }

    h2 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      text-align: center;
    }

    p {
      margin: 0;
      color: #666;
      font-size: 16px;
      line-height: 1.5;
    }

    .skip-text {
      margin-top: 8px !important;
    }

    .btn-link {
      background: none;
      border: none;
      color: #4b5563;
      cursor: pointer;
      font-size: 14px;
      text-decoration: underline;
      padding: 0;
      font-family: inherit;
    }

    .btn-link:hover {
      color: #2a3339;
    }

    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: left;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .feature app-icon {
      color: #4b5563;
      flex-shrink: 0;
    }

    .feature span {
      font-size: 14px;
      color: #333;
      margin: 0;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #4b5563;
      color: white;
    }

    .btn-primary:hover {
      background: #3a4350;
    }
  `]
})
export class OnboardingWizard {
  onboarding = inject(OnboardingService);
  private store = inject(HomeStore);
  private flow = inject(AddFlowService);

  createdCount = 0;

  openSmartAdd() {
    const beforeCount = this.store.assets().length;

    // Open Smart Add modal
    this.flow.open('Asset');

    // Check after delay if items were added
    setTimeout(() => {
      const afterCount = this.store.assets().length;
      this.createdCount = Math.max(0, afterCount - beforeCount);
      this.onboarding.nextStep('explore');
    }, 1000);
  }

  skip() {
    this.onboarding.complete();
  }

  completeOnboarding() {
    this.onboarding.complete();
  }
}
