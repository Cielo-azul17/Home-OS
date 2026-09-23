import { Routes } from '@angular/router';
import { Shell } from './shell/shell';
import { Dashboard } from './dashboard/dashboard';
import { InventoryPage } from './inventory/inventory';
import { AssetDetail } from './inventory/asset-detail';
import { RoomsPage } from './rooms/rooms';
import { RoomDetail } from './rooms/room-detail';
import { RemindersPage } from './reminders/reminders';
import { FinancesPage } from './finances/finances';
import { DocumentsPage } from './documents/documents';
import { SettingsPage } from './settings/settings';

export const homeOSRoutes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'inventory', component: InventoryPage },
      { path: 'inventory/:id', component: AssetDetail },
      { path: 'rooms', component: RoomsPage },
      { path: 'rooms/:id', component: RoomDetail },
      { path: 'reminders', component: RemindersPage },
      { path: 'finances', component: FinancesPage },
      { path: 'documents', component: DocumentsPage },
      { path: 'settings', component: SettingsPage },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
