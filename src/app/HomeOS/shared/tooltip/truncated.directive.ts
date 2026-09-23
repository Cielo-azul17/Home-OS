import { Directive, ElementRef, HostListener, inject, input, OnDestroy } from '@angular/core';
import { TooltipService } from './tooltip.service';

/* Put this on anything that ellipsises or line-clamps. It measures the
   element on hover and only shows a tooltip when the text is genuinely
   cut off, so a short name never gets a pointless label repeating itself.

   Pass a value to override what's shown; by default it reads the element's
   own text, which keeps the tooltip honest as the content changes. */

@Directive({
  selector: '[appTruncated]',
})
export class Truncated implements OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private tooltip = inject(TooltipService);

  /** Optional explicit text — useful when the element renders markup. */
  readonly appTruncated = input('');

  @HostListener('mouseenter')
  @HostListener('focusin')
  onEnter(): void {
    const node = this.el.nativeElement;
    if (!this.isClipped(node)) return;

    const text = this.appTruncated().trim() || (node.textContent ?? '').trim();
    if (text) this.tooltip.show(node, text);
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  @HostListener('click')
  onLeave(): void {
    this.tooltip.hide();
  }

  ngOnDestroy(): void {
    this.tooltip.hide();
  }

  /** Covers both single-line ellipsis (width) and line-clamp (height). */
  private isClipped(node: HTMLElement): boolean {
    return node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1;
  }
}
