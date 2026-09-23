import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icon } from '../shared/icon/icon';
import { HomeStore } from '../core/home-store';
import { Supabase } from '../core/backend/supabase-client';

@Component({
  selector: 'app-onboarding-upload',
  imports: [CommonModule, Icon, FormsModule],
  template: `
    <div class="upload-overlay">
      <div class="upload-modal">
        <div class="modal-header">
          <div class="header-content">
            <h2>Get Started with HomeOS</h2>
            <p class="header-description">
              Your AI-powered home management assistant.<br/>
              Upload bills and invoices to automatically organize your home.
            </p>
          </div>
          <button type="button" class="close-btn" (click)="close()">
            <app-icon name="x" [size]="24" />
          </button>
        </div>

        <div class="tabs">
          <button
            [class.active]="activeTab() === 'upload'"
            (click)="activeTab.set('upload')"
            class="tab"
          >
            📸 Upload Bills
          </button>
          <button
            [class.active]="activeTab() === 'room'"
            (click)="activeTab.set('room')"
            class="tab"
          >
            🚪 Add Room
          </button>
        </div>

        <div class="tab-content">
          @switch (activeTab()) {
            @case ('upload') {
              <div class="upload-tab">
                <div
                  class="upload-area"
                  (dragover)="dragOver.set(true)"
                  (dragleave)="dragOver.set(false)"
                  (drop)="onDrop($event)"
                  [class.drag-active]="dragOver()"
                >
                  @if (!uploading()) {
                    <app-icon name="camera" [size]="64" class="upload-icon" />
                    <h3>Upload Bills or Invoices</h3>
                    <p class="upload-hint">Drag multiple files here or click to select</p>
                    <input
                      type="file"
                      #fileInput
                      hidden
                      accept="image/*,.pdf"
                      multiple
                      (change)="onFileSelected($event)"
                    />
                    <button
                      type="button"
                      class="btn btn-primary"
                      (click)="fileInput.click()"
                    >
                      Choose File
                    </button>
                  } @else {
                    <div class="loading-content">
                      <div class="spinner"></div>
                      <p>Processing your bill...</p>
                      <p class="loading-subtext">AI is extracting details and organizing items</p>
                    </div>
                  }
                </div>
              </div>
            }
            @case ('room') {
              <div class="room-tab">
                <form (ngSubmit)="addRoom()" class="room-form">
                  <div class="form-group">
                    <label for="room-name">Room Name</label>
                    <div class="input-with-button">
                      <input
                        id="room-name"
                        type="text"
                        [(ngModel)]="roomName"
                        name="roomName"
                        placeholder="e.g., Kitchen, Bedroom, Living Room"
                        required
                        autofocus
                      />
                      <button type="submit" class="btn btn-primary btn-sm" [disabled]="!roomName.trim()">
                        @if (editingId) {
                          Update
                        } @else {
                          Add Room
                        }
                      </button>
                    </div>
                  </div>
                </form>

                @if (createdRooms().length > 0) {
                  <div class="rooms-list">
                    <h4>Created Rooms ({{ createdRooms().length }})</h4>
                    <div class="rooms-grid">
                      @for (room of createdRooms(); track room.id) {
                        <div class="room-card">
                          <div class="room-icon">
                            <app-icon name="door" [size]="32" />
                          </div>
                          <div class="room-info">
                            <p class="room-name">{{ room.name }}</p>
                          </div>
                          <div class="room-actions">
                            <button
                              type="button"
                              class="icon-btn"
                              (click)="editRoom(room.id)"
                              title="Edit"
                            >
                              <app-icon name="edit" [size]="18" />
                            </button>
                            <button
                              type="button"
                              class="icon-btn delete"
                              (click)="deleteRoom(room.id)"
                              title="Delete"
                            >
                              <app-icon name="trash" [size]="18" />
                            </button>
                          </div>
                        </div>
                      }
                    </div>

                    <button type="button" class="btn btn-primary" (click)="close()">
                      Save Rooms & Continue
                    </button>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
    }

    .upload-modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      padding: 0;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9f9f9;
    }

    .header-content {
      flex: 1;
    }

    .modal-header h2 {
      margin: 0 0 8px 0;
      font-size: 22px;
      font-weight: 700;
      color: #1f2937;
    }

    .header-description {
      margin: 0;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
    }

    .close-btn:hover {
      color: #333;
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      gap: 0;
    }

    .tab {
      flex: 1;
      padding: 16px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab:hover {
      color: #333;
    }

    .tab.active {
      color: #4b5563;
      border-bottom-color: #4b5563;
    }

    .tab-content {
      flex: 1;
      padding: 24px;
    }

    .description {
      margin: 0 0 20px 0;
      color: #666;
      font-size: 14px;
    }

    .upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 48px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 300px;
      background: white;
    }

    .upload-area:hover {
      border-color: #4b5563;
      background: #f9fafb;
    }

    .upload-area.drag-active {
      border-color: #4b5563;
      background: #f0f4ff;
      border-width: 2px;
    }

    .upload-icon {
      color: #4b5563;
    }

    .upload-area h3 {
      margin: 8px 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .upload-hint {
      margin: 0 0 20px 0;
      color: #666;
      font-size: 14px;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .loading-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .loading-subtext {
      color: #999;
      font-size: 12px !important;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .form-group input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #4b5563;
      box-shadow: 0 0 0 3px rgba(75, 85, 99, 0.1);
    }


    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e5e7eb;
      border-top-color: #4b5563;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #ecfdf5;
      border: 1px solid #d1fae5;
      border-radius: 6px;
      color: #065f46;
      font-size: 14px;
      margin-top: 12px;
    }

    .success-message app-icon {
      color: #10b981;
      flex-shrink: 0;
    }

    .room-form {
      margin-bottom: 20px;
    }

    .room-form .form-group {
      margin-bottom: 0;
    }

    .input-with-button {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .input-with-button input {
      flex: 1;
    }

    .rooms-list {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .rooms-list .btn {
      width: 100%;
    }

    .rooms-list h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .rooms-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .room-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .room-card:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    .room-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #e5e7eb;
      border-radius: 6px;
      color: #4b5563;
      flex-shrink: 0;
    }

    .room-info {
      flex: 1;
    }

    .room-name {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    }

    .room-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .icon-btn:hover {
      background: #e5e7eb;
      color: #333;
    }

    .icon-btn.delete:hover {
      background: #fee2e2;
      color: #dc2626;
    }
  `]
})
export class OnboardingUpload {
  private store = inject(HomeStore);
  private supabase = inject(Supabase);

  activeTab = signal<'upload' | 'room'>('upload');
  dragOver = signal(false);
  uploading = signal(false);
  createdRooms = signal<Array<{ id: string; name: string }>>([]);
  roomName = '';
  editingId: string | null = null;

  onClose = output<void>();

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.processFiles(files);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.processFiles(input.files);
    }
  }

  processFiles(files: FileList) {
    this.uploading.set(true);
    // TODO: Call Gemini OCR API to process all files
    // For now, just close after a delay (scales with number of files)
    const delay = Math.min(2000 + files.length * 500, 5000);
    setTimeout(() => {
      this.uploading.set(false);
      this.close();
    }, delay);
  }

  addRoom() {
    if (!this.roomName.trim()) return;

    const rooms = this.createdRooms();

    if (this.editingId) {
      // Update existing room
      const index = rooms.findIndex(r => r.id === this.editingId);
      if (index !== -1) {
        rooms[index].name = this.roomName;
        this.createdRooms.set([...rooms]);
      }
      this.editingId = null;
    } else {
      // Add new room
      const newRoom = {
        id: Date.now().toString(),
        name: this.roomName
      };
      this.createdRooms.set([...rooms, newRoom]);
    }

    this.roomName = '';
  }

  editRoom(id: string) {
    const room = this.createdRooms().find(r => r.id === id);
    if (room) {
      this.roomName = room.name;
      this.editingId = id;
    }
  }

  deleteRoom(id: string) {
    this.createdRooms.set(this.createdRooms().filter(r => r.id !== id));
    if (this.editingId === id) {
      this.editingId = null;
      this.roomName = '';
    }
  }

  close() {
    this.onClose.emit();
  }
}
