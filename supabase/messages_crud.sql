-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- Adds edit/delete support to direct_messages.

-- Edit + soft-delete columns.
alter table direct_messages add column if not exists edited_at timestamptz;
alter table direct_messages add column if not exists deleted_at timestamptz;

-- Only the sender can edit or delete their own message.
drop policy if exists "Senders can update own messages" on direct_messages;
create policy "Senders can update own messages"
  on direct_messages for update
  using ((select auth.uid()) = sender_id)
  with check ((select auth.uid()) = sender_id);

-- Realtime — so edits/deletes sync live to both people in the chat. Guarded
-- (rather than a plain ALTER PUBLICATION that errors "already a member" on a
-- second run) since this file executes as one implicit transaction — that
-- error was silently rolling back the DROP/CREATE POLICY statement above it too.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table direct_messages;
  end if;
end $$;
