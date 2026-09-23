import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase-client';
import {
  ActivityEntry,
  Asset,
  Expense,
  HomeDocument,
  Reminder,
  Room,
  ServiceRecord,
} from '../models';
import {
  dataUrlToBlob,
  isStoragePath,
  safeName,
  toActivity,
  toAsset,
  toDocument,
  toExpense,
  toReminder,
  toRoom,
  toServiceRecord,
} from './row-mapping';
import { HomeSnapshot } from '../home-api';

/* Talks to Postgres through PostgREST, and to Storage for files.
   Everything the rest of the app sees is still the camelCase domain model —
   the snake_case columns stop here.

   Files are the one real difference from the mock: the app hands this layer
   `data:` URLs, and this layer turns them into objects in a private bucket,
   storing only the path. Signed URLs are minted on load so <img> and the
   document viewer keep working unchanged. */

const BUCKET = 'documents';
/* URLs are minted once per snapshot load, so this has to outlast a working
   session or images start 403-ing in a tab left open. Long enough for a day
   of use, short enough that a copied link isn't permanent. */
const SIGNED_URL_TTL = 8 * 60 * 60;

/** PostgREST rows are untyped JSON; row-mapping.ts is the type boundary. */
type Row = any;

@Injectable({ providedIn: 'root' })
export class SupabaseBackend {
  private supabase = inject(Supabase);
  private homeId: string | null = null;

  /* ---------- Snapshot ---------- */

  async loadSnapshot(): Promise<HomeSnapshot> {
    const homeId = await this.home();
    const db = this.supabase.db;

    const [rooms, assets, records, reminders, expenses, documents, activity] =
      await Promise.all([
        db.from('rooms').select('*').eq('home_id', homeId).order('sort_order'),
        db.from('assets').select('*').eq('home_id', homeId).order('created_at', { ascending: false }),
        db.from('service_records').select('*'),
        db.from('reminders').select('*').eq('home_id', homeId).order('due_date'),
        db.from('expenses').select('*').eq('home_id', homeId).order('date', { ascending: false }),
        db.from('documents').select('*').eq('home_id', homeId).order('added_date', { ascending: false }),
        db.from('activity').select('*').eq('home_id', homeId).order('at', { ascending: false }).limit(50),
      ]);

    for (const result of [rooms, assets, records, reminders, expenses, documents, activity]) {
      if (result.error) throw new Error(result.error.message);
    }

    /* One signing call for every stored file, rather than one per card —
       a home with 40 assets would otherwise make 40 round trips. */
    const paths = [
      ...(assets.data ?? []).map((r: Row) => r.image),
      ...(documents.data ?? []).map((r: Row) => r.storage_path),
    ].filter((path): path is string => isStoragePath(path));

    const urls = await this.signMany(paths);

    const history = new Map<string, ServiceRecord[]>();
    for (const row of records.data ?? []) {
      const list = history.get(row.asset_id) ?? [];
      list.push(toServiceRecord(row));
      history.set(row.asset_id, list);
    }

    return {
      rooms: (rooms.data ?? []).map(toRoom),
      assets: (assets.data ?? []).map((row: Row) =>
        toAsset(row, urls.get(row.image) ?? row.image, history.get(row.id) ?? []),
      ),
      reminders: (reminders.data ?? []).map(toReminder),
      expenses: (expenses.data ?? []).map(toExpense),
      documents: (documents.data ?? []).map((row: Row) =>
        toDocument(row, urls.get(row.storage_path)),
      ),
      activity: (activity.data ?? []).map(toActivity),
    };
  }

  /* ---------- Assets ---------- */

  async createAsset(asset: Asset): Promise<Asset> {
    const homeId = await this.home();
    const image = await this.store(asset.image, `${asset.name || 'asset'}.jpg`);

    const { data, error } = await this.supabase.db
      .from('assets')
      .insert({
        home_id: homeId,
        room_id: asset.roomId || null,
        name: asset.name,
        brand: asset.brand ?? null,
        category: asset.category,
        image,
        purchase_date: asset.purchaseDate || null,
        purchase_price: asset.purchasePrice ?? null,
        warranty_expiry: asset.warrantyExpiry || null,
        serial_number: asset.serialNumber ?? null,
        notes: asset.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toAsset(data, await this.sign(data.image), []);
  }

  async updateAsset(asset: Asset): Promise<Asset> {
    const image = await this.store(asset.image, `${asset.name || 'asset'}.jpg`);

    const { data, error } = await this.supabase.db
      .from('assets')
      .update({
        room_id: asset.roomId || null,
        name: asset.name,
        brand: asset.brand ?? null,
        category: asset.category,
        image,
        purchase_date: asset.purchaseDate || null,
        purchase_price: asset.purchasePrice ?? null,
        warranty_expiry: asset.warrantyExpiry || null,
        serial_number: asset.serialNumber ?? null,
        notes: asset.notes ?? null,
      })
      .eq('id', asset.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toAsset(data, await this.sign(data.image), asset.history);
  }

  async deleteAsset(id: string): Promise<string> {
    const { error } = await this.supabase.db.from('assets').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return id;
  }

  /* ---------- Reminders ---------- */

  async createReminder(reminder: Reminder): Promise<Reminder> {
    const homeId = await this.home();
    const { data, error } = await this.supabase.db
      .from('reminders')
      .insert({
        home_id: homeId,
        asset_id: reminder.assetId || null,
        title: reminder.title,
        due_date: reminder.dueDate,
        repeat: reminder.repeat,
        completed: reminder.completed,
        notes: reminder.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toReminder(data);
  }

  async updateReminder(reminder: Reminder): Promise<Reminder> {
    const { data, error } = await this.supabase.db
      .from('reminders')
      .update({
        asset_id: reminder.assetId || null,
        title: reminder.title,
        due_date: reminder.dueDate,
        repeat: reminder.repeat,
        completed: reminder.completed,
        notes: reminder.notes ?? null,
      })
      .eq('id', reminder.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toReminder(data);
  }

  async deleteReminder(id: string): Promise<string> {
    const { error } = await this.supabase.db.from('reminders').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return id;
  }

  /* ---------- Expenses ---------- */

  async createExpense(expense: Expense): Promise<Expense> {
    const homeId = await this.home();
    const { data, error } = await this.supabase.db
      .from('expenses')
      .insert({
        home_id: homeId,
        asset_id: expense.assetId || null,
        title: expense.title,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toExpense(data);
  }

  async updateExpense(expense: Expense): Promise<Expense> {
    const { data, error } = await this.supabase.db
      .from('expenses')
      .update({
        asset_id: expense.assetId || null,
        title: expense.title,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
      })
      .eq('id', expense.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toExpense(data);
  }

  async deleteExpense(id: string): Promise<string> {
    const { error } = await this.supabase.db.from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return id;
  }

  /* ---------- Documents ---------- */

  async createDocument(doc: HomeDocument): Promise<HomeDocument> {
    const homeId = await this.home();
    const path = await this.store(doc.fileUrl, doc.fileName);

    const { data, error } = await this.supabase.db
      .from('documents')
      .insert({
        home_id: homeId,
        asset_id: doc.assetId || null,
        title: doc.title,
        kind: doc.kind,
        file_name: doc.fileName,
        size_label: doc.sizeLabel,
        storage_path: path,
        mime_type: doc.mimeType ?? null,
        added_date: doc.addedDate,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toDocument(data, await this.sign(data.storage_path));
  }

  /** Metadata only — the stored file is never replaced by an edit. */
  async updateDocument(doc: HomeDocument): Promise<HomeDocument> {
    const { data, error } = await this.supabase.db
      .from('documents')
      .update({
        asset_id: doc.assetId || null,
        title: doc.title,
        kind: doc.kind,
      })
      .eq('id', doc.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toDocument(data, doc.fileUrl ?? (await this.sign(data.storage_path)));
  }

  async deleteDocument(id: string): Promise<string> {
    const db = this.supabase.db;

    /* Delete the object too — otherwise the bucket fills with files no row
       points at, and the user still gets billed for them. */
    const { data: existing } = await db
      .from('documents')
      .select('storage_path')
      .eq('id', id)
      .single();

    const { error } = await db.from('documents').delete().eq('id', id);
    if (error) throw new Error(error.message);

    if (existing?.storage_path) {
      await db.storage.from(BUCKET).remove([existing.storage_path]);
    }
    return id;
  }

  /* ---------- Rooms ---------- */

  async createRoom(room: Room): Promise<Room> {
    const homeId = await this.home();
    const image = await this.store(room.image, `${room.name || 'room'}.jpg`);

    const { data, error } = await this.supabase.db
      .from('rooms')
      .insert({ home_id: homeId, name: room.name, image })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toRoom({ ...data, image: (await this.sign(data.image)) ?? data.image });
  }

  async updateRoom(room: Room): Promise<Room> {
    const image = await this.store(room.image, `${room.name || 'room'}.jpg`);

    const { data, error } = await this.supabase.db
      .from('rooms')
      .update({ name: room.name, image })
      .eq('id', room.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toRoom({ ...data, image: (await this.sign(data.image)) ?? data.image });
  }

  /* ---------- Activity ---------- */

  async logActivity(entry: ActivityEntry): Promise<ActivityEntry> {
    const homeId = await this.home();
    const { data, error } = await this.supabase.db
      .from('activity')
      .insert({ home_id: homeId, icon: entry.icon, title: entry.title, context: entry.context })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return toActivity(data);
  }

  /* ---------- Internals ---------- */

  /** The signed-in account's home, created for them by a signup trigger. */
  private async home(): Promise<string> {
    if (this.homeId) return this.homeId;

    const { data, error } = await this.supabase.db
      .from('homes')
      .select('id')
      .eq('owner_id', this.supabase.userId)
      .single();

    if (error) throw new Error(error.message);
    this.homeId = data.id;
    return data.id;
  }

  /** Forgets the cached home so the next load belongs to whoever signs in. */
  reset(): void {
    this.homeId = null;
  }

  /* A `data:` URL means the user just picked this file, so it needs storing.
     Anything else is already a URL (a seeded image) or a path we wrote
     earlier — leave both alone. */
  private async store(value: string | undefined, fileName: string): Promise<string | null> {
    if (!value) return null;
    if (!value.startsWith('data:')) return value;

    const blob = dataUrlToBlob(value);
    const path = `${this.supabase.userId}/${crypto.randomUUID()}-${safeName(fileName)}`;

    const { error } = await this.supabase.db.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false });

    if (error) throw new Error(`Could not save the file: ${error.message}`);
    return path;
  }

  private async sign(path: string | null | undefined): Promise<string | undefined> {
    if (!isStoragePath(path)) return path ?? undefined;
    const urls = await this.signMany([path]);
    return urls.get(path);
  }

  private async signMany(paths: string[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    const unique = [...new Set(paths)];
    if (!unique.length) return out;

    const { data, error } = await this.supabase.db.storage
      .from(BUCKET)
      .createSignedUrls(unique, SIGNED_URL_TTL);

    // A missing file shouldn't take the whole page down — the card falls
    // back to its placeholder instead.
    if (error) return out;

    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) out.set(entry.path, entry.signedUrl);
    }
    return out;
  }
}
