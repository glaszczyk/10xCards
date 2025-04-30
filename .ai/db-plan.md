# PostgreSQL Database Schema for 10xCards

## 1. Tables

### `auth.users` (Managed by Supabase Auth)

This table is automatically managed by the Supabase Authentication service. It stores user information (like email, password hash, etc.) and provides the primary key (`id` of type `UUID`) referenced by other tables in this schema to associate data with specific users.

| Column Name          | Data Type      | Constraints                 | Description                                    |
| -------------------- | -------------- | --------------------------- | ---------------------------------------------- |
| `id`                 | `UUID`         | `PRIMARY KEY`               | Unique identifier for the user.                |
| `email`              | `VARCHAR(255)` | `NOT NULL`                  | User's email address.                          |
| `encrypted_password` | `TEXT`         | `NOT NULL`                  | Hashed password for user authentication.       |
| `created_at`         | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()` | Timestamp when the user account was created.   |
| `confirmed_at`       | `TIMESTAMPTZ`  | `NULL`                      | Timestamp when the user confirmed their email. |
| ...                  | ...            | ...                         | Other columns managed by Supabase.             |

### `flashcards`

Stores the user-created and AI-generated flashcards.

| Column Name      | Data Type      | Constraints                                                   | Description                                                                               |
| ---------------- | -------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `id`             | `UUID`         | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()`                   | Unique identifier for the flashcard.                                                      |
| `user_id`        | `UUID`         | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`     | Foreign key referencing the user who owns the flashcard.                                  |
| `source_text_id` | `UUID`         | `NULL`, `REFERENCES source_texts(id) ON DELETE SET NULL`      | Foreign key referencing the source text used for AI generation (NULL for manual cards).   |
| `front`          | `VARCHAR(250)` | `NOT NULL`                                                    | The front content (question/term) of the flashcard.                                       |
| `back`           | `VARCHAR(750)` | `NOT NULL`                                                    | The back content (answer/definition) of the flashcard.                                    |
| `source`         | `TEXT`         | `NOT NULL`, `CHECK (source IN ('AI', 'manual', 'AI-edited'))` | Indicates the origin of the flashcard ('AI', 'manual', 'AI-edited').                      |
| `created_at`     | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()`                                   | Timestamp when the flashcard was created.                                                 |
| `updated_at`     | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()`                                   | Timestamp when the flashcard was last updated (requires a trigger for automatic updates). |
| `next_review_at` | `TIMESTAMPTZ`  | `NULL`                                                        | _Deferred:_ Timestamp for the next scheduled review (for SRS). To be added later.         |
| `interval`       | `INTEGER`      | `NULL`                                                        | _Deferred:_ The current interval in days between reviews (for SRS). To be added later.    |
| `ease_factor`    | `NUMERIC`      | `NULL`                                                        | _Deferred:_ The ease factor associated with the card (for SRS). To be added later.        |

_Note:_ A trigger function (`moddatetime` or similar) needs to be created and applied to the `flashcards` table to automatically update the `updated_at` column on modifications.

### `source_texts`

Stores the original text content provided by users for AI flashcard generation.

| Column Name    | Data Type     | Constraints                                 | Description                                       |
| -------------- | ------------- | ------------------------------------------- | ------------------------------------------------- |
| `id`           | `UUID`        | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique identifier for the source text entry.      |
| `text_content` | `TEXT`        | `NOT NULL`                                  | The actual text content provided by the user.     |
| `created_at`   | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()`                 | Timestamp when the source text entry was created. |

### `event_logs`

Logs key system events for metrics and auditing.

| Column Name  | Data Type     | Constraints                                                                                                                                                                                                                             | Description                                                                                    |
| ------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`         | `UUID`        | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()`                                                                                                                                                                                             | Unique identifier for the event log entry.                                                     |
| `user_id`    | `UUID`        | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                                                                                                                                                                               | Foreign key referencing the user associated with the event.                                    |
| `event_type` | `TEXT`        | `NOT NULL`, `CHECK (event_type IN ('ai_card_created', 'ai_edited_card_created', 'manual_card_created', 'ai_card_card_rejected', 'ai_edited_card_rejected', 'manual_card_rejected', 'ai_card_reviewed', 'card_edited', 'card_deleted'))` | The type of event being logged.                                                                |
| `timestamp`  | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()`                                                                                                                                                                                                             | Timestamp when the event occurred.                                                             |
| `payload`    | `JSONB`       | `NULL`                                                                                                                                                                                                                                  | Additional data related to the event (e.g., `decision` for `ai_card_reviewed`). Structure TBD. |

## 2. Relationships

- **`auth.users` 1 : M `flashcards`**: One user can have many flashcards. Implemented via `flashcards.user_id` FK.
- **`auth.users` 1 : M `event_logs`**: One user can have many event logs. Implemented via `event_logs.user_id` FK.
- **`source_texts` 1 : M `flashcards`**: One source text can be used to generate many flashcards. Implemented via `flashcards.source_text_id` FK (nullable).

## 3. Indexes

- `flashcards(user_id)`: To efficiently query flashcards belonging to a specific user.
- `flashcards(source_text_id)`: To efficiently find flashcards generated from a specific source text.
- `event_logs(user_id)`: To efficiently query event logs for a specific user.
- `event_logs(event_type)`: To efficiently query specific types of events.
- `event_logs(timestamp)`: To efficiently query events within a specific time range.
- _Future:_ `flashcards(next_review_at)`: To efficiently query flashcards scheduled for review (when SRS fields are added).

## 4. Row Level Security (RLS) Policies

RLS must be enabled for the following tables:

- **`flashcards`**:
  - `SELECT`: Users can only select their own flashcards (`user_id = auth.uid()`).
  - `INSERT`: Users can only insert flashcards with their own `user_id` (`user_id = auth.uid()`).
  - `UPDATE`: Users can only update their own flashcards (`user_id = auth.uid()`).
  - `DELETE`: Users can only delete their own flashcards (`user_id = auth.uid()`).
- **`event_logs`**:
  - `SELECT`: Users can only select their own event logs (`user_id = auth.uid()`).
  - `INSERT`: Users can only insert event logs with their own `user_id` (`user_id = auth.uid()`). (Note: Depending on implementation, INSERT might be restricted to backend roles/service keys).
  - `UPDATE`: Generally not allowed for log tables.
  - `DELETE`: Generally not allowed for log tables, or restricted to specific admin roles.
- **`source_texts`**:
  - _Consideration:_ While not explicitly decided, RLS might be needed here if users should only access source texts linked to their flashcards. A simpler approach might be to rely on the fact that source texts are only accessed _through_ flashcards, which _are_ protected by RLS. Direct access might be restricted. If direct access is allowed, RLS based on linked flashcards would be complex. A simpler policy could restrict inserts (`INSERT` with `user_id = auth.uid()` if a `user_id` column were added) and potentially restrict `SELECT` if a `user_id` is added or via checking linked flashcards. For MVP, access control via flashcards seems sufficient.

## 5. Additional Notes & Considerations

- **SRS Fields:** Columns `next_review_at`, `interval`, and `ease_factor` in the `flashcards` table are placeholders. Their exact types and default values will depend on the specific SRS algorithm chosen later. An index on `next_review_at` will be crucial once implemented.
- **`event_logs.payload` Structure:** The specific JSON structure for the `payload` column in `event_logs` needs further definition based on what data is valuable for each `event_type` (e.g., storing `{'decision': 'accepted'}` or `{'decision': 'rejected'}` for `ai_card_reviewed`; potentially storing diffs for `card_edited`).
- **`flashcards.updated_at` Trigger:** Requires implementing a standard PostgreSQL trigger function (e.g., using `CREATE EXTENSION IF NOT EXISTS moddatetime;` and then `CREATE TRIGGER handle_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);` or a custom function).
- **UUID Generation:** Assumes the `uuid-ossp` extension is enabled in PostgreSQL (`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`) or using `gen_random_uuid()` if available. Supabase typically provides this.
- **Enum Types:** While `TEXT` with `CHECK` constraints is used for `source` and `event_type`, PostgreSQL `ENUM` types could be considered as an alternative for stricter type safety, though they are less flexible for adding new values later.
- **Normalization:** The schema is largely normalized (approaching 3NF). `source_texts` avoids redundancy of large text blocks within `flashcards`.
- **Cascading Deletes:** `ON DELETE CASCADE` is used for FKs referencing `auth.users` so that deleting a user automatically cleans up their associated data. `ON DELETE SET NULL` is used for `flashcards.source_text_id` so deleting a source text doesn't delete the flashcards generated from it (they just lose the link).
