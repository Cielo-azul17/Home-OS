import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, SUPABASE_CONFIG } from '../../../../environments/supabase.config';

/* One client for the app. Created lazily so that an unconfigured project
   costs nothing and never throws on startup — HomeOS falls back to the mock
   backend in that case. */

@Injectable({ providedIn: 'root' })
export class Supabase {
  private client: SupabaseClient | null = null;

  /** Null until signed in; drives the auth screen and the sidebar. */
  readonly user = signal<User | null>(null);
  readonly ready = signal(false);

  readonly configured = isSupabaseConfigured();

  constructor() {
    if (!this.configured) {
      this.ready.set(true);
      return;
    }

    this.client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });

    /* Fires once with the restored session on load, and again on every sign
       in or out, so this is the only place session state is tracked. */
    this.client.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user ?? null);
      this.ready.set(true);
    });

    // onAuthStateChange can be slow to fire the first time on a cold load.
    this.client.auth.getSession().then(({ data }) => {
      this.user.set(data.session?.user ?? null);
      this.ready.set(true);
    });
  }

  /** Throws rather than returning null — callers are past the config check. */
  get db(): SupabaseClient {
    if (!this.client) throw new Error('Supabase is not configured');
    return this.client;
  }

  get userId(): string {
    const id = this.user()?.id;
    if (!id) throw new Error('Not signed in');
    return id;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  async signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
    const { data, error } = await this.db.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    // With email confirmation on, there's no session until the link is used.
    return { needsConfirmation: !data.session };
  }

  async signOut(): Promise<void> {
    await this.db.auth.signOut();
  }
}
