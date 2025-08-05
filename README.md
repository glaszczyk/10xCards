# 10xCards (Proposed Name)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 1. Project Description

10xCards aims to revolutionize the flashcard creation process by automating content generation using Artificial Intelligence (AI). Users can paste source text, and the AI generates a set of flashcards (front/back). These generated cards can be reviewed, edited, accepted, or rejected. Accepted flashcards are saved to the user's account and can be used in an integrated learning module based on a Spaced Repetition System (SRS) algorithm. The application also allows for manual flashcard creation and management of the saved collection. The product targets general learners without specialization in a specific domain.

## 2. Tech Stack

**Frontend:**

- **Framework:** [Astro 5](https://astro.build/) (for minimal JavaScript static sites)
- **UI Components:** [React 19](https://react.dev/) (for interactive elements)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Component Library:** [Shadcn/ui](https://ui.shadcn.com/)

**Backend:**

- **Platform:** [Supabase](https://supabase.com/) (PostgreSQL DB, BaaS SDKs, Authentication) - Open source, self-hostable.

**AI:**

- **Integration:** [Openrouter.ai](https://openrouter.ai/) (Access to various AI models like OpenAI, Anthropic, Google)

**CI/CD & Hosting:**

- **CI/CD:** [GitHub Actions](https://github.com/features/actions)
- **Hosting:** [DigitalOcean](https://www.digitalocean.com/) (via Docker image)

## 3. Data Architecture

The application uses a flexible data provider architecture that allows switching between different data sources:

### Data Providers

- **Supabase Provider**: Uses Supabase as the primary database
- **Mock Provider**: Uses in-memory mock data for development and testing

### Configuration

The data provider is automatically selected based on environment configuration:

```bash
# Force mock data (development)
DATA_PROVIDER=mock

# Force Supabase (production)
DATA_PROVIDER=supabase

# Auto-detect (default - uses Supabase if configured, otherwise mock)
DATA_PROVIDER=
```

### Environment Variables

```bash
# Required for Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - data provider selection
DATA_PROVIDER=supabase|mock|auto
```

For detailed documentation, see [docs/data-providers.md](docs/data-providers.md).

## 4. Getting Started Locally

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd 10xCards
    ```

2.  **Set Node.js version:**

    - Ensure you have `nvm` (Node Version Manager) installed.
    - Run `nvm use` in the project root to activate the correct Node.js version specified in `.nvmrc`. If you don't have the specified version, `nvm` might prompt you to install it.

3.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

4.  **Set up Supabase (Optional but Recommended):**

    **Option A: Using Supabase Cloud (Recommended for development):**

    - Go to [supabase.com](https://supabase.com) and create a free account
    - Create a new project
    - Once created, go to Settings → API
    - Copy the `Project URL` and `anon public` key
    - These will be your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
    - Link your project: `npx supabase link --project-ref your-project-ref`
    - Apply database schema: `npx supabase db push` (applies the schema from `supabase/migrations/`)

    **Option B: Using Supabase Local Development:**

    - Supabase CLI is already installed as a dev dependency
    - Start Supabase locally: `npx supabase start`
    - The CLI will output your local Supabase URL and keys
    - Use these values for your environment variables
    - Run migrations: `npx supabase db push` (applies the schema from `supabase/migrations/`)

5.  **Set up environment variables:**

    - Create a `.env` file in the project root:

    ```bash
    cp env.example .env
    ```

    - Configure the variables in `.env`:

    **For development with mock data (no database needed):**

    ```plaintext
    DATA_PROVIDER=mock
    ```

    **For development with Supabase:**

    ```plaintext
    DATA_PROVIDER=supabase
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

    **For AI integration (optional):**

    ```plaintext
    OPENROUTER_API_KEY=your_openrouter_api_key
    ```

6.  **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

7.  Open your browser to `http://localhost:4321` (or the port specified by Astro).

## 5. Available Scripts

Based on a typical Astro/React project using npm:

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for previewing.
- `npm run check`: Runs TypeScript type checking.
- `npm run format`: Formats code using Prettier (if configured).
- `npm run lint`: Lints code using ESLint (if configured).
- `npm run astro ...`: Run CLI commands like `astro add`, `astro check` |
- `npm run astro -- --help`: Get help using the Astro CLI
- `npm run update-types`: Generate TypeScript types from Supabase schema
- `npx supabase start`: Start local Supabase instance
- `npx supabase stop`: Stop local Supabase instance
- `npx supabase db push`: Apply database migrations
- `npx supabase db reset`: Reset local database

_(Note: These are common scripts. Verify exact scripts in `package.json`)_

## 6. API Endpoints

### Flashcards

- `GET /api/v1/flashcards` - List flashcards with pagination and filtering
- `POST /api/v1/flashcards` - Create new flashcards (manual or AI)
- `GET /api/v1/flashcards/:id` - Get specific flashcard
- `PATCH /api/v1/flashcards/:id` - Update flashcard
- `DELETE /api/v1/flashcards/:id` - Delete flashcard

### Source Texts

- `GET /api/v1/source-texts` - List source texts with pagination
- `POST /api/v1/source-texts` - Create new source text
- `GET /api/v1/source-texts/:id` - Get specific source text with flashcards
- `PATCH /api/v1/source-texts/:id` - Update source text
- `DELETE /api/v1/source-texts/:id` - Delete source text

### Health Check

- `GET /api/v1/health` - Check application and data provider health

### Event Logs

- `GET /api/v1/event-logs` - List event logs with filtering and pagination

## 7. Event Logging

The application includes comprehensive event logging for all CRUD operations:

### Event Types

- `manual_card_created` - Manual flashcard creation
- `ai_card_created` - AI-generated flashcard creation
- `source_text_created` - Source text creation
- `card_edited` - Flashcard updates
- `card_deleted` - Flashcard deletion
- `source_text_updated` - Source text updates
- `source_text_deleted` - Source text deletion

### Features

- **Automatic Logging**: All operations automatically create corresponding event logs
- **Rich Payload**: Each event includes relevant metadata (IDs, changes, counts)
- **Security**: Event logs are protected by Row Level Security (RLS)
- **Audit Trail**: Complete history of all user actions
- **Non-blocking**: Logging failures don't interrupt main functionality

### Testing Event Logging

```bash
# Run the event logging test
./test-event-logging.sh

# Run database migration (includes complete schema and test data)
./run-migrations.sh
```

For detailed documentation, see [docs/event-logging-implementation.md](docs/event-logging-implementation.md).

## 8. Configuration Management

The project includes a configuration switcher that allows easy switching between different environments:

### Quick Configuration Switching

```bash
# Switch to mock data (no database needed)
./switch-config.sh mock

# Switch to Supabase (requires database setup)
./switch-config.sh supabase

# Switch to auto-detection (Supabase if available, otherwise mock)
./switch-config.sh auto

# List all available configurations
./switch-config.sh list
```

### Advanced Configuration Management

```bash
# Create custom configuration
./switch-config.sh create dev supabase

# Backup current configuration
./switch-config.sh backup

# Restore from backup
./switch-config.sh restore backup_20250805_071700.env
```

### Configuration Types

- **Mock**: Uses in-memory data (no database required)
- **Supabase**: Uses Supabase database (requires setup)
- **Auto**: Automatically detects and uses available provider

For detailed documentation, see [docs/configuration-switcher.md](docs/configuration-switcher.md).

## 9. Project Scope (MVP)

The Minimum Viable Product (MVP) focuses on core functionalities:

- **User Management:** Registration, Login.
- **Generation Module:** Paste text (1k-10k chars), AI generates 3-7 flashcards, inline editing, Accept/Reject cards, Manual card creation.
- **Learning Module:** SRS-based flashcard review interface (e.g., Leitner, simplified SM-2), User interaction for SRS ("Easy", "Hard", "Repeat").
- **Management Module:** List all user's cards, Edit cards, Delete cards.
- **Backend:** AI API integration, Database (PostgreSQL via Supabase) for users and cards (`userId`, `front`, `back`, `createdAt`, `source`, SRS fields), Event logging (`card_created`, `ai_card_reviewed`), Basic error handling.

**Out of Scope for MVP:** Import/Export, Non-text input, Sharing, Decks/Tagging, Advanced AI config, LMS integration, Mobile app, Offline mode, Detailed stats, Anonymous logging, Rich text editing.

## 10. Project Status

- **Current Phase:** Development (MVP)
- **Next Steps:** Implementation of core modules (Generation, Learning, Management), UI development, Backend integration.

## 11. License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details. (Note: A `LICENSE` file needs to be created, typically with the standard MIT license text).
