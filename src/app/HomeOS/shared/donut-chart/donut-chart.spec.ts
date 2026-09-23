import { TestBed } from '@angular/core/testing';
import { colorAt, DonutChart, DonutSegment } from './donut-chart';

/* The ring is drawn with stroke-dasharray offsets rather than paths, so the
   arithmetic is the whole component. A wrong offset silently draws a chart
   that is simply untrue. */

const CIRCUMFERENCE = 2 * Math.PI * ((180 - 22) / 2);

function chart(segments: DonutSegment[]): DonutChart {
  TestBed.resetTestingModule();
  const fixture = TestBed.createComponent(DonutChart);
  fixture.componentRef.setInput('segments', segments);
  fixture.detectChanges();
  return fixture.componentInstance;
}

function segment(label: string, value: number, percent = 0): DonutSegment {
  return { label, value, percent };
}

describe('DonutChart', () => {
  it('draws nothing when there is nothing to draw', () => {
    expect(chart([]).slices()).toEqual([]);
    expect(chart([segment('Utilities', 0)]).slices()).toEqual([]);
  });

  it('gives a single category the whole ring', () => {
    const [slice] = chart([segment('Utilities', 1000)]).slices();
    const length = Number(slice.dash.split(' ')[0]);

    // Minus the hairline gap between slices.
    expect(length).toBeCloseTo(CIRCUMFERENCE - 3, 1);
    expect(slice.offset).toBe(-0);
  });

  it('splits two equal categories in half', () => {
    const slices = chart([segment('A', 500), segment('B', 500)]).slices();

    const first = Number(slices[0].dash.split(' ')[0]);
    expect(first).toBeCloseTo(CIRCUMFERENCE / 2 - 3, 1);
    // The second starts exactly where the first ended.
    expect(slices[1].offset).toBeCloseTo(-CIRCUMFERENCE / 2, 1);
  });

  it('places each slice after the ones before it', () => {
    const slices = chart([segment('A', 500), segment('B', 300), segment('C', 200)]).slices();

    expect(slices[0].offset).toBeCloseTo(-0, 5);
    expect(slices[1].offset).toBeCloseTo(-CIRCUMFERENCE * 0.5, 1);
    expect(slices[2].offset).toBeCloseTo(-CIRCUMFERENCE * 0.8, 1);
  });

  it('keeps a sliver visible rather than letting the gap eat it', () => {
    // 0.1% of the ring is smaller than the 3px gap.
    const slices = chart([segment('Big', 9990), segment('Tiny', 10)]).slices();
    const tiny = Number(slices[1].dash.split(' ')[0]);

    expect(tiny).toBeGreaterThan(0);
  });

  it('always declares the full circumference as the dash gap', () => {
    // Otherwise the browser repeats the segment around the ring.
    for (const slice of chart([segment('A', 1), segment('B', 1)]).slices()) {
      expect(Number(slice.dash.split(' ')[1])).toBeCloseTo(CIRCUMFERENCE, 5);
    }
  });

  it('darkest band first, and never runs out of shades', () => {
    expect(colorAt(0)).toContain('var(--color-sage) 100%');
    expect(colorAt(1)).toContain('var(--color-sage) 74%');
    // Mixed toward eggshell, so later bands are paler, never a new hue.
    expect(colorAt(4)).toContain('var(--color-eggshell)');

    // Beyond the ramp it clamps instead of returning undefined.
    expect(colorAt(99)).toBe(colorAt(4));
  });

  it('gives the legend the same colour as the slice', () => {
    const slices = chart([segment('A', 2), segment('B', 1)]).slices();

    expect(slices[0].color).toBe(colorAt(0));
    expect(slices[1].color).toBe(colorAt(1));
  });

  it('keeps the slice index so the legend can highlight it', () => {
    const slices = chart([segment('A', 2), segment('B', 1)]).slices();
    expect(slices.map((s) => s.index)).toEqual([0, 1]);
  });
});
