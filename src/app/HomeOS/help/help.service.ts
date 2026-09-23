import { Injectable, signal } from '@angular/core';

/* Help opens in the same side panel shape as notifications — it's something
   you read next to the screen you're stuck on, not somewhere you navigate. */

@Injectable({ providedIn: 'root' })
export class HelpService {
  readonly panelOpen = signal(false);

  open(): void {
    this.panelOpen.set(true);
  }

  close(): void {
    this.panelOpen.set(false);
  }

  toggle(): void {
    this.panelOpen.update((open) => !open);
  }
}
