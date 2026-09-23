import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { Icon } from '../shared/icon/icon';
import { NAV_ITEMS } from './nav-items';
import { AddFlowHost } from '../add/add-flow-host';
import { ToastHost } from '../shared/toast/toast';
import { DocumentViewer } from '../shared/document-viewer/document-viewer';
import { DocumentViewerService } from '../shared/document-viewer/document-viewer.service';
import { NotificationsPanel } from '../notifications/notifications-panel';
import { NotificationsService } from '../core/notifications.service';
import { HelpPanel } from '../help/help-panel';
import { HelpService } from '../help/help.service';
import { SignIn } from '../auth/sign-in';
import { Supabase } from '../core/backend/supabase-client';
import { HomeStore } from '../core/home-store';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Sidebar,
    Icon,
    AddFlowHost,
    ToastHost,
    DocumentViewer,
    NotificationsPanel,
    HelpPanel,
    SignIn,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  documentViewer = inject(DocumentViewerService);
  notifications = inject(NotificationsService);
  help = inject(HelpService);
  private supabase = inject(Supabase);
  store = inject(HomeStore);

  mobileNavItems = NAV_ITEMS.slice(0, 4);

  retry(): void {
    void this.store.reload();
  }

  /* Only gate the app once there's a project to sign in to. Without one,
     HomeOS runs on mock data and there's nothing to authenticate against.
     `ready` keeps the door from flashing before a stored session loads. */
  readonly needsAuth = computed(
    () => false, // TEMP: Skip auth for testing
  );
}
