-- Migration: Add 'interactive' to section_content_type enum
-- Created: 2026-01-28
-- Purpose: Support interactive section bundles (HTML/CSS/JS demos)

ALTER TYPE section_content_type ADD VALUE IF NOT EXISTS 'interactive';
