import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Truncated } from '../../shared/tooltip/truncated.directive';
import { NAV_ITEMS } from '../nav-items';
import { Supabase } from '../../core/backend/supabase-client';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon, Truncated],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private supabase = inject(Supabase);

  /* The design system's primary navigation is Home / Inventory / Reminders /
     Finances / Documents. Settings isn't part of it, so it sits down by the
     profile instead of competing with the main list. */
  navItems = NAV_ITEMS.filter((item) => item.path !== '/settings');
  settingsItem = NAV_ITEMS.find((item) => item.path === '/settings')!;

  /* Falls back to the demo identity while the app is on mock data, so the
     footer never looks broken before a backend is wired up. */
  readonly signedIn = computed(() => !!this.supabase.user());

  readonly email = computed(() => this.supabase.user()?.email ?? 'akash@homeos.app');

  readonly name = computed(() => {
    const email = this.supabase.user()?.email;
    if (!email) return 'Akash';
    const handle = email.split('@')[0];
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  });

  readonly initial = computed(() => this.name().charAt(0).toUpperCase());

  async signOut(): Promise<void> {
    await this.supabase.signOut();
  }
}
