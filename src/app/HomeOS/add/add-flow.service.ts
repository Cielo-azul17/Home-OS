import { Injectable, signal } from '@angular/core';
import { AddFlowKind } from '../core/models';

export interface AddFlowOptions {
  roomId?: string;
  assetId?: string;
  /* Set when the flow is editing an existing record rather than creating one.
     The kind already says what sort of record it is, so one id is enough. */
  editId?: string;
}

@Injectable({ providedIn: 'root' })
export class AddFlowService {
  readonly active = signal<AddFlowKind | null>(null);
  readonly options = signal<AddFlowOptions>({});

  open(action: AddFlowKind, options: AddFlowOptions = {}): void {
    this.options.set(options);
    this.active.set(action);
  }

  /** Same forms as adding, prefilled and saving over the original. */
  edit(action: AddFlowKind, editId: string, options: AddFlowOptions = {}): void {
    this.open(action, { ...options, editId });
  }

  close(): void {
    this.active.set(null);
    this.options.set({});
  }
}
