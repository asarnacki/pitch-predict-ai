-- Migration: Add user_choice column to predictions table
-- Description: Allows users to select their predicted outcome (home win, draw, or away win)
-- Author: PitchPredict AI Team
-- Date: 2025-11-17

-- Add user_choice column with CHECK constraint
ALTER TABLE predictions
ADD COLUMN user_choice TEXT
CHECK(user_choice IN ('home', 'draw', 'away'));

-- Add comment for documentation
COMMENT ON COLUMN predictions.user_choice IS
'User''s selected prediction: "home" for home team win, "draw" for draw, "away" for away team win. Optional field.';
