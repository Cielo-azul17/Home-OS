import { Injectable, OnDestroy } from '@angular/core';

/* One tooltip node for the whole app, parked on <body> so it can never be
   clipped by a card's overflow or trapped under an overlay's stacking
   context. Positioned above the anchor, flipped below when there's no room,
   and clamped to the viewport on both sides. */

const SHOW_DELAY = 250;
const GAP = 8;
const EDGE = 8;

@Injectable({ providedIn: 'root' })
export class TooltipService implements OnDestroy {
  private node: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /* A tooltip is pinned to a point on screen, so anything that moves the
     anchor under it — a scrolling list, a resized window — dismisses it
     rather than leaving it stranded. Capture phase, because the scroll
     usually happens on a panel rather than the window. */
  private readonly dismiss = () => this.hide();

  constructor() {
    window.addEventListener('scroll', this.dismiss, true);
    window.addEventListener('resize', this.dismiss);
  }

  show(anchor: HTMLElement, text: string): void {
    this.cancel();
    this.timer = setTimeout(() => this.render(anchor, text), SHOW_DELAY);
  }

  hide(): void {
    this.cancel();
    this.node?.classList.remove('visible');
  }

  ngOnDestroy(): void {
    this.cancel();
    window.removeEventListener('scroll', this.dismiss, true);
    window.removeEventListener('resize', this.dismiss);
    this.node?.remove();
    this.node = null;
  }

  private cancel(): void {
    if (this.timer === null) return;
    clearTimeout(this.timer);
    this.timer = null;
  }

  private render(anchor: HTMLElement, text: string): void {
    const node = this.ensureNode();
    node.textContent = text;

    /* Measured while visible but off-screen — a hidden node reports a zero
       box, which would put every tooltip in the corner. */
    node.style.left = '0px';
    node.style.top = '-9999px';
    node.classList.add('visible');

    const target = anchor.getBoundingClientRect();
    const tip = node.getBoundingClientRect();

    let left = target.left + target.width / 2 - tip.width / 2;
    left = Math.max(EDGE, Math.min(left, window.innerWidth - tip.width - EDGE));

    const above = target.top - tip.height - GAP;
    const top = above < EDGE ? target.bottom + GAP : above;

    node.style.left = `${Math.round(left)}px`;
    node.style.top = `${Math.round(top)}px`;
  }

  private ensureNode(): HTMLElement {
    if (this.node) return this.node;
    const node = document.createElement('div');
    node.className = 'homeos-tooltip';
    node.setAttribute('role', 'tooltip');
    document.body.appendChild(node);
    this.node = node;
    return node;
  }
}
