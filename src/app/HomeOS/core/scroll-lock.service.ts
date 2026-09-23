import { Injectable } from '@angular/core';

/* Freezes the page behind an overlay. Reference counted, because a modal can
   open on top of another overlay — the first unlock must not restore
   scrolling while something is still open.

   The scrollbar's width is added back as padding so the page doesn't shift
   sideways the moment it disappears. */

@Injectable({ providedIn: 'root' })
export class ScrollLock {
  private depth = 0;
  private previousBodyOverflow = '';
  private previousRootOverflow = '';
  private previousPadding = '';

  lock(): void {
    if (this.depth++ > 0) return;

    const root = document.documentElement;
    const body = document.body;
    const scrollbar = window.innerWidth - root.clientWidth;

    this.previousRootOverflow = root.style.overflow;
    this.previousBodyOverflow = body.style.overflow;
    this.previousPadding = body.style.paddingRight;

    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
  }

  unlock(): void {
    if (this.depth === 0) return;
    if (--this.depth > 0) return;

    document.documentElement.style.overflow = this.previousRootOverflow;
    document.body.style.overflow = this.previousBodyOverflow;
    document.body.style.paddingRight = this.previousPadding;
  }
}
