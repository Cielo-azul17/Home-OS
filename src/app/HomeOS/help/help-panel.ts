import { Component, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { Icon } from '../shared/icon/icon';
import { HelpService } from './help.service';
import { ScrollLock } from '../core/scroll-lock.service';
import { AddFlowService } from '../add/add-flow.service';
import { IconName } from '../core/models';

interface HelpTopic {
  id: string;
  icon: IconName;
  title: string;
  summary: string;
  points: string[];
}

/* Written as answers to what someone actually wonders while using the app,
   not as a feature list. */
const TOPICS: HelpTopic[] = [
  {
    id: 'photo',
    icon: 'sparkle',
    title: 'Add anything from a photo',
    summary: 'Point at a bill and let the AI do the typing.',
    points: [
      'One bill usually becomes three records: the product you now own, what you paid, and the paper itself.',
      'Drop in several bills at once — they are read one at a time, and you review everything together at the end.',
      'Nothing is saved until you confirm. Untick anything you do not want.',
    ],
  },
  {
    id: 'search',
    icon: 'search',
    title: 'Search that guesses',
    summary: 'Type two letters, pick a suggestion.',
    points: [
      'Suggestions come from what you actually own — type "Sa" and Samsung shows up.',
      'Picking a room or a category applies it as a filter instead of a text search.',
      'Arrow keys move, Enter picks, Escape closes.',
    ],
  },
  {
    id: 'documents',
    icon: 'file-text',
    title: 'Reading your documents',
    summary: 'Open a document without leaving the page.',
    points: [
      'The list on the left is a table of contents — move between documents in place.',
      'Filter by type or search by name when the list gets long.',
      'Zoom with + and −, press 0 to fit, or download the original.',
    ],
  },
  {
    id: 'reminders',
    icon: 'bell',
    title: 'Staying ahead',
    summary: 'The home tells you before something lapses.',
    points: [
      'Warranties are watched for you — you hear about one 30 days before it ends.',
      'Reminders repeat monthly, quarterly or yearly if you set them to.',
      'Anything urgent shows on Home under Needs Attention, and in the bell.',
    ],
  },
];

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Esc', action: 'Close a panel or dialog' },
  { keys: '↑ ↓', action: 'Move through search suggestions' },
  { keys: '← →', action: 'Previous / next document' },
  { keys: '+ −', action: 'Zoom a document' },
  { keys: '0', action: 'Fit the document to the screen' },
];

@Component({
  selector: 'app-help-panel',
  imports: [Icon],
  templateUrl: './help-panel.html',
  styleUrl: './help-panel.css',
})
export class HelpPanel implements OnDestroy {
  private help = inject(HelpService);
  private scrollLock = inject(ScrollLock);
  private flow = inject(AddFlowService);

  topics = TOPICS;
  shortcuts = SHORTCUTS;

  /** Only one topic is expanded at a time, so the panel stays skimmable. */
  openTopic = signal<string>(TOPICS[0].id);

  constructor() {
    this.scrollLock.lock();
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock();
  }

  toggleTopic(id: string): void {
    this.openTopic.update((current) => (current === id ? '' : id));
  }

  /** The panel's one action: the thing most people opened it to work out. */
  tryIt(): void {
    this.close();
    this.flow.open('Anything');
  }

  close(): void {
    this.help.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
