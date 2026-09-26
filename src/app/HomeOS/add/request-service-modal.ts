import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Modal } from '../shared/modal/modal';
import { ServiceType } from '../core/models';

@Component({
  selector: 'app-request-service-modal',
  standalone: true,
  imports: [CommonModule, Modal, FormsModule],
  template: `
    <app-modal
      title="Request Service"
      subtitle="Tell us what you need and we'll find nearby providers"
      (closed)="close()"
    >
      <div class="form">
        <div class="field">
          <label class="field-label">Service Type</label>
          <div class="radio-group">
            <div class="radio-option">
              <input type="radio" id="repair" value="repair" [(ngModel)]="serviceType" name="type" />
              <label for="repair">🔧 Repair</label>
            </div>
            <div class="radio-option">
              <input type="radio" id="maintenance" value="maintenance" [(ngModel)]="serviceType" name="type" />
              <label for="maintenance">🧹 Maintenance</label>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="description">Description</label>
          <textarea
            id="description"
            class="textarea"
            [(ngModel)]="description"
            placeholder="What's the issue? e.g., Screen flickering, water leaking..."
            rows="4"
          ></textarea>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="budget">Budget Range (Optional)</label>
            <select id="budget" class="select" [(ngModel)]="budgetRange">
              <option value="">No specific budget</option>
              <option value="500-2000">₹500 - ₹2,000</option>
              <option value="2000-5000">₹2,000 - ₹5,000</option>
              <option value="5000+">₹5,000+</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="time">Preferred Time (Optional)</label>
            <input
              id="time"
              type="text"
              class="input"
              [(ngModel)]="preferredTime"
              placeholder="e.g., Weekdays after 5pm"
            />
          </div>
        </div>
      </div>

      <ng-container modalFooter>
        <button type="button" class="btn btn-ghost" (click)="close()">Cancel</button>
        <button
          type="button"
          class="btn btn-primary"
          [disabled]="!description.trim()"
          (click)="submit()"
        >
          Find Providers
        </button>
      </ng-container>
    </app-modal>
  `,
  styles: [`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #333;
      letter-spacing: 0.5px;
    }

    .input,
    .select,
    .textarea {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .input:focus,
    .select:focus,
    .textarea:focus {
      outline: none;
      border-color: #4b5563;
      box-shadow: 0 0 0 3px rgba(75, 85, 99, 0.1);
    }

    .textarea {
      resize: vertical;
    }

    .radio-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .radio-option {
      flex: 1;
      min-width: 100px;
    }

    .radio-option input[type="radio"] {
      display: none;
    }

    .radio-option label {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 12px;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      margin: 0;
    }

    .radio-option input[type="radio"]:checked + label {
      background: #e8eef5;
      border-color: #4b5563;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
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

    .btn-primary {
      background: #4b5563;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #3a4350;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class RequestServiceModal {
  assetId = input.required<string>();
  submitted = output<{ type: ServiceType; description: string; budgetRange: string; preferredTime: string }>();
  closeModal = output<void>();

  serviceType: ServiceType = 'repair';
  description = '';
  budgetRange = '';
  preferredTime = '';

  submit(): void {
    if (!this.description.trim()) return;
    this.submitted.emit({
      type: this.serviceType,
      description: this.description,
      budgetRange: this.budgetRange,
      preferredTime: this.preferredTime,
    });
  }

  close(): void {
    this.closeModal.emit();
  }
}
