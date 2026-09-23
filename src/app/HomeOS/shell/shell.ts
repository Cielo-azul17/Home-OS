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
import { OnboardingWizard } from '../onboarding/onboarding-wizard';
import { OnboardingService } from '../core/onboarding.service';
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
    OnboardingWizard,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  documentViewer = inject(DocumentViewerService);
  notifications = inject(NotificationsService);
  help = inject(HelpService);
  onboarding = inject(OnboardingService);
  private supabase = inject(Supabase);
  store = inject(HomeStore);

  mobileNavItems = NAV_ITEMS.slice(0, 4);

  retry(): void {
    void this.store.reload();
  }

  needsAuth() { return false; }
}
