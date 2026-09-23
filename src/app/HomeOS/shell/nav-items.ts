import { NavItem } from '../core/models';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: 'home', path: '/dashboard' },
  { label: 'Inventory', icon: 'box', path: '/inventory' },
  { label: 'Rooms', icon: 'door', path: '/rooms' },
  { label: 'Reminders', icon: 'bell', path: '/reminders' },
  { label: 'Finances', icon: 'wallet', path: '/finances' },
  { label: 'Documents', icon: 'file-text', path: '/documents' },
  { label: 'Settings', icon: 'settings', path: '/settings' },
];
