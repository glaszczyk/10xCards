# Future Database Migrations

## Overview

This document outlines planned database migrations for the 10xCards application.

## SRS Algorithm Fields Migration

### Current State

The SRS (Spaced Repetition System) algorithm requires two fields that are currently missing from the database:

- `repetitions`: Number of times a card has been reviewed
- `state`: SRS state (0=new, 1=learning, 2=review, 3=relearning)

### Migration Plan

#### Phase 1: Add SRS Fields

```sql
-- Migration: Add SRS fields to flashcards table
-- File: 2025_XX_XX_add_srs_fields_to_flashcards.sql

ALTER TABLE public.flashcards
ADD COLUMN repetitions INTEGER NOT NULL DEFAULT 0,
ADD COLUMN state INTEGER NOT NULL DEFAULT 0;

-- Add comments
COMMENT ON COLUMN public.flashcards.repetitions IS 'Number of times the card has been reviewed (SRS algorithm)';
COMMENT ON COLUMN public.flashcards.state IS 'SRS state: 0=new, 1=learning, 2=review, 3=relearning';

-- Add indexes for performance
CREATE INDEX idx_flashcards_repetitions ON public.flashcards(repetitions);
CREATE INDEX idx_flashcards_state ON public.flashcards(state);
CREATE INDEX idx_flashcards_srs_status ON public.flashcards(repetitions, state, next_review_at);
```

#### Phase 2: Update Application Code

After the migration, update the following files:

1. `src/common/types.ts` - Make repetitions and state required fields
2. `src/components/generate/GeneratePage.tsx` - Remove TODO comments
3. `src/components/generate/ManualFlashcardForm.tsx` - Remove TODO comments
4. `src/components/generate/FlashcardPreview.tsx` - Remove TODO comments
5. `src/__tests__/factories/mvp-test-data.ts` - Remove TODO comments

#### Phase 3: Data Migration

```sql
-- Update existing flashcards with default SRS values
UPDATE public.flashcards
SET repetitions = 0, state = 0
WHERE repetitions IS NULL OR state IS NULL;
```

### Benefits

- **Full SRS Algorithm Support**: Enable complete spaced repetition functionality
- **Performance**: Database-level filtering and sorting of SRS data
- **Data Integrity**: Ensure all flashcards have proper SRS state
- **Scalability**: Better performance for large flashcard collections

### Testing

After migration, run the following test suites:

```bash
npm run test:critical    # SRS algorithm tests
npm run test:components  # Component tests
npm run test:integration # Integration tests
```

### Rollback Plan

If issues arise, the migration can be rolled back:

```sql
-- Rollback migration
ALTER TABLE public.flashcards
DROP COLUMN repetitions,
DROP COLUMN state;

-- Drop indexes
DROP INDEX IF EXISTS idx_flashcards_repetitions;
DROP INDEX IF EXISTS idx_flashcards_state;
DROP INDEX IF EXISTS idx_flashcards_srs_status;
```

## Future Considerations

### Additional SRS Fields

Consider adding these fields in future migrations:

- `last_reviewed_at`: Timestamp of last review
- `review_history`: JSON array of review results
- `difficulty_rating`: User-assigned difficulty (1-5)

### Performance Optimizations

- Partitioning by user_id for large datasets
- Materialized views for SRS statistics
- Caching layer for frequently accessed SRS data

## Timeline

- **Phase 1**: Q1 2025 (Database migration)
- **Phase 2**: Q1 2025 (Code updates)
- **Phase 3**: Q1 2025 (Data migration and testing)

## Notes

- All TODO comments in the codebase reference this migration
- Test coverage should be maintained at >90% during migration
- Consider running migration during low-traffic periods
- Backup database before running migration
