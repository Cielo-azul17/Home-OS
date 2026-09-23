import { Injectable, signal } from '@angular/core';
import { HomeDocument } from '../../core/models';

/* Opened with the whole set the user was looking at, not a single document,
   so they can move between them in place instead of closing and reopening. */

@Injectable({ providedIn: 'root' })
export class DocumentViewerService {
  readonly documents = signal<HomeDocument[]>([]);
  readonly activeId = signal<string | null>(null);

  open(documents: HomeDocument[], startId?: string): void {
    if (!documents.length) return;
    this.documents.set(documents);
    this.activeId.set(startId ?? documents[0].id);
  }

  select(id: string): void {
    this.activeId.set(id);
  }

  close(): void {
    this.documents.set([]);
    this.activeId.set(null);
  }
}
