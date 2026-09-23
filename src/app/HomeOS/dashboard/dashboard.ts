import { Component, computed, inject } from '@angular/core';
import { SectionHeader } from '../shared/section-header/section-header';
import { OverviewCard } from '../shared/overview-card/overview-card';
import { RoomCard } from '../shared/room-card/room-card';
import { AttentionItemComponent } from '../shared/attention-item/attention-item';
import { ActivityItemComponent } from '../shared/activity-item/activity-item';
import { ReminderItemComponent } from '../shared/reminder-item/reminder-item';
import { AiAddCard } from '../shared/ai-add-card/ai-add-card';
import { EmptyState } from '../shared/empty-state/empty-state';
import { Topbar } from '../shell/topbar/topbar';
import { AlertsBanner } from '../shared/alerts-banner/alerts-banner';
import { HomeStore } from '../core/home-store';
import { AddFlowService } from '../add/add-flow.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    SectionHeader,
    OverviewCard,
    RoomCard,
    AttentionItemComponent,
    ActivityItemComponent,
    ReminderItemComponent,
    AiAddCard,
    EmptyState,
    Topbar,
    AlertsBanner,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private store = inject(HomeStore);
  private flow = inject(AddFlowService);

  userName = 'Akash';
  heroImage = '/images/hero-banner.png';

  loading = this.store.loading;
  overviewStats = this.store.overviewStats;
  rooms = this.store.roomSummaries;
  needsAttention = this.store.needsAttention;

  /* Each list shows its top 5 only — the panels are a fixed height and
     don't scroll, so the cap lives here rather than in CSS. */
  readonly topAttention = computed(() => this.needsAttention().slice(0, 5));

  readonly recentActivity = computed(() => this.store.activity().slice(0, 5));

  readonly upcomingReminders = computed(() => this.store.openReminders().slice(0, 5));

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  attentionCount = computed(() => this.needsAttention().length);

  /* Reads as a sentence at every count — "0 things need your attention" was
     both wrong and gloomy about good news. */
  readonly attentionLine = computed(() => {
    const n = this.attentionCount();
    if (this.loading()) return 'Getting your home in order…';
    if (!n) return 'Your home is looking good. Nothing needs your attention.';
    if (n === 1) return 'Your home is looking good. One thing needs your attention.';
    return `Your home is looking good. ${n} things need your attention.`;
  });

  /* One useful thing to do next, drawn from the user's own home rather than
     a generic tip feed. Static by design — it states a fact, it isn't a
     link to somewhere that doesn't exist yet. */
  readonly tip = computed(() => {
    const expiring = this.store.expiringWarranties().length;
    if (expiring) {
      return {
        title: expiring === 1 ? 'A warranty is running out' : `${expiring} warranties are running out`,
        text: 'Check what they cover before they lapse — a claim is far easier while it is still active.',
      };
    }

    const undocumented = this.store
      .assets()
      .filter((a) => !this.store.documentsForAsset(a.id).length).length;
    if (undocumented) {
      return {
        title: `${undocumented} ${undocumented === 1 ? 'item has' : 'items have'} no paperwork`,
        text: 'Snap the invoice or warranty card now, and it will be there when something breaks.',
      };
    }

    return {
      title: 'Your home is in good shape',
      text: 'Warranties are tracked, paperwork is filed and nothing is overdue.',
    };
  });

  reminderContext(assetId?: string): string {
    if (!assetId) return 'Household';
    const asset = this.store.asset(assetId);
    return asset ? this.store.roomName(asset.roomId) : 'Household';
  }

  addAsset(): void {
    this.flow.open('Asset');
  }

  addReminder(): void {
    this.flow.open('Reminder');
  }
}
