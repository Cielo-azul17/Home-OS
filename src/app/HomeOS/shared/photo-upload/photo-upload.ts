import { Component, input, output, signal } from '@angular/core';
import { Icon } from '../icon/icon';

/* Not specified in the design system; built from existing tokens.
   Dashed soft-stone dropzone that turns sage on drag-over. */

@Component({
  selector: 'app-photo-upload',
  imports: [Icon],
  template: `
    <label
      class="dropzone"
      [class.dragging]="dragging()"
      (dragover)="onDragOver($event)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
    >
      <input
        type="file"
        accept="image/*"
        [attr.multiple]="multiple() ? '' : null"
        (change)="onChange($event)"
        hidden
      />
      <div class="tile">
        <app-icon name="camera" [size]="24" />
      </div>
      <p class="title">{{ multiple() ? 'Upload or take photos' : 'Upload or take a photo' }}</p>
      <p class="hint">
        {{
          multiple()
            ? 'Drop as many bills as you like, or click to browse'
            : 'Drop an image here, or click to browse'
        }}
      </p>
    </label>
  `,
  styles: `
    .dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-8);
      padding: var(--spacing-40) var(--spacing-24);
      background: var(--color-eggshell);
      border: 1px dashed var(--color-soft-stone);
      border-radius: var(--radius-card);
      cursor: pointer;
      text-align: center;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .dropzone:hover,
    .dropzone.dragging {
      border-color: var(--color-sage);
      background: var(--color-sage-soft);
    }

    .tile {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
      background: var(--color-surface);
      border: 1px solid var(--color-soft-stone);
      color: var(--color-sage);
      margin-bottom: var(--spacing-4);
    }

    .title {
      font-size: var(--text-body-sm);
      font-weight: 500;
      color: var(--color-charcoal);
    }

    .hint {
      font-size: var(--text-caption);
      color: var(--color-smoke);
    }
  `,
})
export class PhotoUpload {
  multiple = input(false);

  /** Always an array; single-file callers take the first entry. */
  picked = output<string[]>();
  dragging = signal(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.read(event.dataTransfer?.files);
  }

  onChange(event: Event): void {
    this.read((event.target as HTMLInputElement).files);
  }

  /* Reads every dropped file, not just the first — silently discarding the
     rest would look like they'd been accepted. */
  private async read(list: FileList | null | undefined): Promise<void> {
    if (!list?.length) return;
    const files = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;

    const chosen = this.multiple() ? files : files.slice(0, 1);
    const urls = await Promise.all(chosen.map((f) => this.toDataUrl(f)));
    this.picked.emit(urls);
  }

  private toDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
