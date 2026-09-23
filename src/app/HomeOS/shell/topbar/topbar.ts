import { Component, computed, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { SmartSearch, SearchSuggestion } from '../../shared/smart-search/smart-search';
import { AddMenuAction } from '../../core/models';
import { AddFlowService } from '../../add/add-flow.service';
import { HomeStore } from '../../core/home-store';
import { DocumentViewerService } from '../../shared/document-viewer/document-viewer.service';
import { NotificationsService } from '../../core/notifications.service';
import { HelpService } from '../../help/help.service';

/* Rendered by the Dashboard, not the Shell — it's a Home-screen element.
   Every other page has its own header and its own search, so a second set
   of global controls there was just duplicate chrome. */

@Component({
  selector: 'app-topbar',
  imports: [Icon, SmartSearch],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private flow = inject(AddFlowService);
  private router = inject(Router);
  private store = inject(HomeStore);
  private viewer = inject(DocumentViewerService);
  private notifications = inject(NotificationsService);
  private help = inject(HelpService);

  isAddMenuOpen = signal(false);
  query = signal('');

  /* Driven by the real derived list, so the bell never claims news the
     Notifications screen can't show. */
  readonly unreadCount = this.notifications.unreadCount;
  readonly unreadLabel = computed(() => {
    const n = this.unreadCount();
    return n > 9 ? '9+' : String(n);
  });

  openNotifications(): void {
    this.isAddMenuOpen.set(false);
    this.notifications.togglePanel();
  }

  openHelp(): void {
    this.isAddMenuOpen.set(false);
    this.help.toggle();
  }

  addMenuActions: AddMenuAction[] = ['Asset', 'Expense', 'Reminder', 'Document'];

  constructor(private host: ElementRef<HTMLElement>) {}

  /* Searches the whole home — products, rooms, documents and reminders —
     since this is the only search on the Home screen. */
  readonly suggestions = computed<SearchSuggestion[]>(() => {
    const term = this.query().trim().toLowerCase();
    if (!term) return [];

    const out: SearchSuggestion[] = [];
    const add = (id: string, label: string, detail: string, icon: SearchSuggestion['icon']) => {
      if (!label.toLowerCase().includes(term)) return;
      out.push({ id, label, detail, icon });
    };

    for (const a of this.store.assets()) {
      add(`asset:${a.id}`, a.name, `${this.store.roomName(a.roomId)} · ${a.category}`, 'box');
    }
    for (const r of this.store.rooms()) {
      add(`room:${r.id}`, r.name, 'Room', 'door');
    }
    for (const d of this.store.documents()) {
      add(`doc:${d.id}`, d.title, `${d.kind} · document`, 'file-text');
    }
    for (const r of this.store.openReminders()) {
      add(`reminder:${r.id}`, r.title, 'Reminder', 'bell');
    }

    return out.slice(0, 8);
  });

  onSuggestion(suggestion: SearchSuggestion): void {
    const at = suggestion.id.indexOf(':');
    const kind = suggestion.id.slice(0, at);
    const value = suggestion.id.slice(at + 1);

    this.query.set('');

    switch (kind) {
      case 'asset':
        this.router.navigate(['/inventory', value]);
        break;
      case 'room':
        this.router.navigate(['/rooms', value]);
        break;
      case 'doc': {
        const doc = this.store.documents().find((d) => d.id === value);
        if (doc) this.viewer.open(this.store.documents(), doc.id);
        break;
      }
      case 'reminder':
        this.router.navigate(['/reminders']);
        break;
    }
  }

  submitSearch(term: string): void {
    const q = term.trim();
    if (!q) return;
    this.router.navigate(['/inventory'], { queryParams: { q } });
  }

  toggleAddMenu(): void {
    this.isAddMenuOpen.update((open) => !open);
  }

  selectAddAction(action: AddMenuAction): void {
    this.isAddMenuOpen.set(false);
    this.flow.open(action);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.isAddMenuOpen.set(false);
    }
  }
}
