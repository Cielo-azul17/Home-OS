import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icon } from '../shared/icon/icon';
import { OnboardingService } from '../core/onboarding.service';
import { HomeStore } from '../core/home-store';

@Component({
  selector: 'app-onboarding-wizard',
  imports: [CommonModule, FormsModule, Icon],
  template: `
    <div class="onboarding-overlay">
      <div class="onboarding-modal">
        @switch (onboarding.step()) {
          @case ('welcome') {
            <div class="step welcome-step">
              <app-icon name="home" [size]="48" />
              <h1>Welcome to HomeOS</h1>
              <p>Organize your home, track your assets, and never miss a maintenance reminder.</p>
              <p>Let's get you started in 2 minutes.</p>
              <button class="btn btn-primary" (click)="goToCreateRoom()">
                Get Started
              </button>
            </div>
          }
          @case ('create-room') {
            <div class="step create-room-step">
              <h2>Create Your First Room</h2>
              <p>Start by creating a room (e.g., Living Room, Kitchen, Bedroom)</p>

              <div class="form-group">
                <label>Room name</label>
                <input
                  [(ngModel)]="roomName"
                  placeholder="e.g., Living Room"
                  type="text"
                />
              </div>

              <div class="form-actions">
                <button class="btn btn-secondary" (click)="onboarding.nextStep('welcome')">
                  Back
                </button>
                <button
                  class="btn btn-primary"
                  [disabled]="!roomName.trim()"
                  (click)="createRoom()"
                >
                  Create Room
                </button>
              </div>
            </div>
          }
          @case ('add-asset') {
            <div class="step add-asset-step">
              <h2>Add Your First Asset</h2>
              <p>Now let's add your first item to {{ createdRoomName }}</p>

              <div class="form-group">
                <label>Asset name</label>
                <input
                  [(ngModel)]="assetName"
                  placeholder="e.g., Washing Machine"
                  type="text"
                />
              </div>

              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="assetCategory">
                  <option>Electronics</option>
                  <option>Appliances</option>
                  <option>Climate</option>
                  <option>Kitchen</option>
                  <option>Furniture</option>
                  <option>Other</option>
                </select>
              </div>

              <div class="form-actions">
                <button class="btn btn-secondary" (click)="onboarding.nextStep('create-room')">
                  Back
                </button>
                <button
                  class="btn btn-primary"
                  [disabled]="!assetName.trim()"
                  (click)="createAsset()"
                >
                  Add Asset
                </button>
              </div>
            </div>
          }
          @case ('explore') {
            <div class="step explore-step">
              <app-icon name="check-circle" [size]="48" />
              <h2>You're All Set!</h2>
              <p>You've created a room and added your first asset.</p>
              <p>Now explore HomeOS to manage your home better.</p>

              <div class="feature-list">
                <div class="feature">
                  <app-icon name="camera" [size]="24" />
                  <span>Photograph bills & warranty cards</span>
                </div>
                <div class="feature">
                  <app-icon name="bell" [size]="24" />
                  <span>Get smart alerts for maintenance</span>
                </div>
                <div class="feature">
                  <app-icon name="wallet" [size]="24" />
                  <span>Track your spending</span>
                </div>
              </div>

              <button class="btn btn-primary" (click)="completeOnboarding()">
                Start Exploring
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
      text-align: left;
    }

    p {
      margin: 0;
      color: #666;
      font-size: 16px;
      line-height: 1.5;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
    }

    label {
      font-weight: 600;
      font-size: 14px;
      color: #333;
    }

    input, select {
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
      font-family: inherit;
    }

    input:focus, select:focus {
      outline: none;
      border-color: #4b5563;
      box-shadow: 0 0 0 3px rgba(75, 85, 99, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }

    .form-actions button {
      flex: 1;
    }

    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: left;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .feature app-icon {
      color: #4b5563;
      flex-shrink: 0;
    }

    .feature span {
      font-size: 14px;
      color: #333;
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

    .btn-primary:hover:not(:disabled) {
      background: #3a4350;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #333;
    }

    .btn-secondary:hover {
      background: #e5e5e5;
    }
  `]
})
export class OnboardingWizard {
  onboarding = inject(OnboardingService);
  private store = inject(HomeStore);

  roomName = signal('');
  assetName = signal('');
  assetCategory = signal('Appliances');
  createdRoomName = '';

  goToCreateRoom() {
    this.onboarding.nextStep('create-room');
  }

  createRoom() {
    if (!this.roomName().trim()) return;
    this.createdRoomName = this.roomName();
    this.store.createRoom({
      name: this.roomName(),
      image: '',
      sortOrder: 0,
    });
    this.onboarding.nextStep('add-asset');
  }

  createAsset() {
    if (!this.assetName().trim()) return;
    const room = this.store.rooms()[0];
    if (!room) return;

    this.store.createAsset({
      name: this.assetName(),
      roomId: room.id,
      category: this.assetCategory() as any,
      brand: '',
      purchaseDate: undefined,
      purchasePrice: undefined,
      warrantyExpiry: undefined,
      serialNumber: '',
      notes: '',
      image: '',
    });
    this.onboarding.nextStep('explore');
  }

  completeOnboarding() {
    this.onboarding.complete();
  }
}
