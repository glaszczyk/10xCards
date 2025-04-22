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

## 3. Getting Started Locally

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
4.  **Set up environment variables:**
    - Create a `.env` file in the project root.
    - Add necessary environment variables, including Supabase project URL, anon key, and Openrouter.ai API key. Refer to `.env.example` if available (Note: `.env.example` needs to be created).
    ```plaintext
    # .env
    SUPABASE_URL=YOUR_SUPABASE_URL
    SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
    # Add other variables as needed
    ```
5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
6.  Open your browser to `http://localhost:4321` (or the port specified by Astro).

## 4. Available Scripts

Based on a typical Astro/React project using npm:

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for previewing.
- `npm run check`: Runs TypeScript type checking.
- `npm run format`: Formats code using Prettier (if configured).
- `npm run lint`: Lints code using ESLint (if configured).
- `npm run astro ...`: Run CLI commands like `astro add`, `astro check` |
- `npm run astro -- --help`: Get help using the Astro CLI

_(Note: These are common scripts. Verify exact scripts in `package.json`)_

## 5. Project Scope (MVP)

The Minimum Viable Product (MVP) focuses on core functionalities:

- **User Management:** Registration, Login.
- **Generation Module:** Paste text (1k-10k chars), AI generates 3-7 flashcards, inline editing, Accept/Reject cards, Manual card creation.
- **Learning Module:** SRS-based flashcard review interface (e.g., Leitner, simplified SM-2), User interaction for SRS ("Easy", "Hard", "Repeat").
- **Management Module:** List all user's cards, Edit cards, Delete cards.
- **Backend:** AI API integration, Database (PostgreSQL via Supabase) for users and cards (`userId`, `front`, `back`, `createdAt`, `source`, SRS fields), Event logging (`card_created`, `ai_card_reviewed`), Basic error handling.

**Out of Scope for MVP:** Import/Export, Non-text input, Sharing, Decks/Tagging, Advanced AI config, LMS integration, Mobile app, Offline mode, Detailed stats, Anonymous logging, Rich text editing.

## 6. Project Status

- **Current Phase:** Development (MVP)
- **Next Steps:** Implementation of core modules (Generation, Learning, Management), UI development, Backend integration.

## 7. License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details. (Note: A `LICENSE` file needs to be created, typically with the standard MIT license text).
