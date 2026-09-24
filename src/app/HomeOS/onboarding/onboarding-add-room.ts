import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeStore } from '../core/home-store';
import { ToastService } from '../shared/toast/toast';
import { friendlyError } from '../core/errors';

const SUGGESTED_ROOMS = ['Living Room', 'Bedroom', 'Kitchen', 'Study'];

@Component({
  selector: 'app-onboarding-add-room',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="add-room-step">
      <h2>Let's Organize Your Home</h2>
      <p>Add rooms to organize your assets by location. You can add more anytime.</p>

      <div class="room-form">
        <label>Room Name</label>
        <div class="input-group">
          <input
            type="text"
            placeholder="e.g., Kitchen, Bedroom, Garage"
            [ngModel]="roomName()"
            (ngModelChange)="roomName.set($event)"
            (keyup.enter)="addRoom()"
            [disabled]="saving()"
          />
          <button
            class="btn btn-add"
            (click)="addRoom()"
            [disabled]="!roomName().trim() || saving()"
          >
            {{ saving() ? '+' : '+' }} {{ saving() ? '' : 'Add' }}
          </button>
        </div>

        <div class="suggestions">
          <label>Quick Add</label>
          <div class="suggestion-buttons">
            @for (room of suggestedRooms; track room) {
              <button
                type="button"
                class="btn-suggestion"
                (click)="addSuggestedRoom(room)"
                [disabled]="saving()"
              >
                + {{ room }}
              </button>
            }
          </div>
        </div>
      </div>

      @if (store.rooms().length > 0) {
        <div class="rooms-list">
          <label>{{ store.rooms().length }} room{{ store.rooms().length > 1 ? 's' : '' }} added</label>
          <div class="rooms">
            @for (room of store.rooms(); track room.id) {
              <div class="room-chip">{{ room.name }}</div>
            }
          </div>
        </div>
      }

      <div class="button-group">
        <button
          class="btn btn-secondary"
          (click)="goBack()"
        >
          ← Back
        </button>
        <button
          class="btn btn-primary"
          (click)="proceed()"
          [disabled]="store.rooms().length === 0"
        >
          Continue
        </button>
      </div>
    </div>
  `,
  styles: [`
    .add-room-step {
      display: flex;
      flex-direction: column;
      gap: 24px;
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
      font-size: 14px;
      line-height: 1.5;
      text-align: center;
    }

    .room-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    label {
      font-size: 13px;
      font-weight: 600;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .suggestions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .suggestion-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .btn-suggestion {
      padding: 10px 12px;
      background: #f0f0f0;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #4b5563;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .btn-suggestion:hover:not(:disabled) {
      background: #e0e0e0;
      border-color: #4b5563;
    }

    .btn-suggestion:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .input-group {
      display: flex;
      gap: 8px;
    }

    input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
    }

    input:focus {
      outline: none;
      border-color: #4b5563;
      box-shadow: 0 0 0 3px rgba(75, 85, 99, 0.1);
    }

    input:disabled {
      background: #f9fafb;
      color: #999;
    }

    .rooms-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rooms {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .room-chip {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      background: #e8eef5;
      border-radius: 20px;
      font-size: 13px;
      color: #333;
      font-weight: 500;
    }

    .button-group {
      display: flex;
      gap: 12px;
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

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #4b5563;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #3a4350;
    }

    .btn-secondary {
      background: #e5e7eb;
      color: #333;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #d1d5db;
    }

    .btn-add {
      background: #f0f0f0;
      color: #4b5563;
      padding: 10px 12px;
      min-width: auto;
      flex-shrink: 0;
    }

    .btn-add:hover:not(:disabled) {
      background: #e0e0e0;
    }
  `]
})
export class OnboardingAddRoom {
  store = inject(HomeStore);
  private toasts = inject(ToastService);

  @Output() backClick = new EventEmitter<void>();
  @Output() proceedClick = new EventEmitter<void>();

  roomName = signal('');
  saving = signal(false);
  suggestedRooms = SUGGESTED_ROOMS;

  async addRoom(): Promise<void> {
    const name = this.roomName().trim();
    if (!name) return;

    this.saving.set(true);
    try {
      await this.store.addRoom(name);
      this.roomName.set('');
    } catch (err) {
      this.toasts.error(friendlyError(err, "Couldn't create room."));
    } finally {
      this.saving.set(false);
    }
  }

  async addSuggestedRoom(name: string): Promise<void> {
    this.saving.set(true);
    try {
      let finalName = name;
      const rooms = this.store.rooms();

      // Check if a room with this name already exists
      const baseNameMatch = name.match(/^(.+?)\s*(\d*)$/);
      if (baseNameMatch) {
        const baseName = baseNameMatch[1].trim();

        // Find all rooms that match the base name
        const matchingRooms = rooms.filter(r => {
          const roomBaseMatch = r.name.match(/^(.+?)\s*(\d*)$/);
          return roomBaseMatch && roomBaseMatch[1].trim() === baseName;
        });

        if (matchingRooms.length > 0) {
          // Find the highest number
          let maxNum = 1;
          for (const room of matchingRooms) {
            const numMatch = room.name.match(/(\d+)$/);
            if (numMatch) {
              maxNum = Math.max(maxNum, parseInt(numMatch[1], 10));
            }
          }

          // Construct new name with incremented number
          const newNum = maxNum + 1;
          finalName = `${baseName} ${newNum}`;
        }
      }

      await this.store.addRoom(finalName);
    } catch (err) {
      this.toasts.error(friendlyError(err, "Couldn't create room."));
    } finally {
      this.saving.set(false);
    }
  }

  goBack(): void {
    this.backClick.emit();
  }

  proceed(): void {
    if (this.store.rooms().length > 0) {
      this.proceedClick.emit();
    }
  }
}
