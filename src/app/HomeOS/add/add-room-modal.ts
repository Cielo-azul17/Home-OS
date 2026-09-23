import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../shared/modal/modal';
import { Icon } from '../shared/icon/icon';
import { PhotoUpload } from '../shared/photo-upload/photo-upload';
import { HomeStore } from '../core/home-store';
import { ToastService } from '../shared/toast/toast';
import { AddFlowService } from './add-flow.service';
import { friendlyError } from '../core/errors';
import { Room } from '../core/models';

/* Rooms are how the whole app is organised, so creating one has to be as
   easy as adding anything else. A photo is optional — a room without one
   falls back to a neutral tile rather than a broken image. */

@Component({
  selector: 'app-add-room-modal',
  imports: [Modal, Icon, PhotoUpload, FormsModule],
  template: `
    <app-modal
      [title]="editing() ? 'Rename room' : 'Add a room'"
      [subtitle]="
        editing()
          ? 'Change what this room is called, or give it a new photo.'
          : 'Give it a name, and a photo if you have one.'
      "
      (closed)="close()"
    >
      <div class="form">
        <div class="field">
          <label class="field-label" for="room-name">Room name</label>
          <input
            id="room-name"
            class="input"
            [(ngModel)]="name"
            placeholder="e.g. Guest bedroom"
          />
        </div>

        @if (image(); as picture) {
          <div class="picked">
            <img [src]="picture" alt="" />
            <div class="picked-text">
              <span class="picked-title">
                <app-icon name="image" [size]="16" />
                Room photo
              </span>
              <span class="picked-sub">Shown on the room card and its header.</span>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" (click)="image.set('')">
              Remove
            </button>
          </div>
        } @else {
          <app-photo-upload (picked)="onPhoto($event)" />
        }
      </div>

      @if (saveError()) {
        <p class="save-error">{{ saveError() }}</p>
      }

      <ng-container modalFooter>
        <button type="button" class="btn btn-ghost" (click)="close()">Cancel</button>
        <button
          type="button"
          class="btn btn-primary"
          [disabled]="!canSave || saving()"
          (click)="save()"
        >
          {{ saving() ? 'Saving…' : editing() ? 'Save changes' : 'Add room' }}
        </button>
      </ng-container>
    </app-modal>
  `,
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-16);
    }

    .picked {
      display: flex;
      align-items: center;
      gap: var(--spacing-16);
      padding: var(--spacing-12);
      border: 1px solid var(--color-soft-stone);
      border-radius: var(--radius-card);
      background: var(--color-eggshell);
    }

    .picked img {
      width: 72px;
      height: 56px;
      flex-shrink: 0;
      object-fit: cover;
      border-radius: var(--radius-input);
    }

    .picked-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
      min-width: 0;
    }

    .picked-title {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-8);
      font-size: var(--text-body-sm);
      font-weight: 500;
      color: var(--color-charcoal);
    }

    .picked-sub {
      font-size: var(--text-caption);
      color: var(--color-smoke);
    }
  `,
})
export class AddRoomModal implements OnInit {
  private store = inject(HomeStore);
  private toasts = inject(ToastService);
  private flow = inject(AddFlowService);

  saving = signal(false);
  saveError = signal('');
  image = signal('');
  editing = signal<Room | null>(null);

  name = '';

  ngOnInit(): void {
    const { editId } = this.flow.options();
    const existing = editId ? this.store.room(editId) : undefined;
    if (!existing) return;

    this.editing.set(existing);
    this.name = existing.name;
    this.image.set(existing.image ?? '');
  }

  get canSave(): boolean {
    return this.name.trim().length > 0;
  }

  onPhoto(urls: string[]): void {
    if (urls[0]) this.image.set(urls[0]);
  }

  async save(): Promise<void> {
    if (!this.canSave || this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');

    const name = this.name.trim();
    const existing = this.editing();

    try {
      if (existing) {
        await this.store.updateRoom({ ...existing, name, image: this.image() });
        this.toasts.show(`${name} updated`, 'edit');
      } else {
        await this.store.addRoom(name, this.image());
        this.toasts.show(`${name} added`, 'door');
      }
      this.flow.close();
    } catch (err) {
      this.saveError.set(friendlyError(err));
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    this.flow.close();
  }
}
