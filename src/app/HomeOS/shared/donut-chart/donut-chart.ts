import { Component, computed, input, signal } from '@angular/core';

/* Hand-rolled SVG rather than a charting library: one ring doesn't justify
   a dependency, and a library's defaults would fight the design system on
   every colour and radius.

   The palette has a single accent, and the system forbids multiple bright
   accents — so slices are a monochrome sage ramp, darkest first. That ramp
   stops being readable past about five bands, which is why callers pass a
   capped list with the tail folded into "Other". */

export interface DonutSegment {
  label: string;
  value: number;
  percent: number;
}

const SIZE = 180;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** A hairline of background between slices, in path units. */
const GAP = 3;

/** Sage mixed toward eggshell — darkest band is the largest share. */
const RAMP = [100, 74, 54, 38, 24];

@Component({
  selector: 'app-donut-chart',
  template: `
    <div class="donut" [style.width.px]="size" [style.height.px]="size">
      <svg
        [attr.viewBox]="'0 0 ' + size + ' ' + size"
        [attr.width]="size"
        [attr.height]="size"
        role="img"
        [attr.aria-label]="label()"
      >
        <g [attr.transform]="'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'">
          <circle
            class="track"
            [attr.cx]="size / 2"
            [attr.cy]="size / 2"
            [attr.r]="radius"
            [attr.stroke-width]="stroke"
          />

          @for (slice of slices(); track slice.label) {
            <circle
              class="slice"
              [class.dimmed]="active() !== null && active() !== slice.index"
              [attr.cx]="size / 2"
              [attr.cy]="size / 2"
              [attr.r]="radius"
              [attr.stroke]="slice.color"
              [attr.stroke-width]="active() === slice.index ? stroke + 4 : stroke"
              [attr.stroke-dasharray]="slice.dash"
              [attr.stroke-dashoffset]="slice.offset"
            />
          }
        </g>
      </svg>

      <div class="centre">
        <span class="total">{{ total() }}</span>
        @if (caption()) {
          <span class="caption">{{ caption() }}</span>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      flex-shrink: 0;
    }

    .donut {
      position: relative;
    }

    svg {
      display: block;
      overflow: visible;
    }

    .track {
      fill: none;
      stroke: var(--color-stone);
    }

    .slice {
      fill: none;
      stroke-linecap: butt;
      transition: stroke-width 0.15s ease, opacity 0.15s ease;
    }

    .slice.dimmed {
      opacity: 0.45;
    }

    /* The hole carries the number the ring is made of, so the eye never
       has to leave the chart to learn the total. */

    .centre {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-4);
      pointer-events: none;
      text-align: center;
      padding: 0 var(--spacing-24);
    }

    .total {
      font-size: var(--text-body-lg);
      font-weight: 500;
      line-height: 1.2;
      color: var(--color-charcoal);
      font-variant-numeric: tabular-nums;
    }

    .caption {
      font-size: var(--text-caption);
      line-height: 1.4;
      color: var(--color-smoke);
    }
  `,
})
export class DonutChart {
  segments = input.required<DonutSegment[]>();
  /** Pre-formatted, so the chart never has to know about currency. */
  total = input('');
  caption = input('');
  label = input('Spending by category');

  /** Set by the legend, so hovering a row lifts its slice. */
  active = signal<number | null>(null);

  size = SIZE;
  stroke = STROKE;
  radius = RADIUS;

  readonly slices = computed(() => {
    const segments = this.segments();
    const sum = segments.reduce((n, s) => n + s.value, 0);
    if (!sum) return [];

    let cumulative = 0;

    return segments.map((segment, index) => {
      const length = (segment.value / sum) * CIRCUMFERENCE;
      const offset = -((cumulative / sum) * CIRCUMFERENCE);
      cumulative += segment.value;

      return {
        index,
        label: segment.label,
        color: colorAt(index),
        // Never let the gap eat a sliver whole.
        dash: `${Math.max(length - GAP, 1)} ${CIRCUMFERENCE}`,
        offset,
      };
    });
  });
}

/** Shared with the legend so dots and slices can't drift apart. */
export function colorAt(index: number): string {
  const mix = RAMP[Math.min(index, RAMP.length - 1)];
  return `color-mix(in srgb, var(--color-sage) ${mix}%, var(--color-eggshell))`;
}
