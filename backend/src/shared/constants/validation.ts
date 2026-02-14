/**
 * Shared validation patterns used across the application.
 * Centralizes magic strings to avoid duplication and ensure consistency.
 */

/** UUIDv7 regex pattern (case-insensitive) */
export const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** UUIDv7 pattern string for Elysia schema validation */
export const UUID_V7_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

/** Role name regex: lowercase letters, digits, and underscores; must start with a letter */
export const ROLE_NAME_REGEX = /^[a-z][a-z0-9_]*$/;

/** Role name pattern string for Elysia schema validation */
export const ROLE_NAME_PATTERN = '^[a-z][a-z0-9_]*$';

/** Permission key regex: resource:action format (e.g., courses:create) */
export const PERMISSION_KEY_REGEX = /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/;

/** Permission key pattern string for Elysia schema validation */
export const PERMISSION_KEY_PATTERN = '^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$';

/** Permission resource/action segment regex */
export const PERMISSION_SEGMENT_REGEX = /^[a-z][a-z0-9_]*$/;
