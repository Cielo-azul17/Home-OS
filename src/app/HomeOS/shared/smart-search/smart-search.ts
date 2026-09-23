import {
  Component,
  computed,
  ElementRef,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../icon/icon';
import { Truncated } from '../tooltip/truncated.directive';
import { IconName } from '../../core/models';

export interface SearchSuggestion {
  /** Parent-defined, e.g. "asset:a-tv" — the parent decides what a pick means. */
  id: string;
  label: string;
  detail?: string;
  icon: IconName;
}

@Component({
  selector: 'app-smart-search',
  imports: [Icon, FormsModule, Truncated],
  templateUrl: './smart-search.html',
  styleUrl: './smart-search.css',
})
export class SmartSearch {
  placeholder = input('Search');
  value = input('');
  suggestions = input<SearchSuggestion[]>([]);
  large = input(false);

  valueChange = output<string>();
  picked = output<SearchSuggestion>();
  submitted = output<string>();

  open = signal(false);
  highlighted = signal(0);

  constructor(private host: ElementRef<HTMLElement>) {}

  readonly showList = computed(() => this.open() && this.suggestions().length > 0);

  /** Splits a label around the typed text so the match can be emphasised. */
  parts(label: string): { before: string; match: string; after: string } {
    const term = this.value().trim();
    if (!term) return { before: label, match: '', after: '' };
    const at = label.toLowerCase().indexOf(term.toLowerCase());
    if (at < 0) return { before: label, match: '', after: '' };
    return {
      before: label.slice(0, at),
      match: label.slice(at, at + term.length),
      after: label.slice(at + term.length),
    };
  }

  onInput(next: string): void {
    this.valueChange.emit(next);
    this.highlighted.set(0);
    this.open.set(true);
  }

  onFocus(): void {
    if (this.value().trim()) this.open.set(true);
  }

  pick(suggestion: SearchSuggestion): void {
    this.open.set(false);
    this.picked.emit(suggestion);
  }

  onKeydown(event: KeyboardEvent): void {
    const list = this.suggestions();

    if (event.key === 'Escape') {
      this.open.set(false);
      return;
    }

    if (event.key === 'Enter') {
      const choice = this.showList() ? list[this.highlighted()] : null;
      if (choice) {
        event.preventDefault();
        this.pick(choice);
      } else {
        this.open.set(false);
        this.submitted.emit(this.value());
      }
      return;
    }

    if (!list.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open.set(true);
      this.highlighted.set((this.highlighted() + 1) % list.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlighted.set((this.highlighted() - 1 + list.length) % list.length);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
