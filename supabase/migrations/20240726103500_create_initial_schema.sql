-- Migration: Create Initial Schema
-- Description: Creates the initial tables (source_texts, flashcards, event_logs),
--              indexes, triggers, and row-level security policies as defined in db-plan.md.
-- Affected Tables: source_texts, flashcards, event_logs
-- Considerations: Assumes the Supabase project has the necessary extensions enabled
--                 or allows enabling them via migrations.

-- enable necessary extensions
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists moddatetime with schema extensions;

-- create source_texts table
-- stores original text content provided by users for ai flashcard generation.
create table public.source_texts (
    id uuid primary key default extensions.uuid_generate_v4(),
    text_content text not null,
    created_at timestamptz not null default now()
);

-- add comments to source_texts table and columns
comment on table public.source_texts is 'stores original text content provided by users for ai flashcard generation.';
comment on column public.source_texts.id is 'unique identifier for the source text entry.';
comment on column public.source_texts.text_content is 'the actual text content provided by the user.';
comment on column public.source_texts.created_at is 'timestamp when the source text entry was created.';

-- enable row level security for source_texts
alter table public.source_texts enable row level security;

-- create rls policies for source_texts
-- authenticated users can insert their own source texts (though typically done via flashcard creation)
create policy "allow authenticated insert for source_texts"
on public.source_texts
for insert
to authenticated
with check (true); -- Simplistic check for MVP, relying on flashcard RLS for select/update/delete control.

-- authenticated users can select source texts (primarily accessed via flashcards join)
create policy "allow authenticated select for source_texts"
on public.source_texts
for select
to authenticated
using (true); -- Simplistic check for MVP, relying on flashcard RLS for select/update/delete control.

-- anon users cannot interact with source_texts
create policy "disallow anon access for source_texts"
on public.source_texts
to anon
using (false);


-- create flashcards table
-- stores user-created and ai-generated flashcards.
create table public.flashcards (
    id uuid primary key default extensions.uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    source_text_id uuid null references public.source_texts(id) on delete set null,
    front varchar(250) not null,
    back varchar(750) not null,
    source text not null check (source in ('ai', 'manual', 'ai-edited')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    next_review_at timestamptz null, -- deferred: timestamp for the next scheduled review (for srs).
    interval integer null,            -- deferred: the current interval in days between reviews (for srs).
    ease_factor numeric null          -- deferred: the ease factor associated with the card (for srs).
);

-- add comments to flashcards table and columns
comment on table public.flashcards is 'stores user-created and ai-generated flashcards.';
comment on column public.flashcards.id is 'unique identifier for the flashcard.';
comment on column public.flashcards.user_id is 'foreign key referencing the user who owns the flashcard.';
comment on column public.flashcards.source_text_id is 'foreign key referencing the source text used for ai generation (null for manual cards).';
comment on column public.flashcards.front is 'the front content (question/term) of the flashcard.';
comment on column public.flashcards.back is 'the back content (answer/definition) of the flashcard.';
comment on column public.flashcards.source is 'indicates the origin of the flashcard (''ai'', ''manual'', ''ai-edited'').';
comment on column public.flashcards.created_at is 'timestamp when the flashcard was created.';
comment on column public.flashcards.updated_at is 'timestamp when the flashcard was last updated (trigger handles automatic updates).';
comment on column public.flashcards.next_review_at is 'deferred: timestamp for the next scheduled review (for srs). to be added later.';
comment on column public.flashcards.interval is 'deferred: the current interval in days between reviews (for srs). to be added later.';
comment on column public.flashcards.ease_factor is 'deferred: the ease factor associated with the card (for srs). to be added later.';

-- create indexes for flashcards table
create index idx_flashcards_user_id on public.flashcards(user_id);
create index idx_flashcards_source_text_id on public.flashcards(source_text_id);
-- future index: create index idx_flashcards_next_review_at on public.flashcards(next_review_at);

-- create trigger for automatically updating updated_at on flashcards modification
create trigger handle_updated_at
before update on public.flashcards
for each row
execute function extensions.moddatetime (updated_at);

-- enable row level security for flashcards
alter table public.flashcards enable row level security;

-- create rls policies for flashcards
-- policy: allow authenticated users to select their own flashcards
create policy "allow authenticated select for own flashcards"
on public.flashcards
for select
to authenticated
using (auth.uid() = user_id);

-- policy: allow authenticated users to insert flashcards with their own user_id
create policy "allow authenticated insert for own flashcards"
on public.flashcards
for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: allow authenticated users to update their own flashcards
create policy "allow authenticated update for own flashcards"
on public.flashcards
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: allow authenticated users to delete their own flashcards
create policy "allow authenticated delete for own flashcards"
on public.flashcards
for delete
to authenticated
using (auth.uid() = user_id);

-- policy: disallow anon users access to flashcards
create policy "disallow anon access for flashcards"
on public.flashcards
to anon
using (false);


-- create event_logs table
-- logs key system events for metrics and auditing.
create table public.event_logs (
    id uuid primary key default extensions.uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    event_type text not null check (event_type in (
        'ai_card_created', 'ai_edited_card_created', 'manual_card_created',
        'ai_card_rejected', 'ai_edited_card_rejected', 'manual_card_rejected', -- Note: rejection might be complex to track if cards are just deleted/not saved. Revisit event types.
        'ai_card_reviewed', 'card_edited', 'card_deleted'
    )),
    "timestamp" timestamptz not null default now(), -- using quoted "timestamp" to avoid conflict with sql keyword
    payload jsonb null
);

-- add comments to event_logs table and columns
comment on table public.event_logs is 'logs key system events for metrics and auditing.';
comment on column public.event_logs.id is 'unique identifier for the event log entry.';
comment on column public.event_logs.user_id is 'foreign key referencing the user associated with the event.';
comment on column public.event_logs.event_type is 'the type of event being logged.';
comment on column public.event_logs."timestamp" is 'timestamp when the event occurred.';
comment on column public.event_logs.payload is 'additional data related to the event (e.g., decision for ai_card_reviewed). structure tbd.';

-- create indexes for event_logs table
create index idx_event_logs_user_id on public.event_logs(user_id);
create index idx_event_logs_event_type on public.event_logs(event_type);
create index idx_event_logs_timestamp on public.event_logs("timestamp");

-- enable row level security for event_logs
alter table public.event_logs enable row level security;

-- create rls policies for event_logs
-- policy: allow authenticated users to select their own event logs
create policy "allow authenticated select for own event logs"
on public.event_logs
for select
to authenticated
using (auth.uid() = user_id);

-- policy: allow authenticated users to insert event logs with their own user_id
-- note: inserts might ideally be restricted to service_role key if events are logged server-side.
-- this policy allows client-side logging if needed.
create policy "allow authenticated insert for own event logs"
on public.event_logs
for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: disallow updates on event logs for authenticated users
create policy "disallow authenticated update for event logs"
on public.event_logs
for update
to authenticated
using (false); -- log entries should be immutable

-- policy: disallow deletes on event logs for authenticated users
create policy "disallow authenticated delete for event logs"
on public.event_logs
for delete
to authenticated
using (false); -- log entries should generally not be deleted by users

-- policy: disallow anon users access to event_logs
create policy "disallow anon access for event logs"
on public.event_logs
to anon
using (false); 