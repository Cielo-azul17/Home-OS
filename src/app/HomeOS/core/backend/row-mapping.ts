import {
  ActivityEntry,
  Asset,
  AssetCategory,
  DocumentKind,
  Expense,
  ExpenseCategory,
  HomeDocument,
  IconName,
  Reminder,
  Room,
  ServiceRecord,
} from '../models';

/* The boundary between Postgres rows and the domain model: snake_case,
   numeric strings and nulls stop here, and everything past this file is the
   same shape the mock backend produces.

   Kept separate from the queries so it can be tested without a network. */

/** PostgREST hands back untyped JSON; these functions are the type boundary. */
type Row = any;

/* A stored file is a bucket-relative path. Anything with a scheme is already
   a URL — a seeded https image, or a data: URL not yet uploaded — and a
   leading slash is a local asset. None of those should be signed. */
export function isStoragePath(value: unknown): value is string {
  return typeof value === 'string' && !!value && !/^(https?:|data:|\/)/.test(value);
}

export function toRoom(row: Row): Room {
  return { id: row.id, name: row.name, image: row.image ?? '' };
}

export function toAsset(
  row: Row,
  image: string | undefined,
  history: ServiceRecord[],
): Asset {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    category: row.category as AssetCategory,
    roomId: row.room_id ?? '',
    image: image ?? undefined,
    purchaseDate: row.purchase_date ?? undefined,
    // numeric(12,2) arrives as a string over the wire.
    purchasePrice: row.purchase_price != null ? Number(row.purchase_price) : undefined,
    warrantyExpiry: row.warranty_expiry ?? undefined,
    serialNumber: row.serial_number ?? undefined,
    notes: row.notes ?? undefined,
    history,
  };
}

export function toServiceRecord(row: Row): ServiceRecord {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    date: row.date,
    cost: row.cost != null ? Number(row.cost) : undefined,
    provider: row.provider ?? undefined,
  };
}

export function toReminder(row: Row): Reminder {
  return {
    id: row.id,
    title: row.title,
    assetId: row.asset_id ?? undefined,
    dueDate: row.due_date,
    repeat: row.repeat,
    completed: row.completed,
    notes: row.notes ?? undefined,
  };
}

export function toExpense(row: Row): Expense {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    date: row.date,
    category: row.category as ExpenseCategory,
    assetId: row.asset_id ?? undefined,
  };
}

export function toDocument(row: Row, fileUrl: string | undefined): HomeDocument {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind as DocumentKind,
    assetId: row.asset_id ?? undefined,
    addedDate: row.added_date,
    fileName: row.file_name,
    sizeLabel: row.size_label ?? '',
    fileUrl,
    mimeType: row.mime_type ?? undefined,
  };
}

export function toActivity(row: Row): ActivityEntry {
  return {
    id: row.id,
    icon: row.icon as IconName,
    title: row.title,
    context: row.context ?? '',
    // The app works in plain dates; the column is a timestamp.
    at: String(row.at).slice(0, 10),
  };
}

/* ---------- Files ---------- */

export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma < 0) {
    throw new Error('Not a data URL');
  }

  const header = dataUrl.slice(0, comma);
  const semicolon = header.indexOf(';');
  const type = header.slice(5, semicolon > 0 ? semicolon : undefined) || 'application/octet-stream';

  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

/** Storage keys allow a narrow set of characters; invoice names rarely do. */
export function safeName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-60);
  return cleaned || 'file';
}
