-- Migration: Create Complete Schema with Event Logging
-- Description: Creates the complete database schema with all tables, indexes, triggers, 
--              RLS policies, test user, and minimal test data with event logging
-- Affected Tables: source_texts, flashcards, event_logs, auth.users

-- enable necessary extensions
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists moddatetime with schema extensions;

-- Insert test user into auth.users
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@example.com',
    crypt('password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- create source_texts table
-- stores original text content provided by users for ai flashcard generation.
create table public.source_texts (
    id uuid primary key default extensions.uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    text_content text not null,
    created_at timestamptz not null default now()
);

-- add comments to source_texts table and columns
comment on table public.source_texts is 'stores original text content provided by users for ai flashcard generation.';
comment on column public.source_texts.id is 'unique identifier for the source text entry.';
comment on column public.source_texts.user_id is 'foreign key referencing the user who owns the source text.';
comment on column public.source_texts.text_content is 'the actual text content provided by the user.';
comment on column public.source_texts.created_at is 'timestamp when the source text entry was created.';

-- create indexes for source_texts table
create index idx_source_texts_user_id on public.source_texts(user_id);

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

-- create trigger for automatically updating updated_at on flashcards modification
create trigger handle_updated_at
before update on public.flashcards
for each row
execute function extensions.moddatetime (updated_at);

-- create event_logs table
-- logs key system events for metrics and auditing.
create table public.event_logs (
    id uuid primary key default extensions.uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    event_type text not null check (event_type in (
        'ai_card_created', 'ai_edited_card_created', 'manual_card_created',
        'ai_card_rejected', 'ai_edited_card_rejected', 'manual_card_rejected',
        'ai_card_reviewed', 'card_edited', 'card_deleted',
        'source_text_created', 'source_text_updated', 'source_text_deleted'
    )),
    "timestamp" timestamptz not null default now(),
    payload jsonb null
);

-- add comments to event_logs table and columns
comment on table public.event_logs is 'logs key system events for metrics and auditing.';
comment on column public.event_logs.id is 'unique identifier for the event log entry.';
comment on column public.event_logs.user_id is 'foreign key referencing the user associated with the event.';
comment on column public.event_logs.event_type is 'the type of event being logged.';
comment on column public.event_logs."timestamp" is 'timestamp when the event occurred.';
comment on column public.event_logs.payload is 'additional data related to the event.';

-- create indexes for event_logs table
create index idx_event_logs_user_id on public.event_logs(user_id);
create index idx_event_logs_event_type on public.event_logs(event_type);
create index idx_event_logs_timestamp on public.event_logs("timestamp");

-- Enable row level security for all tables
alter table public.source_texts enable row level security;
alter table public.flashcards enable row level security;
alter table public.event_logs enable row level security;

-- Create RLS policies for source_texts
-- authenticated users can insert their own source texts
create policy "allow authenticated insert for own source_texts"
on public.source_texts
for insert
to authenticated
with check (auth.uid() = user_id);

-- authenticated users can select their own source texts
create policy "allow authenticated select for own source_texts"
on public.source_texts
for select
to authenticated
using (auth.uid() = user_id);

-- authenticated users can update their own source texts
create policy "allow authenticated update for own source_texts"
on public.source_texts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- authenticated users can delete their own source texts
create policy "allow authenticated delete for own source_texts"
on public.source_texts
for delete
to authenticated
using (auth.uid() = user_id);

-- anon users cannot interact with source_texts
create policy "disallow anon access for source_texts"
on public.source_texts
to anon
using (false);

-- Create RLS policies for flashcards
-- authenticated users can select their own flashcards
create policy "allow authenticated select for own flashcards"
on public.flashcards
for select
to authenticated
using (auth.uid() = user_id);

-- authenticated users can insert flashcards with their own user_id
create policy "allow authenticated insert for own flashcards"
on public.flashcards
for insert
to authenticated
with check (auth.uid() = user_id);

-- authenticated users can update their own flashcards
create policy "allow authenticated update for own flashcards"
on public.flashcards
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- authenticated users can delete their own flashcards
create policy "allow authenticated delete for own flashcards"
on public.flashcards
for delete
to authenticated
using (auth.uid() = user_id);

-- anon users cannot interact with flashcards
create policy "disallow anon access for flashcards"
on public.flashcards
to anon
using (false);

-- Create RLS policies for event_logs
-- authenticated users can select their own event logs
create policy "allow authenticated select for own event logs"
on public.event_logs
for select
to authenticated
using (auth.uid() = user_id);

-- authenticated users can insert event logs with their own user_id
create policy "allow authenticated insert for own event logs"
on public.event_logs
for insert
to authenticated
with check (auth.uid() = user_id);

-- disallow updates on event logs for authenticated users
create policy "disallow authenticated update for event logs"
on public.event_logs
for update
to authenticated
using (false); -- log entries should be immutable

-- disallow deletes on event logs for authenticated users
create policy "disallow authenticated delete for event logs"
on public.event_logs
for delete
to authenticated
using (false); -- log entries should generally not be deleted by users

-- anon users cannot interact with event_logs
create policy "disallow anon access for event logs"
on public.event_logs
to anon
using (false);

-- Add minimal test data
INSERT INTO public.source_texts (
    id,
    user_id,
    text_content,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'React to biblioteka JavaScript do budowania interfejsów użytkownika. Została stworzona przez Facebook i jest używana do tworzenia aplikacji jednostronicowych.',
    now()
);

INSERT INTO public.flashcards (
    id,
    user_id,
    source_text_id,
    front,
    back,
    source,
    created_at,
    updated_at
) VALUES 
(
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Co to jest React?',
    'React to biblioteka JavaScript do budowania interfejsów użytkownika.',
    'manual',
    now(),
    now()
),
(
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Kto stworzył React?',
    'React został stworzony przez Facebook.',
    'ai',
    now(),
    now()
);

-- Add corresponding event logs
INSERT INTO public.event_logs (
    id,
    user_id,
    event_type,
    "timestamp",
    payload
) VALUES 
-- Event for source text creation
(
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000001',
    'source_text_created',
    now(),
    '{"source_text_id": "11111111-1111-1111-1111-111111111111", "text_length": 120}'
),
-- Event for manual flashcard creation
(
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000001',
    'manual_card_created',
    now(),
    '{"flashcard_id": "22222222-2222-2222-2222-222222222222", "source_text_id": "11111111-1111-1111-1111-111111111111"}'
),
-- Event for AI flashcard creation
(
    '66666666-6666-6666-6666-666666666666',
    '00000000-0000-0000-0000-000000000001',
    'ai_card_created',
    now(),
    '{"source_text_id": "11111111-1111-1111-1111-111111111111", "generated_count": 1, "flashcard_ids": ["33333333-3333-3333-3333-333333333333"]}'
); 