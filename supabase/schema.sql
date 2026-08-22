-- Run this in Supabase Studio → SQL Editor AFTER you receive the project keys.
-- It gives every auth user a matching row in `profiles`, keyed by user_id,
-- which is what the Section 1 agent dashboard should link against.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any signed-in user can look up any profile (direct_messages/MessagingPage.jsx
-- depend on this — you need to be able to find someone before you can message
-- them), but can only ever change their own row. This — not a "read only your
-- own row" policy — is the actual intended trust model; an earlier version of
-- this file's comment claimed the opposite, which no longer matched what a
-- "Profiles are viewable by any authenticated user" policy (added directly in
-- the Supabase dashboard, outside this file) already did live. Consolidated
-- back into this file so there's one source of truth again instead of two
-- policies doing the same job under different names.
-- (drop-if-exists first so this whole file is safe to re-run end to end —
-- otherwise a re-run would fail here on "policy already exists" and never
-- reach the newer pitch_posts/conversations/messages sections below.)
-- auth.uid() is wrapped as (select auth.uid()) throughout this file per
-- Supabase's own advisory — without it, Postgres re-evaluates auth.uid() per
-- row instead of once per query, which shows up as an "Auth RLS
-- Initialization Plan" performance warning at any real row count.
drop policy if exists "Profiles are viewable by any authenticated user" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- Copy the signup metadata (full_name) into profiles automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Postgres grants EXECUTE on a new function to PUBLIC by default. This
-- function only ever needs to run via the trigger above — a trigger fires
-- under its function's SECURITY DEFINER privileges regardless of the
-- inserting role's own grants, so it doesn't need anyone to be able to call
-- it directly. Supabase's Security Advisor flags a directly-callable
-- SECURITY DEFINER function as risky, so revoke the default PUBLIC grant.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ============================================================
-- Pitch posts: a founder can post multiple ideas here and mark
-- exactly one "live" to feed the real matching pipeline.
--
-- NOTE: if `pitch_posts` already existed in your project from an earlier
-- version of this app (only founder_id/title/pitch_text/mvp_url/mvp_valid),
-- `create table if not exists` below is a no-op and won't add the new
-- columns — the `alter table add column if not exists` statements right
-- after it are what actually backfill an existing table. Safe to re-run.
-- ============================================================
create table if not exists public.pitch_posts (
  id             uuid primary key default gen_random_uuid(),
  founder_id     uuid not null references auth.users (id) on delete cascade,
  title          text not null,
  pitch_text     text not null,
  mvp_url        text,
  mvp_valid      boolean not null default false,
  repo_url       text,
  screenshot_url text,
  repo_verified  boolean not null default false,
  is_live        boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.pitch_posts add column if not exists mvp_url text;
alter table public.pitch_posts add column if not exists mvp_valid boolean not null default false;
alter table public.pitch_posts add column if not exists repo_url text;
alter table public.pitch_posts add column if not exists screenshot_url text;
alter table public.pitch_posts add column if not exists repo_verified boolean not null default false;
alter table public.pitch_posts add column if not exists is_live boolean not null default false;

-- Every RLS policy below filters on founder_id — without an index, that's a
-- sequential scan per query once this table has any real row count.
create index if not exists pitch_posts_founder_id_idx on public.pitch_posts (founder_id);

alter table public.pitch_posts enable row level security;

drop policy if exists "pitch_posts_select_own" on public.pitch_posts;
create policy "pitch_posts_select_own"
  on public.pitch_posts for select
  using ((select auth.uid()) = founder_id);

drop policy if exists "pitch_posts_insert_own" on public.pitch_posts;
create policy "pitch_posts_insert_own"
  on public.pitch_posts for insert
  with check ((select auth.uid()) = founder_id);

drop policy if exists "pitch_posts_update_own" on public.pitch_posts;
create policy "pitch_posts_update_own"
  on public.pitch_posts for update
  using ((select auth.uid()) = founder_id);

drop policy if exists "pitch_posts_delete_own" on public.pitch_posts;
create policy "pitch_posts_delete_own"
  on public.pitch_posts for delete
  using ((select auth.uid()) = founder_id);

-- mvp_url/repo_url/screenshot_url get rendered as a real <a href>/<img src>
-- for OTHER users (investors browsing shortlists) once the backend pulls
-- this row into a match payload — a founder could otherwise self-serve a
-- `javascript:`/`data:` URL straight past any client-side JS check (RLS
-- only enforces founder_id ownership, not URL scheme) and get it executed
-- in an investor's authenticated session the moment they click the link.
-- The frontend now also guards every render site with safeHref(), but this
-- constraint is the one layer a malicious client can't bypass by skipping
-- the app's own JS entirely and writing straight to Supabase.
alter table public.pitch_posts drop constraint if exists pitch_posts_mvp_url_scheme_chk;
alter table public.pitch_posts add constraint pitch_posts_mvp_url_scheme_chk
  check (mvp_url is null or mvp_url ~* '^https?://');

alter table public.pitch_posts drop constraint if exists pitch_posts_repo_url_scheme_chk;
alter table public.pitch_posts add constraint pitch_posts_repo_url_scheme_chk
  check (repo_url is null or repo_url ~* '^https?://');

alter table public.pitch_posts drop constraint if exists pitch_posts_screenshot_url_scheme_chk;
alter table public.pitch_posts add constraint pitch_posts_screenshot_url_scheme_chk
  check (screenshot_url is null or screenshot_url ~* '^https?://');

-- ============================================================
-- Durable founder/investor profiles — written once LinkedIn/GitHub are
-- connected at onboarding, read back on every login so the app never asks
-- again. This is the actual source of truth (via agents/db_store.py using
-- DATABASE_URL); the Python backend's in-memory state / sessions_db.json
-- is just a fast cache on top of it and does not survive a restart alone.
-- ============================================================
create table if not exists public.founder_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  linkedin_url text,
  github_url   text,
  profile      jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.founder_profiles enable row level security;

drop policy if exists "founder_profiles_select_own" on public.founder_profiles;
create policy "founder_profiles_select_own"
  on public.founder_profiles for select
  using ((select auth.uid()) = user_id);

create table if not exists public.investor_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  linkedin_url text,
  profile      jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.investor_profiles enable row level security;

drop policy if exists "investor_profiles_select_own" on public.investor_profiles;
create policy "investor_profiles_select_own"
  on public.investor_profiles for select
  using ((select auth.uid()) = user_id);

-- Note: no insert/update policies here on purpose — these two tables are
-- only ever written by the backend over the direct DATABASE_URL connection
-- (service-level access, bypasses RLS), never by the browser's anon-key
-- Supabase client. Select policies exist only in case you want to read them
-- from the frontend later.

-- Durable record of who a user has passed on (an investor's rejected idea
-- ids, or a founder's rejected investor ids) — previously lived only in
-- SessionState.rejected_ids, serialized to sessions_db.json on Render's
-- ephemeral disk and nowhere else, so a redeploy silently reset everyone's
-- rejection history and previously-declined matches would resurface.
create table if not exists public.user_rejections (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  rejected_ids jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.user_rejections enable row level security;

drop policy if exists "user_rejections_select_own" on public.user_rejections;
create policy "user_rejections_select_own"
  on public.user_rejections for select
  using ((select auth.uid()) = user_id);

-- Same reasoning as founder_profiles/investor_profiles above: only ever
-- written by the backend over the direct DATABASE_URL connection.

-- ============================================================
-- Write-through durability for the shared marketplace pools
-- (GLOBAL_IDEAS_POOL / GLOBAL_INVESTORS_POOL / GLOBAL_MEETING_REQUESTS in
-- main_app.py). Those in-memory pools are still the live, fast, process-wide
-- working set the app actually reads from on every request — this is a
-- durability layer underneath them, not a replacement: every mutation also
-- writes here (best-effort, via agents/db_store.py), and app startup
-- hydrates the in-memory pools from here so a crashed/restarted process
-- doesn't lose data that only ever made it into sessions_db.json's last
-- periodic snapshot.
--
-- ids stay text (app-generated "idea_01"/"inv_01" style, see
-- main_app.py's `f"idea_{len(pool)+1:02d}"`) — NOT uuid — since these ids
-- already flow through GLOBAL_MEETING_REQUESTS keys and frontend contracts.
--
-- Named investor_listings, not investors: this file already has a dead
-- legacy `public.investors` table (see the "dead leftover" block further
-- down) from an unrelated old prototype, with its own different columns.
-- Reusing that name would make `create table if not exists` silently skip
-- creating our table on any project where the legacy one still exists.
-- ============================================================
create table if not exists public.ideas (
  id                    text primary key,
  owner_user_id         uuid not null references auth.users (id) on delete cascade,
  title                 text not null,
  domain                text,
  problem               text,
  solution              text,
  target_market         text,
  features_must_have    jsonb not null default '[]'::jsonb,
  features_nice_to_have jsonb not null default '[]'::jsonb,
  roadmap               jsonb not null default '[]'::jsonb,
  founder               jsonb not null default '{}'::jsonb,
  base_scores           jsonb not null default '{}'::jsonb,
  updated_at            timestamptz not null default now()
);

create index if not exists ideas_owner_user_id_idx on public.ideas (owner_user_id);

alter table public.ideas enable row level security;

drop policy if exists "ideas_select_own" on public.ideas;
create policy "ideas_select_own"
  on public.ideas for select
  using ((select auth.uid()) = owner_user_id);

-- No insert/update/delete policies, same reasoning as founder_profiles/
-- investor_profiles above: only ever written via the backend's direct
-- DATABASE_URL connection.

create table if not exists public.investor_listings (
  id                text primary key,
  owner_user_id     uuid not null references auth.users (id) on delete cascade,
  name              text,
  designation       text,
  firm              text,
  experience        text,
  focus_sectors     jsonb not null default '[]'::jsonb,
  min_ticket        bigint,
  max_ticket        bigint,
  bio               text,
  custom_details    jsonb not null default '{}'::jsonb,
  location          jsonb not null default '{}'::jsonb,
  linkedin_verified jsonb,
  updated_at        timestamptz not null default now()
);

create index if not exists investor_listings_owner_user_id_idx on public.investor_listings (owner_user_id);

alter table public.investor_listings enable row level security;

drop policy if exists "investor_listings_select_own" on public.investor_listings;
create policy "investor_listings_select_own"
  on public.investor_listings for select
  using ((select auth.uid()) = owner_user_id);

-- Composite primary key (idea_id, investor_id) mirrors the app's own
-- f"{idea_id}::{investor_id}" GLOBAL_MEETING_REQUESTS key exactly — no
-- separate synthetic id needed. founder_user_id/investor_user_id are
-- denormalized (copied from idea.owner_user_id / investor.owner_user_id at
-- write time) purely so the select policy below doesn't need a join.
-- idea_snapshot/investor_snapshot faithfully mirror today's in-memory
-- embedded-snapshot shape (sometimes a live pool reference, sometimes an
-- AI-scored copy with extra fields) as opaque jsonb — intentionally NOT
-- normalized/redesigned here; that's a separate concern from durability.
create table if not exists public.meeting_requests (
  idea_id           text not null references public.ideas (id) on delete cascade,
  investor_id       text not null references public.investor_listings (id) on delete cascade,
  founder_user_id   uuid references auth.users (id) on delete cascade,
  investor_user_id  uuid references auth.users (id) on delete cascade,
  founder_requested boolean not null default false,
  investor_raised   boolean not null default false,
  both_opted_in     boolean not null default false,
  idea_snapshot     jsonb not null default '{}'::jsonb,
  investor_snapshot jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (idea_id, investor_id)
);

-- Marks a confirmed deal (both_opted_in=true) as finished, once the
-- founder/investor have actually completed the project together — frees
-- the pair up to be matched again instead of the confirmed slot permanently
-- blocking any new deal for either party (see _investor_has_other_confirmed_
-- deal / _idea_has_other_confirmed_deal in main_app.py, which check this).
alter table public.meeting_requests add column if not exists completed boolean not null default false;
alter table public.meeting_requests add column if not exists completed_at timestamptz;

create index if not exists meeting_requests_founder_user_id_idx on public.meeting_requests (founder_user_id);
create index if not exists meeting_requests_investor_user_id_idx on public.meeting_requests (investor_user_id);

alter table public.meeting_requests enable row level security;

drop policy if exists "meeting_requests_select_participant" on public.meeting_requests;
create policy "meeting_requests_select_participant"
  on public.meeting_requests for select
  using ((select auth.uid()) = founder_user_id or (select auth.uid()) = investor_user_id);

-- Lets the frontend subscribe to postgres_changes on this table (see
-- useMeetingRequestsRealtime.js) so a confirmed meeting / raised hand /
-- requested meeting shows up instantly instead of waiting for the next
-- poll tick — RLS above already scopes each subscriber to only their own
-- rows. Same idempotent pattern as the `messages` publication-add below.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'meeting_requests'
  ) then
    alter publication supabase_realtime add table public.meeting_requests;
  end if;
end $$;

-- ============================================================
-- Real-time chat: opens the instant both sides confirm a match.
-- One conversation per (founder, investor) pair.
-- ============================================================
create table if not exists public.conversations (
  id                uuid primary key default gen_random_uuid(),
  founder_user_id   uuid not null references auth.users (id) on delete cascade,
  investor_user_id  uuid not null references auth.users (id) on delete cascade,
  idea_ref          text,
  created_at        timestamptz not null default now(),
  unique (founder_user_id, investor_user_id)
);

-- The unique constraint above already covers founder_user_id as its leading
-- column, but investor_user_id has no index of its own — needed both for
-- queries filtering by investor and for an efficient cascade delete when an
-- investor's auth.users row is removed.
create index if not exists conversations_investor_user_id_idx on public.conversations (investor_user_id);

alter table public.conversations enable row level security;

drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
  on public.conversations for select
  using ((select auth.uid()) = founder_user_id or (select auth.uid()) = investor_user_id);

-- INTENTIONALLY no insert policy for the browser's anon-key client. The
-- previous "conversations_insert_participant" policy (auth.uid() = either
-- named party) only checked that you WERE one of the two people in the row
-- YOU were inserting — it never verified a real confirmed meeting existed
-- between them, since that state lives in the Python backend, not Postgres.
-- That meant any authenticated user could open a chat with literally anyone
-- by naming them as the counterpart. The backend now creates this row
-- itself over the service-role key (which bypasses RLS entirely, so no
-- policy is needed for it) the instant both sides opt in — see
-- _ensure_conversation in main_app.py. Re-running this file drops the old
-- policy if it's still present from an earlier version of this schema.
drop policy if exists "conversations_insert_participant" on public.conversations;

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_user_id   uuid not null references auth.users (id) on delete cascade,
  text             text not null,
  created_at       timestamptz not null default now()
);

-- Both foreign keys are unindexed by default — conversation_id is looked up
-- on every message fetch (RealtimeChatPanel), and both matter for an
-- efficient cascade delete.
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_sender_user_id_idx on public.messages (sender_user_id);

alter table public.messages enable row level security;

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and ((select auth.uid()) = c.founder_user_id or (select auth.uid()) = c.investor_user_id)
    )
  );

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant"
  on public.messages for insert
  with check (
    (select auth.uid()) = sender_user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and ((select auth.uid()) = c.founder_user_id or (select auth.uid()) = c.investor_user_id)
    )
  );

-- IMPORTANT — run this file in Supabase Studio's SQL editor, then also
-- double-check (this block is safe to re-run, but some managed Postgres
-- versions still reject a duplicate add — if so, just do it once via
-- Database -> Replication -> toggle `messages` on in the supabase_realtime
-- publication instead of running this statement):
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('pitch-screenshots', 'pitch-screenshots', true)
on conflict (id) do nothing;

-- INTENTIONALLY no select/list policy for this bucket. Screenshots are read
-- via uploadPitchScreenshot()'s getPublicUrl() (frontend/src/lib/
-- supabaseStorage.js), which hits Storage's dedicated public-object route —
-- that bypasses storage.objects RLS entirely since the bucket itself is
-- `public = true`, so no policy was ever needed for reads to work. The old
-- "pitch_screenshots_public_read" policy (using (bucket_id = ...), no other
-- restriction) didn't add read access nothing already had — it just also
-- allowed listing/enumerating every file in the bucket via the Storage API,
-- which Supabase's Security Advisor flags as "Public Bucket Allows Listing"
-- and which nothing in this app actually uses. Re-running this file drops it
-- if it's still present from an earlier version of this schema.
drop policy if exists "pitch_screenshots_public_read" on storage.objects;

-- Path must be {auth.uid()}/{filename} (see uploadPitchScreenshot() in
-- frontend/lib/supabaseStorage.js) — checking only "is authenticated" let any
-- signed-up user write to any path in this bucket, including one that looks
-- like it belongs to another user's folder. Same shape as the equivalent
-- message-attachments policy above.
drop policy if exists "pitch_screenshots_owner_write" on storage.objects;
create policy "pitch_screenshots_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'pitch-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- public.investors — dead leftover from an early RealtimeChat.jsx prototype
-- (before the real Agent-backed matching pipeline existed), never used by
-- any currently-reachable code, but still had RLS fully OFF: anyone with
-- the public anon key could read/write every row with zero auth check —
-- flagged CRITICAL by Supabase's own Security Advisor. Nothing legitimate
-- depends on it being reachable, so lock it down completely rather than
-- writing policies for a table nothing should be querying. `if exists`
-- guards make this a no-op on a project where the table was never created.
-- ============================================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'investors') then
    execute 'alter table public.investors enable row level security';
  end if;
end $$;

-- PostgREST (the API layer supabase-js talks to) caches the table schema and
-- does NOT always notice new columns right away — this is almost always why
-- "Could not find the 'x' column ... in the schema cache" persists even
-- after the ALTER TABLE above ran successfully. Force it to refresh now:
notify pgrst, 'reload schema';
