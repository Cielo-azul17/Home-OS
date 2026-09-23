import { TestBed } from '@angular/core/testing';
import { HomeApi } from './home-api';
import { Supabase } from './backend/supabase-client';
import { SupabaseBackend } from './backend/supabase-backend';
import { Asset } from './models';

/* HomeApi decides whether the app talks to Postgres or to the seeded mock.
   Getting that wrong either loses the user's data or hits the network in a
   demo, so the switch is worth pinning down. */

function asset(): Asset {
  return { id: 'draft', name: 'Fridge', category: 'Appliances', roomId: 'k', history: [] };
}

class FakeSupabase {
  configured = false;
  private current: unknown = null;
  user = () => this.current;
  signedIn(value: unknown) {
    this.current = value;
  }
}

class FakeBackend {
  calls: string[] = [];
  async loadSnapshot() {
    this.calls.push('loadSnapshot');
    return { rooms: [], assets: [], reminders: [], expenses: [], documents: [], activity: [] };
  }
  async createAsset(a: Asset) {
    this.calls.push('createAsset');
    return { ...a, id: 'db-uuid' };
  }
  async logActivity(entry: any) {
    this.calls.push('logActivity');
    throw new Error('activity table unreachable');
  }
}

function setup() {
  const supabase = new FakeSupabase();
  const backend = new FakeBackend();

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: Supabase, useValue: supabase },
      { provide: SupabaseBackend, useValue: backend },
    ],
  });

  return { api: TestBed.inject(HomeApi), supabase, backend };
}

describe('HomeApi backend switch', () => {
  it('is not live without a project', () => {
    const { api } = setup();
    expect(api.live).toBe(false);
  });

  it('is not live when configured but signed out', () => {
    const { api, supabase } = setup();
    supabase.configured = true;

    // A configured project with no session must not try to query.
    expect(api.live).toBe(false);
  });

  it('is live once configured and signed in', () => {
    const { api, supabase } = setup();
    supabase.configured = true;
    supabase.signedIn({ id: 'u1' });

    expect(api.live).toBe(true);
  });

  it('serves seeded data when not live', async () => {
    const { api, backend } = setup();

    const snapshot = await api.loadSnapshot();

    expect(backend.calls).toEqual([]);
    expect(snapshot.assets.length).toBeGreaterThan(0);
    expect(snapshot.rooms.length).toBeGreaterThan(0);
  });

  it('hands the mock caller back what it sent', async () => {
    const { api } = setup();
    const created = await api.createAsset(asset());

    expect(created.id).toBe('draft');
  });

  it('routes to the backend once live, and returns the server row', async () => {
    const { api, supabase, backend } = setup();
    supabase.configured = true;
    supabase.signedIn({ id: 'u1' });

    const created = await api.createAsset(asset());

    expect(backend.calls).toContain('createAsset');
    expect(created.id).toBe('db-uuid');
  });

  it('returns a fresh copy of the seed data each time', async () => {
    const { api } = setup();

    const first = await api.loadSnapshot();
    first.assets[0].name = 'Mutated';
    const second = await api.loadSnapshot();

    // Without the clone, one session's edits would leak into the next.
    expect(second.assets[0].name).not.toBe('Mutated');
  });

  /* Activity is a side effect of a real action. If the log write fails, the
     thing the user actually did must still count as done. */
  it('swallows a failed activity write', async () => {
    const { api, supabase, backend } = setup();
    supabase.configured = true;
    supabase.signedIn({ id: 'u1' });

    const entry = { id: 'ac1', icon: 'box' as const, title: 'Added', context: '', at: '2026-09-20' };
    await expect(api.logActivity(entry)).resolves.toEqual(entry);
    expect(backend.calls).toContain('logActivity');
  });
});
