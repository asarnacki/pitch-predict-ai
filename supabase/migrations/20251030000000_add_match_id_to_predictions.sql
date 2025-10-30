-- =====================================================
-- Migration: Add match_id to predictions table
-- Created: 2025-10-30
-- Description: Adds match_id column needed for fetching match results
-- =====================================================

-- Add match_id column to predictions table
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS match_id TEXT;

-- Add index for match_id lookups (optional but good for performance)
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON public.predictions(match_id);

-- Add comment
COMMENT ON COLUMN public.predictions.match_id IS 'External match ID from football-data.org API';
