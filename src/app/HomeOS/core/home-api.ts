import { inject, Injectable } from '@angular/core';
import {
  ActivityEntry,
  Asset,
  Expense,
  HomeDocument,
  Reminder,
  Room,
} from './models';
import {
  SEED_ACTIVITY,
  SEED_ASSETS,
  SEED_DOCUMENTS,
  SEED_EXPENSES,
  SEED_REMINDERS,
  SEED_ROOMS,
} from './mock-data';
import { Supabase } from './backend/supabase-client';
import { SupabaseBackend } from './backend/supabase-backend';

export interface HomeSnapshot {
  rooms: Room[];
  assets: Asset[];
  reminders: Reminder[];
  expenses: Expense[];
  documents: HomeDocument[];
  activity: ActivityEntry[];
}

/* The app's single backend seam.

   With Supabase configured and a user signed in, every call goes to Postgres
   and Storage. Without it, the same calls run against the seeded mock data
   in memory — so the app is always runnable, and the difference never leaks
   past this file.

   Note the return values: callers must use what comes BACK from create and
   update, not what they sent. Real rows carry server-issued ids, timestamps
   and signed file URLs. */

@Injectable({ providedIn: 'root' })
export class HomeApi {
  private supabase = inject(Supabase);
  private remote = inject(SupabaseBackend);

  private latency = 180;

  /** True once there's a project AND somebody signed in to it. */
  get live(): boolean {
    return this.supabase.configured && !!this.supabase.user();
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(structuredClone(value)), this.latency),
    );
  }

  loadSnapshot(): Promise<HomeSnapshot> {
    if (this.live) return this.remote.loadSnapshot();
    return this.delay({
      rooms: SEED_ROOMS,
      assets: SEED_ASSETS,
      reminders: SEED_REMINDERS,
      expenses: SEED_EXPENSES,
      documents: SEED_DOCUMENTS,
      activity: SEED_ACTIVITY,
    });
  }

  createAsset(asset: Asset): Promise<Asset> {
    return this.live ? this.remote.createAsset(asset) : this.delay(asset);
  }

  updateAsset(asset: Asset): Promise<Asset> {
    return this.live ? this.remote.updateAsset(asset) : this.delay(asset);
  }

  deleteAsset(id: string): Promise<string> {
    return this.live ? this.remote.deleteAsset(id) : this.delay(id);
  }

  createReminder(reminder: Reminder): Promise<Reminder> {
    return this.live ? this.remote.createReminder(reminder) : this.delay(reminder);
  }

  updateReminder(reminder: Reminder): Promise<Reminder> {
    return this.live ? this.remote.updateReminder(reminder) : this.delay(reminder);
  }

  deleteReminder(id: string): Promise<string> {
    return this.live ? this.remote.deleteReminder(id) : this.delay(id);
  }

  createExpense(expense: Expense): Promise<Expense> {
    return this.live ? this.remote.createExpense(expense) : this.delay(expense);
  }

  updateExpense(expense: Expense): Promise<Expense> {
    return this.live ? this.remote.updateExpense(expense) : this.delay(expense);
  }

  deleteExpense(id: string): Promise<string> {
    return this.live ? this.remote.deleteExpense(id) : this.delay(id);
  }

  createDocument(doc: HomeDocument): Promise<HomeDocument> {
    return this.live ? this.remote.createDocument(doc) : this.delay(doc);
  }

  updateDocument(doc: HomeDocument): Promise<HomeDocument> {
    return this.live ? this.remote.updateDocument(doc) : this.delay(doc);
  }

  deleteDocument(id: string): Promise<string> {
    return this.live ? this.remote.deleteDocument(id) : this.delay(id);
  }

  createRoom(room: Room): Promise<Room> {
    return this.live ? this.remote.createRoom(room) : this.delay(room);
  }

  updateRoom(room: Room): Promise<Room> {
    return this.live ? this.remote.updateRoom(room) : this.delay(room);
  }

  /** Fire-and-forget: a failed log entry must never fail the user's action. */
  logActivity(entry: ActivityEntry): Promise<ActivityEntry> {
    if (!this.live) return this.delay(entry);
    return this.remote.logActivity(entry).catch(() => entry);
  }
}
