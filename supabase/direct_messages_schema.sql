-- Run this in Supabase Studio -> SQL Editor BEFORE supabase_messages_crud.sql.
-- Base schema for the direct-messaging inbox (contacts + 1:1 chat), which
-- app/messaging/page.jsx (ported to frontend/src/pages/MessagingPage.jsx)
-- was already written against, but whose base table was never committed —
-- only the later "add edit/delete columns" migration (supabase_messages_crud.sql)
-- made it into this repo.

create table if not exists public.direct_messages (
  id              uuid primary key default gen_random_uuid(),
  sender_id       uuid not null references auth.users (id) on delete cascade,
  recipient_id    uuid not null references auth.users (id) on delete cascade,
  text            text not null default '',
  attachment_url  text,
  attachment_name text,
  created_at      timestamptz not null default now()
);

create index if not exists direct_messages_sender_idx on public.direct_messages (sender_id);
create index if not exists direct_messages_recipient_idx on public.direct_messages (recipient_id);

alter table public.direct_messages enable row level security;

-- Either side of a conversation can read it; only the sender can create their
-- own message. (Edit/update policy is added separately in supabase_messages_crud.sql.)
-- auth.uid() wrapped as (select auth.uid()) per Supabase's own "Auth RLS
-- Initialization Plan" advisory — without it, Postgres re-evaluates
-- auth.uid() per row instead of once per query. Also drops two older,
-- differently-named policies ("Users can view their own conversations" /
-- "Users can send messages as themselves") that were doing this exact same
-- job with unwrapped auth.uid() — added directly in the Supabase dashboard
-- at some point, outside this file, so re-running this file never touched
-- them and the performance warning kept firing even after this fix landed.
drop policy if exists "Users can view their own conversations" on public.direct_messages;
drop policy if exists "direct_messages_select_participant" on public.direct_messages;
create policy "direct_messages_select_participant"
  on public.direct_messages for select
  using ((select auth.uid()) = sender_id or (select auth.uid()) = recipient_id);

drop policy if exists "Users can send messages as themselves" on public.direct_messages;
drop policy if exists "direct_messages_insert_own" on public.direct_messages;
create policy "direct_messages_insert_own"
  on public.direct_messages for insert
  with check ((select auth.uid()) = sender_id);

-- Guarded the same way schema.sql guards the `messages` table's publication
-- add: a plain `alter publication ... add table` errors "already a member"
-- on a second run, and since this file executes as one implicit transaction,
-- that error was silently rolling back every DROP/CREATE POLICY statement
-- above it too, not just itself.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end $$;

-- Private bucket for chat attachments — read via short-lived signed URLs
-- (see MessagingPage.jsx), never a public URL.
insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', false)
on conflict (id) do nothing;

-- Uploads must live under the uploader's own uid folder ("<uid>/<file>").
drop policy if exists "message_attachments_insert_own_folder" on storage.objects;
create policy "message_attachments_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'message-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Any authenticated user may read attachments (matches this app's existing
-- trust model: `profiles` is already readable across all accounts so anyone
-- can be found and messaged). Signed URLs still expire after an hour.
drop policy if exists "message_attachments_select_authenticated" on storage.objects;
create policy "message_attachments_select_authenticated"
  on storage.objects for select
  using (bucket_id = 'message-attachments' and auth.role() = 'authenticated');
