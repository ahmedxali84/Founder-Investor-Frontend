-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query),
-- after supabase_direct_messages_schema.sql and supabase_messages_crud.sql.
-- Adds "Seen" read receipts to direct_messages.

alter table direct_messages add column if not exists read_at timestamptz;

-- Recipients mark a sender's messages as read through this function rather
-- than a raw UPDATE policy — it only ever touches the read_at column of rows
-- addressed to the caller, never a sender's text/attachment fields, without
-- needing column-level grants or a trigger to enforce that.
create or replace function public.mark_messages_read(p_sender_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update direct_messages
  set read_at = now()
  where sender_id = p_sender_id
    and recipient_id = auth.uid()
    and read_at is null;
end;
$$;

grant execute on function public.mark_messages_read(uuid) to authenticated;

-- direct_messages is already in the supabase_realtime publication (added by
-- supabase_direct_messages_schema.sql), so UPDATE events carrying the new
-- read_at value already reach both sides live — no publication change needed.
