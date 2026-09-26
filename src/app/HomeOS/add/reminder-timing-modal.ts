import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Modal } from '../shared/modal/modal';

export interface ReminderTiming {
  type: '1-day-before' | '2-days-before' | '3-days-before';
  note?: string;
}

@Component({
  selector: 'app-reminder-timing-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal],
  template: `
    <app-modal
      title="Set Service Reminder"
      subtitle=""
      (closed)="close()"
    >
      <div class="reminder-container">
        <!-- Service Date Info -->
        <div class="service-info">
          <div class="info-label">Service Scheduled For:</div>
          <div class="info-date">📅 {{ scheduledDate }}</div>
        </div>

        <!-- Reminder Timing Options -->
        <div class="timing-label">When should we remind you?</div>
        <div class="timing-container">
          <div class="timing-option" (click)="selectTiming('1-day-before')">
            <div class="option-radio" [class.selected]="selectedTiming === '1-day-before'"></div>
            <div class="option-content">
              <div class="option-title">1 Day Before</div>
              <div class="option-desc">{{ getDateText('1-day-before') }}</div>
            </div>
          </div>

          <div class="timing-option" (click)="selectTiming('2-days-before')">
            <div class="option-radio" [class.selected]="selectedTiming === '2-days-before'"></div>
            <div class="option-content">
              <div class="option-title">2 Days Before</div>
              <div class="option-desc">{{ getDateText('2-days-before') }}</div>
            </div>
          </div>

          <div class="timing-option" (click)="selectTiming('3-days-before')">
            <div class="option-radio" [class.selected]="selectedTiming === '3-days-before'"></div>
            <div class="option-content">
              <div class="option-title">3 Days Before</div>
              <div class="option-desc">{{ getDateText('3-days-before') }}</div>
            </div>
          </div>
        </div>

        <!-- Note Field -->
        <div class="note-section">
          <label class="note-label">Add a Note (Optional)</label>
          <textarea
            [(ngModel)]="note"
            placeholder="e.g., Confirm appointment before, Ask about warranty, etc."
            class="note-input"
            rows="3"
          ></textarea>
        </div>
      </div>

      <div modalFooter class="footer-buttons">
        <button type="button" class="btn btn-ghost" (click)="close()">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="confirm()">✓ Set Reminder</button>
      </div>
    </app-modal>
  `,
  styles: [`
    .reminder-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .service-info {
      background: #e8eef5;
      border-left: 4px solid #4b5563;
      padding: 12px 16px;
      border-radius: 6px;
    }

    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .info-date {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .timing-label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .timing-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .timing-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .timing-option:hover {
      border-color: #4b5563;
      background: #f9fafb;
    }

    .option-radio {
      width: 20px;
      height: 20px;
      border: 2px solid #d1d5db;
      border-radius: 50%;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .option-radio.selected {
      border-color: #4b5563;
      background: #4b5563;
      box-shadow: inset 0 0 0 4px white;
    }

    .option-content {
      flex: 1;
    }

    .option-title {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .option-desc {
      font-size: 13px;
      color: #666;
    }

    .note-section {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
    }

    .note-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .note-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      resize: vertical;
      transition: border-color 0.2s;
    }

    .note-input:focus {
      outline: none;
      border-color: #4b5563;
      box-shadow: 0 0 0 3px rgba(75, 85, 99, 0.1);
    }

    .footer-buttons {
      display: flex;
      gap: 12px;
      width: 100%;
    }

    .btn {
      flex: 1;
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

    .btn-primary:hover {
      background: #3a4350;
    }
  `]
})
export class ReminderTimingModal {
  scheduledDate = input.required<string>();

  selectedTiming: ReminderTiming['type'] = '1-day-before';
  note = '';

  submitted = output<ReminderTiming>();
  closeModal = output<void>();

  selectTiming(type: ReminderTiming['type']): void {
    this.selectedTiming = type;
  }

  getDateText(type: ReminderTiming['type']): string {
    const scheduled = new Date(this.scheduledDate());
    const reminderDate = new Date(scheduled);

    if (type === '1-day-before') {
      reminderDate.setDate(reminderDate.getDate() - 1);
    } else if (type === '2-days-before') {
      reminderDate.setDate(reminderDate.getDate() - 2);
    } else if (type === '3-days-before') {
      reminderDate.setDate(reminderDate.getDate() - 3);
    }

    return reminderDate.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  confirm(): void {
    const timing: ReminderTiming = {
      type: this.selectedTiming,
      note: this.note || undefined,
    };
    this.submitted.emit(timing);
  }

  close(): void {
    this.closeModal.emit();
  }
}
