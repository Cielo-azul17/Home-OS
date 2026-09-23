import { Component, HostListener, inject, input, OnDestroy, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { ScrollLock } from '../../core/scroll-lock.service';

/* Not specified in the design system; built from existing tokens.
   Surface card on a charcoal scrim, --radius-large-card, soft elevation. */

@Component({
  selector: 'app-modal',
  imports: [Icon],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal implements OnDestroy {
  private scrollLock = inject(ScrollLock);

  title = input.required<string>();
  subtitle = input('');
  closed = output<void>();

  constructor() {
    this.scrollLock.lock();
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
