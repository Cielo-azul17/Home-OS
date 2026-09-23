export type IconName =
  | 'home'
  | 'search'
  | 'bell'
  | 'plus'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'box'
  | 'door'
  | 'wallet'
  | 'file-text'
  | 'settings'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'alert-triangle'
  | 'camera'
  | 'sparkle'
  | 'check-circle'
  | 'file-plus'
  | 'bell-plus'
  | 'receipt'
  | 'help-circle'
  | 'x'
  | 'minus'
  | 'upload'
  | 'image'
  | 'calendar'
  | 'clock'
  | 'edit'
  | 'trash'
  | 'shield'
  | 'wrench'
  | 'tag'
  | 'check'
  | 'grid'
  | 'list'
  | 'download'
  | 'inbox';

export interface NavItem {
  label: string;
  icon: IconName;
  path: string;
}

/* ---------- Domain ---------- */

export type AssetCategory =
  | 'Electronics'
  | 'Appliances'
  | 'Climate'
  | 'Kitchen'
  | 'Furniture'
  | 'Other';

export const ASSET_CATEGORIES: AssetCategory[] = [
  'Electronics',
  'Appliances',
  'Climate',
  'Kitchen',
  'Furniture',
  'Other',
];

export const CATEGORY_ICON: Record<AssetCategory, IconName> = {
  Electronics: 'box',
  Appliances: 'box',
  Climate: 'wrench',
  Kitchen: 'box',
  Furniture: 'door',
  Other: 'tag',
};

export interface Room {
  id: string;
  name: string;
  image: string;
}

export interface RoomSummary extends Room {
  assetCount: number;
}

export interface ServiceRecord {
  id: string;
  kind: 'service' | 'repair';
  title: string;
  date: string;
  cost?: number;
  provider?: string;
}

export interface Asset {
  id: string;
  name: string;
  brand?: string;
  category: AssetCategory;
  roomId: string;
  image?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  serialNumber?: string;
  notes?: string;
  history: ServiceRecord[];
}

export interface Reminder {
  id: string;
  title: string;
  assetId?: string;
  dueDate: string;
  repeat: 'none' | 'monthly' | 'quarterly' | 'yearly';
  completed: boolean;
  notes?: string;
}

export type ExpenseCategory =
  | 'Utilities'
  | 'Maintenance'
  | 'Repairs'
  | 'Purchases'
  | 'Services'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Utilities',
  'Maintenance',
  'Repairs',
  'Purchases',
  'Services',
  'Other',
];

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  assetId?: string;
}

export type DocumentKind = 'Warranty' | 'Invoice' | 'Manual' | 'Insurance' | 'Other';

export const DOCUMENT_KINDS: DocumentKind[] = [
  'Warranty',
  'Invoice',
  'Manual',
  'Insurance',
  'Other',
];

export interface HomeDocument {
  id: string;
  title: string;
  kind: DocumentKind;
  assetId?: string;
  addedDate: string;
  fileName: string;
  sizeLabel: string;
  /** Data URL of the file itself, so it can be previewed in place. */
  fileUrl?: string;
  mimeType?: string;
}

export interface ActivityEntry {
  id: string;
  icon: IconName;
  title: string;
  context: string;
  at: string;
}

/* ---------- Derived / view models ---------- */

export type BadgeTone = 'success' | 'warning' | 'error' | 'neutral' | 'sage';

export interface StatusBadgeModel {
  label: string;
  tone: BadgeTone;
}

export type ReminderState = 'upcoming' | 'due' | 'overdue' | 'completed';

export interface OverviewStat {
  icon: IconName;
  value: string;
  label: string;
  trend: {
    text: string;
    tone: 'positive' | 'attention' | 'neutral';
    direction: 'up' | 'down' | 'none';
  };
}

/* Notifications are never stored — they're derived from the same reminders,
   warranties and spending the rest of the app already tracks. The only state
   the app owns is which ones have been read or dismissed. */

export type NotificationGroup = 'action' | 'update';

export interface HomeNotification {
  id: string;
  group: NotificationGroup;
  icon: IconName;
  title: string;
  context: string;
  /** The coloured half of the meta line — the bit that needs the eye. */
  status: string;
  severity: 'error' | 'warning' | 'neutral';
  /** ISO date the notification hangs off, for sorting newest/soonest first. */
  date: string;
  link?: string;
}

export interface AttentionEntry {
  icon: IconName;
  title: string;
  context: string;
  status: string;
  severity: 'warning' | 'error';
  link?: string;
}

/* ---------- AI (V1: Photo -> Identify -> Suggest -> Confirm) ----------
   A single photo can imply several records at once: a product invoice is an
   expense, a document, and often a new asset. The model proposes each part
   independently and the user confirms which ones to keep. */

export type ScanKind = 'invoice' | 'receipt' | 'warranty' | 'product' | 'unknown';

export interface AiAssetDraft {
  name: string;
  brand?: string;
  category: AssetCategory;
  roomId: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  serialNumber?: string;
}

export interface AiExpenseDraft {
  title: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
}

export interface AiDocumentDraft {
  title: string;
  kind: DocumentKind;
  fileName: string;
  sizeLabel: string;
}

/* One group = one purchase, bundling the records it implies: the thing you
   now own, what you paid, and the paper itself. Grouping is what lets the
   review screen keep a bill's three records together, and what makes the
   expense link to its OWN asset when a photo holds several bills. */
export interface AiRecordGroup {
  label: string;
  asset?: AiAssetDraft;
  expense?: AiExpenseDraft;
  document?: AiDocumentDraft;
}

export interface AiExtraction {
  scanKind: ScanKind;
  summary: string;
  confidence: number;
  groups: AiRecordGroup[];
}

export const SCAN_LABEL: Record<ScanKind, string> = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  warranty: 'Warranty card',
  product: 'Product photo',
  unknown: 'Photo',
};

export type AddMenuAction = 'Asset' | 'Expense' | 'Reminder' | 'Document';

/** 'Anything' is the photo-led flow that can create several linked records;
    'Room' isn't in the + menu but uses the same modal machinery. */
export type AddFlowKind = AddMenuAction | 'Anything' | 'Room';
