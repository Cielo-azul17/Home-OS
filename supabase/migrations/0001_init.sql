-- HomeOS V1 schema.
--
-- Shape follows src/app/HomeOS/core/models.ts as closely as SQL allows, so
-- the client keeps working with the same objects it has today. Differences
-- that matter:
--   * ids are issued here, not by the client's uid() helper
--   * every row belongs to a home, and a home belongs to auth.users
--   * files live in Storage; rows keep a URL, not a base64 data URL
--
-- Column names are snake_case; the client maps them at the HomeApi seam.

create extension if not exists "pgcrypto";

-- ---------- Homes ----------

create table public.homes (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null default 'My home',
  created_at  timestamptz not null default now()
);

-- One home per account in V1; the table is here so V2 can share one.
create unique index homes_owner_idx on public.homes (owner_id);

-- ---------- Rooms ----------

create table public.rooms (
  id          uuid primary key default gen_random_uuid(),
  home_id     uuid not null references public.homes (id) on delete cascade,
  name        text not null,
  image       text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index rooms_home_idx on public.rooms (home_id);

-- ---------- Assets ----------

create type public.asset_category as enum
  ('Electronics', 'Appliances', 'Climate', 'Kitchen', 'Furniture', 'Other');

create table public.assets (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references public.homes (id) on delete cascade,
  -- A deleted room must not take its contents with it: the assets survive,
  -- unassigned, so the user can re-file them.
  room_id         uuid references public.rooms (id) on delete set null,
  name            text not null check (length(trim(name)) > 0),
  brand           text,
  category        public.asset_category not null default 'Other',
  image           text,
  purchase_date   date,
  purchase_price  numeric(12, 2) check (purchase_price is null or purchase_price >= 0),
  warranty_expiry date,
  serial_number   text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index assets_home_idx on public.assets (home_id);
create index assets_room_idx on public.assets (room_id);
create index assets_warranty_idx on public.assets (home_id, warranty_expiry)
  where warranty_expiry is not null;

-- ---------- Service history ----------

create table public.service_records (
  id         uuid primary key default gen_random_uuid(),
  asset_id   uuid not null references public.assets (id) on delete cascade,
  kind       text not null check (kind in ('service', 'repair')),
  title      text not null,
  date       date not null,
  cost       numeric(12, 2),
  provider   text,
  created_at timestamptz not null default now()
);

create index service_records_asset_idx on public.service_records (asset_id);

-- ---------- Reminders ----------

create table public.reminders (
  id         uuid primary key default gen_random_uuid(),
  home_id    uuid not null references public.homes (id) on delete cascade,
  -- Deleting a thing shouldn't silently delete the plan to service it, but
  -- it must not leave a dangling id either.
  asset_id   uuid references public.assets (id) on delete set null,
  title      text not null check (length(trim(title)) > 0),
  due_date   date not null,
  repeat     text not null default 'none'
               check (repeat in ('none', 'monthly', 'quarterly', 'yearly')),
  completed  boolean not null default false,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reminders_home_idx on public.reminders (home_id);
create index reminders_due_idx on public.reminders (home_id, due_date) where not completed;

-- ---------- Expenses ----------

create type public.expense_category as enum
  ('Utilities', 'Maintenance', 'Repairs', 'Purchases', 'Services', 'Other');

create table public.expenses (
  id         uuid primary key default gen_random_uuid(),
  home_id    uuid not null references public.homes (id) on delete cascade,
  asset_id   uuid references public.assets (id) on delete set null,
  title      text not null check (length(trim(title)) > 0),
  amount     numeric(12, 2) not null check (amount >= 0),
  date       date not null,
  category   public.expense_category not null default 'Other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_home_idx on public.expenses (home_id);
-- The Finances page reads one month at a time, newest first.
create index expenses_date_idx on public.expenses (home_id, date desc);

-- ---------- Documents ----------

create type public.document_kind as enum
  ('Warranty', 'Invoice', 'Manual', 'Insurance', 'Other');

create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  home_id     uuid not null references public.homes (id) on delete cascade,
  asset_id    uuid references public.assets (id) on delete set null,
  title       text not null check (length(trim(title)) > 0),
  kind        public.document_kind not null default 'Other',
  file_name   text not null,
  size_label  text not null default '',
  -- Path inside the 'documents' storage bucket. The client turns it into a
  -- signed URL on demand; the bucket itself stays private.
  storage_path text,
  mime_type   text,
  added_date  date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index documents_home_idx on public.documents (home_id);
create index documents_asset_idx on public.documents (asset_id);

-- ---------- Activity ----------

create table public.activity (
  id         uuid primary key default gen_random_uuid(),
  home_id    uuid not null references public.homes (id) on delete cascade,
  icon       text not null default 'box',
  title      text not null,
  context    text not null default '',
  at         timestamptz not null default now()
);

create index activity_home_idx on public.activity (home_id, at desc);

-- ---------- updated_at ----------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger assets_touch    before update on public.assets
  for each row execute function public.touch_updated_at();
create trigger reminders_touch before update on public.reminders
  for each row execute function public.touch_updated_at();
create trigger expenses_touch  before update on public.expenses
  for each row execute function public.touch_updated_at();
create trigger documents_touch before update on public.documents
  for each row execute function public.touch_updated_at();

-- ---------- A home for every new account ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_home uuid;
begin
  insert into public.homes (owner_id) values (new.id) returning id into new_home;

  -- Somewhere to put things from the first minute. The user renames these
  -- rather than facing an empty app with no rooms.
  insert into public.rooms (home_id, name, sort_order) values
    (new_home, 'Living room', 1),
    (new_home, 'Kitchen', 2),
    (new_home, 'Bedroom', 3);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row level security ----------
--
-- Every policy routes through this one function, so "can I see it?" has a
-- single definition. security definer, so the lookup itself isn't subject
-- to the policy it is being used to evaluate.

create or replace function public.owns_home(target uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.homes
    where homes.id = target and homes.owner_id = auth.uid()
  );
$$;

alter table public.homes           enable row level security;
alter table public.rooms           enable row level security;
alter table public.assets          enable row level security;
alter table public.service_records enable row level security;
alter table public.reminders       enable row level security;
alter table public.expenses        enable row level security;
alter table public.documents       enable row level security;
alter table public.activity        enable row level security;

create policy "own home" on public.homes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own rooms" on public.rooms
  for all using (public.owns_home(home_id)) with check (public.owns_home(home_id));

create policy "own assets" on public.assets
  for all using (public.owns_home(home_id)) with check (public.owns_home(home_id));

create policy "own reminders" on public.reminders
  for all using (public.owns_home(home_id)) with check (public.owns_home(home_id));

create policy "own expenses" on public.expenses
  for all using (public.owns_home(home_id)) with check (public.owns_home(home_id));

create policy "own documents" on public.documents
  for all using (public.owns_home(home_id)) with check (public.owns_home(home_id));

create policy "own activity" on public.activity
  for all using (public.owns_home(home_id)) with check (public.owns_home(home_id));

-- Service records hang off an asset, so they inherit that asset's home.
create policy "own service records" on public.service_records
  for all using (
    exists (
      select 1 from public.assets
      where assets.id = service_records.asset_id and public.owns_home(assets.home_id)
    )
  )
  with check (
    exists (
      select 1 from public.assets
      where assets.id = service_records.asset_id and public.owns_home(assets.home_id)
    )
  );

-- ---------- Storage ----------
--
-- Private bucket. Files are namespaced by the owner's user id, which is what
-- the policies below check, so one account can never read another's invoice.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  20971520, -- 20 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do nothing;

create policy "own files read" on storage.objects
  for select using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own files write" on storage.objects
  for insert with check (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own files update" on storage.objects
  for update using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own files delete" on storage.objects
  for delete using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
