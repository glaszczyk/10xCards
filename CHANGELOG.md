# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Event Logging System**: Comprehensive event logging for all CRUD operations

  - Automatic logging of flashcard creation (manual and AI)
  - Automatic logging of source text operations
  - Automatic logging of flashcard and source text updates and deletions
  - Rich payload data for each event type
  - Non-blocking logging (failures don't interrupt main functionality)

- **New Event Types**:

  - `manual_card_created` - Manual flashcard creation
  - `ai_card_created` - AI-generated flashcard creation
  - `source_text_created` - Source text creation
  - `card_edited` - Flashcard updates
  - `card_deleted` - Flashcard deletion
  - `source_text_updated` - Source text updates
  - `source_text_deleted` - Source text deletion

- **Database Migration**:

  - `20240726103500_create_complete_schema.sql` - Complete schema with all tables, indexes, test user, and minimal test data

- **Testing and Utilities**:

  - `run-migrations.sh` - Script to run database migrations
  - `test-event-logging.sh` - Script to test event logging functionality
  - `docs/event-logging-implementation.md` - Comprehensive documentation

- **Enhanced API Endpoints**:
  - Complete CRUD operations for flashcards and source texts
  - Event logs endpoint with filtering and pagination
  - Improved error handling and validation

### Changed

- **SupabaseProvider**: Enhanced with event logging capabilities

  - Added `logEvent()` helper method
  - Integrated logging into all CRUD operations
  - Improved error handling for logging failures

- **Database Schema**: Simplified to single migration

  - Combined all schema changes into one comprehensive migration
  - Includes all tables, indexes, test user, and minimal test data

- **Documentation**: Updated README.md with event logging information
  - Added API endpoints documentation
  - Added event logging features and testing instructions
  - Updated project structure and scripts

### Security

- **Row Level Security (RLS)**: All tables are protected by comprehensive RLS policies
  - Users can only access their own data (flashcards, source_texts, event_logs)
  - Event logs cannot be modified or deleted by users (immutable audit trail)
  - Anon users are blocked from all tables
  - Proper authentication required for all operations

### Technical Details

- **Payload Structure**: Each event type has a specific JSON payload structure
- **Error Handling**: Logging failures are caught and logged but don't break main operations
- **Performance**: Logging is asynchronous and non-blocking
- **Data Integrity**: All operations now have corresponding event logs

## [0.1.0] - 2024-07-26

### Added

- Initial project setup with Astro 5 and React 19
- Supabase integration for database and authentication
- Basic flashcard and source text management
- Mock data provider for development
- Health check endpoint
- Basic API structure

### Changed

- Project structure and configuration
- Development environment setup

### Security

- Row Level Security (RLS) policies for data protection
- User authentication and authorization
