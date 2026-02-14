import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * Domain Error Codes
 * Centralized error codes for the entire application
 * Enables i18n, consistent error handling, and better debugging
 */

export enum ErrorCode {
  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // User/Auth errors
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  EMAIL_TOO_LONG = 'EMAIL_TOO_LONG',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  PASSWORD_REQUIRED = 'PASSWORD_REQUIRED',
  PASSWORD_TOO_SHORT = 'PASSWORD_TOO_SHORT',
  PASSWORD_TOO_LONG = 'PASSWORD_TOO_LONG',
  PASSWORD_NEEDS_UPPERCASE = 'PASSWORD_NEEDS_UPPERCASE',
  PASSWORD_NEEDS_LOWERCASE = 'PASSWORD_NEEDS_LOWERCASE',
  PASSWORD_NEEDS_NUMBER = 'PASSWORD_NEEDS_NUMBER',
  PASSWORD_NEEDS_SPECIAL = 'PASSWORD_NEEDS_SPECIAL',
  PASSWORD_TOO_COMMON = 'PASSWORD_TOO_COMMON',
  PASSWORD_HASH_FAILED = 'PASSWORD_HASH_FAILED',
  INVALID_PASSWORD_HASH = 'INVALID_PASSWORD_HASH',
  PASSWORD_HASH_EMPTY = 'PASSWORD_HASH_EMPTY',
  SAVE_USER_FAILED = 'SAVE_USER_FAILED',
  USER_ALREADY_HAS_ROLE = 'USER_ALREADY_HAS_ROLE',
  USER_DOES_NOT_HAVE_ROLE = 'USER_DOES_NOT_HAVE_ROLE',
  USER_ALREADY_HAS_PERMISSION = 'USER_ALREADY_HAS_PERMISSION',
  USER_DOES_NOT_HAVE_PERMISSION = 'USER_DOES_NOT_HAVE_PERMISSION',

  // Profile management errors
  CURRENT_PASSWORD_INCORRECT = 'CURRENT_PASSWORD_INCORRECT',
  NEW_PASSWORD_SAME_AS_CURRENT = 'NEW_PASSWORD_SAME_AS_CURRENT',
  PHOTO_UPLOAD_FAILED = 'PHOTO_UPLOAD_FAILED',
  PHOTO_INVALID_TYPE = 'PHOTO_INVALID_TYPE',
  PHOTO_TOO_LARGE = 'PHOTO_TOO_LARGE',
  ACCOUNT_DELETION_REQUIRES_PASSWORD = 'ACCOUNT_DELETION_REQUIRES_PASSWORD',

  // ID errors
  INVALID_UUID_FORMAT = 'INVALID_UUID_FORMAT',
  INVALID_USER_ID = 'INVALID_USER_ID',
  INVALID_ROLE_ID = 'INVALID_ROLE_ID',
  INVALID_PERMISSION_ID = 'INVALID_PERMISSION_ID',
  INVALID_OAUTH_CONNECTION_ID = 'INVALID_OAUTH_CONNECTION_ID',

  // Role errors
  ROLE_NAME_REQUIRED = 'ROLE_NAME_REQUIRED',
  ROLE_NAME_TOO_SHORT = 'ROLE_NAME_TOO_SHORT',
  ROLE_NAME_TOO_LONG = 'ROLE_NAME_TOO_LONG',
  ROLE_NAME_INVALID_FORMAT = 'ROLE_NAME_INVALID_FORMAT',
  ROLE_RESERVED_NAME = 'ROLE_RESERVED_NAME',
  ROLE_ONLY_ADMIN_SYSTEM = 'ROLE_ONLY_ADMIN_SYSTEM',
  ROLE_CANNOT_RENAME_SYSTEM = 'ROLE_CANNOT_RENAME_SYSTEM',
  ROLE_CANNOT_RENAME_TO_ADMIN = 'ROLE_CANNOT_RENAME_TO_ADMIN',
  ROLE_ALREADY_HAS_PERMISSION = 'ROLE_ALREADY_HAS_PERMISSION',
  ROLE_DOES_NOT_HAVE_PERMISSION = 'ROLE_DOES_NOT_HAVE_PERMISSION',
  ROLE_NOT_FOUND = 'ROLE_NOT_FOUND',
  ROLE_CANNOT_REMOVE_LAST = 'ROLE_CANNOT_REMOVE_LAST',
  ROLE_CANNOT_DELETE_SYSTEM = 'ROLE_CANNOT_DELETE_SYSTEM',

  // OAuth errors
  OAUTH_UNSUPPORTED_PROVIDER = 'OAUTH_UNSUPPORTED_PROVIDER',
  OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER = 'OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER',
  OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER_ID = 'OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER_ID',
  OAUTH_USER_ID_REQUIRED = 'OAUTH_USER_ID_REQUIRED',
  OAUTH_PROFILE_REQUIRED = 'OAUTH_PROFILE_REQUIRED',
  OAUTH_PROVIDER_REQUIRED = 'OAUTH_PROVIDER_REQUIRED',
  OAUTH_PROVIDER_LOCAL_NOT_ALLOWED = 'OAUTH_PROVIDER_LOCAL_NOT_ALLOWED',
  OAUTH_PROVIDER_USER_ID_REQUIRED = 'OAUTH_PROVIDER_USER_ID_REQUIRED',
  OAUTH_INVALID_EMAIL_FORMAT = 'OAUTH_INVALID_EMAIL_FORMAT',
  OAUTH_INVALID_AVATAR_URL = 'OAUTH_INVALID_AVATAR_URL',
  OAUTH_PLACEHOLDER_EMAIL_FAILED = 'OAUTH_PLACEHOLDER_EMAIL_FAILED',
  OAUTH_PASSWORD_GENERATION_FAILED = 'OAUTH_PASSWORD_GENERATION_FAILED',
  OAUTH_PROVIDER_NOT_CONFIGURED = 'OAUTH_PROVIDER_NOT_CONFIGURED',
  OAUTH_AUTHORIZATION_URL_FAILED = 'OAUTH_AUTHORIZATION_URL_FAILED',
  OAUTH_CODE_EXCHANGE_FAILED = 'OAUTH_CODE_EXCHANGE_FAILED',
  OAUTH_TOKEN_REFRESH_FAILED = 'OAUTH_TOKEN_REFRESH_FAILED',
  OAUTH_FACEBOOK_NO_REFRESH = 'OAUTH_FACEBOOK_NO_REFRESH',
  OAUTH_USER_INFO_FAILED = 'OAUTH_USER_INFO_FAILED',
  OAUTH_NO_ID_TOKEN = 'OAUTH_NO_ID_TOKEN',
  OAUTH_APPLE_REFRESH_NOT_SUPPORTED = 'OAUTH_APPLE_REFRESH_NOT_SUPPORTED',
  OAUTH_INVALID_JWT_FORMAT = 'OAUTH_INVALID_JWT_FORMAT',

  // Auth Provider errors
  AUTH_PROVIDER_EMPTY = 'AUTH_PROVIDER_EMPTY',
  AUTH_PROVIDER_INVALID = 'AUTH_PROVIDER_INVALID',

  // Permission errors
  PERMISSION_EMPTY = 'PERMISSION_EMPTY',
  PERMISSION_INVALID_FORMAT = 'PERMISSION_INVALID_FORMAT',
  PERMISSION_RESOURCE_EMPTY = 'PERMISSION_RESOURCE_EMPTY',
  PERMISSION_ACTION_EMPTY = 'PERMISSION_ACTION_EMPTY',
  PERMISSION_RESOURCE_INVALID_FORMAT = 'PERMISSION_RESOURCE_INVALID_FORMAT',
  PERMISSION_ACTION_INVALID_FORMAT = 'PERMISSION_ACTION_INVALID_FORMAT',

  // Refresh Token errors
  REFRESH_TOKEN_INVALID_FORMAT = 'REFRESH_TOKEN_INVALID_FORMAT',

  // Infrastructure/Mapper errors
  MAPPER_INVALID_USER_ID = 'MAPPER_INVALID_USER_ID',
  MAPPER_INVALID_EMAIL = 'MAPPER_INVALID_EMAIL',
  MAPPER_INVALID_PASSWORD_HASH = 'MAPPER_INVALID_PASSWORD_HASH',
  MAPPER_INVALID_OAUTH_CONNECTION_ID = 'MAPPER_INVALID_OAUTH_CONNECTION_ID',
  MAPPER_INVALID_PROVIDER = 'MAPPER_INVALID_PROVIDER',

  // Password Hasher errors
  PASSWORD_TOO_SHORT_FOR_HASH = 'PASSWORD_TOO_SHORT_FOR_HASH',

  // Course errors
  INVALID_COURSE_ID = 'INVALID_COURSE_ID',
  COURSE_NOT_FOUND = 'COURSE_NOT_FOUND',
  COURSE_ALREADY_PUBLISHED = 'COURSE_ALREADY_PUBLISHED',
  COURSE_NOT_PUBLISHED = 'COURSE_NOT_PUBLISHED',
  COURSE_ALREADY_ARCHIVED = 'COURSE_ALREADY_ARCHIVED',
  COURSE_CANNOT_ARCHIVE_DRAFT = 'COURSE_CANNOT_ARCHIVE_DRAFT',
  COURSE_CANNOT_PUBLISH_WITHOUT_MODULES = 'COURSE_CANNOT_PUBLISH_WITHOUT_MODULES',
  COURSE_TITLE_EMPTY = 'COURSE_TITLE_EMPTY',
  COURSE_TITLE_TOO_SHORT = 'COURSE_TITLE_TOO_SHORT',
  COURSE_TITLE_TOO_LONG = 'COURSE_TITLE_TOO_LONG',
  COURSE_DESCRIPTION_TOO_LONG = 'COURSE_DESCRIPTION_TOO_LONG',

  // Slug errors
  SLUG_EMPTY = 'SLUG_EMPTY',
  SLUG_TOO_SHORT = 'SLUG_TOO_SHORT',
  SLUG_TOO_LONG = 'SLUG_TOO_LONG',
  SLUG_INVALID_FORMAT = 'SLUG_INVALID_FORMAT',
  SLUG_ALREADY_EXISTS = 'SLUG_ALREADY_EXISTS',

  // Module errors
  INVALID_MODULE_ID = 'INVALID_MODULE_ID',
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  MODULE_TITLE_EMPTY = 'MODULE_TITLE_EMPTY',
  MODULE_TITLE_TOO_LONG = 'MODULE_TITLE_TOO_LONG',
  MODULE_ALREADY_IN_COURSE = 'MODULE_ALREADY_IN_COURSE',
  MODULE_ORDER_INVALID = 'MODULE_ORDER_INVALID',
  MODULE_CANNOT_DELETE_WITH_LESSONS = 'MODULE_CANNOT_DELETE_WITH_LESSONS',

  // Lesson errors
  INVALID_LESSON_ID = 'INVALID_LESSON_ID',
  LESSON_NOT_FOUND = 'LESSON_NOT_FOUND',
  LESSON_TITLE_EMPTY = 'LESSON_TITLE_EMPTY',
  LESSON_TITLE_TOO_LONG = 'LESSON_TITLE_TOO_LONG',
  LESSON_SLUG_EMPTY = 'LESSON_SLUG_EMPTY',
  LESSON_CONTENT_EMPTY = 'LESSON_CONTENT_EMPTY',
  LESSON_ALREADY_IN_MODULE = 'LESSON_ALREADY_IN_MODULE',
  LESSON_ORDER_INVALID = 'LESSON_ORDER_INVALID',
  LESSON_CANNOT_MODIFY_PUBLISHED = 'LESSON_CANNOT_MODIFY_PUBLISHED',

  // Section errors
  INVALID_SECTION_ID = 'INVALID_SECTION_ID',
  SECTION_NOT_FOUND = 'SECTION_NOT_FOUND',
  SECTION_TITLE_EMPTY = 'SECTION_TITLE_EMPTY',
  SECTION_TITLE_TOO_LONG = 'SECTION_TITLE_TOO_LONG',
  SECTION_ALREADY_IN_LESSON = 'SECTION_ALREADY_IN_LESSON',
  SECTION_ORDER_INVALID = 'SECTION_ORDER_INVALID',
  SECTION_INVALID_CONTENT_TYPE = 'SECTION_INVALID_CONTENT_TYPE',

  // Section Progress errors
  SECTION_PROGRESS_NOT_FOUND = 'SECTION_PROGRESS_NOT_FOUND',
  SECTION_PROGRESS_ALREADY_COMPLETED = 'SECTION_PROGRESS_ALREADY_COMPLETED',
  INVALID_SECTION_PROGRESS_ID = 'INVALID_SECTION_PROGRESS_ID',

  // Enrollment errors
  INVALID_ENROLLMENT_ID = 'INVALID_ENROLLMENT_ID',
  ENROLLMENT_NOT_FOUND = 'ENROLLMENT_NOT_FOUND',
  ENROLLMENT_ALREADY_EXISTS = 'ENROLLMENT_ALREADY_EXISTS',
  ENROLLMENT_COURSE_NOT_PUBLISHED = 'ENROLLMENT_COURSE_NOT_PUBLISHED',
  ENROLLMENT_ALREADY_CANCELLED = 'ENROLLMENT_ALREADY_CANCELLED',
  ENROLLMENT_ALREADY_COMPLETED = 'ENROLLMENT_ALREADY_COMPLETED',
  ENROLLMENT_NOT_ACTIVE = 'ENROLLMENT_NOT_ACTIVE',

  // Lesson Progress errors
  PROGRESS_NOT_FOUND = 'PROGRESS_NOT_FOUND',
  PROGRESS_ALREADY_COMPLETED = 'PROGRESS_ALREADY_COMPLETED',
  PROGRESS_INVALID_WATCH_TIME = 'PROGRESS_INVALID_WATCH_TIME',

  // LessonBundle errors
  INVALID_LESSON_BUNDLE_ID = 'INVALID_LESSON_BUNDLE_ID',
  BUNDLE_VERSION_INVALID = 'BUNDLE_VERSION_INVALID',
  BUNDLE_STORAGE_PATH_EMPTY = 'BUNDLE_STORAGE_PATH_EMPTY',
  BUNDLE_NOT_FOUND = 'BUNDLE_NOT_FOUND',
  BUNDLE_ALREADY_ACTIVE = 'BUNDLE_ALREADY_ACTIVE',
  BUNDLE_UPLOAD_FAILED = 'BUNDLE_UPLOAD_FAILED',
  BUNDLE_MANIFEST_INVALID = 'BUNDLE_MANIFEST_INVALID',
  CANNOT_DELETE_ACTIVE_BUNDLE = 'CANNOT_DELETE_ACTIVE_BUNDLE',
  BUNDLE_ENTRYPOINT_NOT_FOUND = 'BUNDLE_ENTRYPOINT_NOT_FOUND',

  // SectionBundle errors
  INVALID_SECTION_BUNDLE_ID = 'INVALID_SECTION_BUNDLE_ID',
  SECTION_BUNDLE_NOT_FOUND = 'SECTION_BUNDLE_NOT_FOUND',
  SECTION_BUNDLE_ALREADY_ACTIVE = 'SECTION_BUNDLE_ALREADY_ACTIVE',
  CANNOT_DELETE_ACTIVE_SECTION_BUNDLE = 'CANNOT_DELETE_ACTIVE_SECTION_BUNDLE',

  // Category errors
  INVALID_CATEGORY_ID = 'INVALID_CATEGORY_ID',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  CATEGORY_NAME_EMPTY = 'CATEGORY_NAME_EMPTY',
  CATEGORY_NAME_TOO_LONG = 'CATEGORY_NAME_TOO_LONG',
  CATEGORY_SLUG_ALREADY_EXISTS = 'CATEGORY_SLUG_ALREADY_EXISTS',
  CATEGORY_HAS_COURSES = 'CATEGORY_HAS_COURSES',

  // LLM Manufacturer errors
  INVALID_MANUFACTURER_ID = 'INVALID_MANUFACTURER_ID',
  MANUFACTURER_NOT_FOUND = 'MANUFACTURER_NOT_FOUND',
  MANUFACTURER_NAME_EMPTY = 'MANUFACTURER_NAME_EMPTY',
  MANUFACTURER_NAME_TOO_LONG = 'MANUFACTURER_NAME_TOO_LONG',
  MANUFACTURER_SLUG_EMPTY = 'MANUFACTURER_SLUG_EMPTY',
  MANUFACTURER_SLUG_ALREADY_EXISTS = 'MANUFACTURER_SLUG_ALREADY_EXISTS',
  MANUFACTURER_HAS_MODELS = 'MANUFACTURER_HAS_MODELS',

  // LLM Model errors
  INVALID_LLM_MODEL_ID = 'INVALID_LLM_MODEL_ID',
  LLM_MODEL_NOT_FOUND = 'LLM_MODEL_NOT_FOUND',
  LLM_MODEL_NAME_EMPTY = 'LLM_MODEL_NAME_EMPTY',
  LLM_MODEL_NAME_TOO_LONG = 'LLM_MODEL_NAME_TOO_LONG',
  LLM_MODEL_TECHNICAL_NAME_EMPTY = 'LLM_MODEL_TECHNICAL_NAME_EMPTY',
  LLM_MODEL_TECHNICAL_NAME_ALREADY_EXISTS = 'LLM_MODEL_TECHNICAL_NAME_ALREADY_EXISTS',
  NO_DEFAULT_LLM_MODEL = 'NO_DEFAULT_LLM_MODEL',

  // Exercise Verification errors
  SECTION_NOT_EXERCISE = 'SECTION_NOT_EXERCISE',
  EXERCISE_VERIFICATION_FAILED = 'EXERCISE_VERIFICATION_FAILED',

  // Certificate errors
  INVALID_CERTIFICATE_ID = 'INVALID_CERTIFICATE_ID',
  CERTIFICATE_NOT_FOUND = 'CERTIFICATE_NOT_FOUND',

  // Calendar Event errors
  INVALID_CALENDAR_EVENT_ID = 'INVALID_CALENDAR_EVENT_ID',
  CALENDAR_EVENT_NOT_FOUND = 'CALENDAR_EVENT_NOT_FOUND',
  CALENDAR_EVENT_TITLE_EMPTY = 'CALENDAR_EVENT_TITLE_EMPTY',
  CALENDAR_EVENT_TITLE_TOO_LONG = 'CALENDAR_EVENT_TITLE_TOO_LONG',
  CALENDAR_EVENT_INVALID_TYPE = 'CALENDAR_EVENT_INVALID_TYPE',
}

/**
 * Error messages mapped to error codes
 * Can be extended for i18n support
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Generic
  [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred',
  [ErrorCode.VALIDATION_ERROR]: 'Validation error',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.CONFLICT]: 'Resource conflict',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized',
  [ErrorCode.FORBIDDEN]: 'Forbidden',

  // User/Auth
  [ErrorCode.INVALID_EMAIL_FORMAT]: 'Invalid email format',
  [ErrorCode.EMAIL_TOO_LONG]: 'Email is too long (max 254 characters)',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User with this email already exists',
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.INVALID_PASSWORD]: 'Invalid password',
  [ErrorCode.PASSWORD_REQUIRED]: 'Password is required',
  [ErrorCode.PASSWORD_TOO_SHORT]: 'Password must be at least 8 characters',
  [ErrorCode.PASSWORD_TOO_LONG]: 'Password must be at most 128 characters',
  [ErrorCode.PASSWORD_NEEDS_UPPERCASE]: 'Password must contain at least one uppercase letter',
  [ErrorCode.PASSWORD_NEEDS_LOWERCASE]: 'Password must contain at least one lowercase letter',
  [ErrorCode.PASSWORD_NEEDS_NUMBER]: 'Password must contain at least one number',
  [ErrorCode.PASSWORD_NEEDS_SPECIAL]: 'Password must contain at least one special character',
  [ErrorCode.PASSWORD_TOO_COMMON]: 'Password is too common',
  [ErrorCode.PASSWORD_HASH_FAILED]: 'Failed to hash password',
  [ErrorCode.INVALID_PASSWORD_HASH]: 'Invalid password hash format',
  [ErrorCode.PASSWORD_HASH_EMPTY]: 'Password hash cannot be empty',
  [ErrorCode.SAVE_USER_FAILED]: 'Failed to save user',
  [ErrorCode.USER_ALREADY_HAS_ROLE]: 'User already has role',
  [ErrorCode.USER_DOES_NOT_HAVE_ROLE]: 'User does not have role',
  [ErrorCode.USER_ALREADY_HAS_PERMISSION]: 'User already has permission',
  [ErrorCode.USER_DOES_NOT_HAVE_PERMISSION]: 'User does not have permission',

  // Profile management
  [ErrorCode.CURRENT_PASSWORD_INCORRECT]: 'Current password is incorrect',
  [ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT]: 'New password must be different from current password',
  [ErrorCode.PHOTO_UPLOAD_FAILED]: 'Failed to upload photo',
  [ErrorCode.PHOTO_INVALID_TYPE]: 'Invalid photo type. Allowed: JPEG, PNG, WebP',
  [ErrorCode.PHOTO_TOO_LARGE]: 'Photo is too large. Maximum size is 2MB',
  [ErrorCode.ACCOUNT_DELETION_REQUIRES_PASSWORD]: 'Password is required to delete account',

  // ID
  [ErrorCode.INVALID_UUID_FORMAT]: 'Invalid UUID format',
  [ErrorCode.INVALID_USER_ID]: 'Invalid user ID',
  [ErrorCode.INVALID_ROLE_ID]: 'Invalid role ID',
  [ErrorCode.INVALID_PERMISSION_ID]: 'Invalid permission ID',
  [ErrorCode.INVALID_OAUTH_CONNECTION_ID]: 'Invalid OAuth connection ID',

  // Role
  [ErrorCode.ROLE_NAME_REQUIRED]: 'Role name cannot be empty',
  [ErrorCode.ROLE_NAME_TOO_SHORT]: 'Role name must be at least 2 characters long',
  [ErrorCode.ROLE_NAME_TOO_LONG]: 'Role name must be at most 50 characters long',
  [ErrorCode.ROLE_NAME_INVALID_FORMAT]: 'Role name must start with a letter and contain only lowercase letters, numbers, and underscores',
  [ErrorCode.ROLE_RESERVED_NAME]: 'Cannot create a role with the reserved name "admin"',
  [ErrorCode.ROLE_ONLY_ADMIN_SYSTEM]: 'Only "admin" can be created as a system role',
  [ErrorCode.ROLE_CANNOT_RENAME_SYSTEM]: 'Cannot rename system roles',
  [ErrorCode.ROLE_CANNOT_RENAME_TO_ADMIN]: 'Cannot rename to the reserved name "admin"',
  [ErrorCode.ROLE_ALREADY_HAS_PERMISSION]: 'Role already has permission',
  [ErrorCode.ROLE_DOES_NOT_HAVE_PERMISSION]: 'Role does not have permission',
  [ErrorCode.ROLE_NOT_FOUND]: 'Role not found',
  [ErrorCode.ROLE_CANNOT_REMOVE_LAST]: 'Cannot remove the last role from user',
  [ErrorCode.ROLE_CANNOT_DELETE_SYSTEM]: 'Cannot delete system role',

  // OAuth
  [ErrorCode.OAUTH_UNSUPPORTED_PROVIDER]: 'Unsupported OAuth provider',
  [ErrorCode.OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER]: 'Cannot update profile with different provider',
  [ErrorCode.OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER_ID]: 'Cannot update profile with different provider user ID',
  [ErrorCode.OAUTH_USER_ID_REQUIRED]: 'User ID is required',
  [ErrorCode.OAUTH_PROFILE_REQUIRED]: 'OAuth profile is required',
  [ErrorCode.OAUTH_PROVIDER_REQUIRED]: 'Provider is required',
  [ErrorCode.OAUTH_PROVIDER_LOCAL_NOT_ALLOWED]: 'OAuthProfile cannot be created for local authentication',
  [ErrorCode.OAUTH_PROVIDER_USER_ID_REQUIRED]: 'Provider user ID is required',
  [ErrorCode.OAUTH_INVALID_EMAIL_FORMAT]: 'Invalid email format',
  [ErrorCode.OAUTH_INVALID_AVATAR_URL]: 'Invalid avatar URL format',
  [ErrorCode.OAUTH_PLACEHOLDER_EMAIL_FAILED]: 'Failed to generate placeholder email',
  [ErrorCode.OAUTH_PASSWORD_GENERATION_FAILED]: 'Failed to generate secure password',
  [ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED]: 'OAuth provider is not configured',
  [ErrorCode.OAUTH_AUTHORIZATION_URL_FAILED]: 'Failed to generate authorization URL',
  [ErrorCode.OAUTH_CODE_EXCHANGE_FAILED]: 'Failed to exchange code for tokens',
  [ErrorCode.OAUTH_TOKEN_REFRESH_FAILED]: 'Failed to refresh token',
  [ErrorCode.OAUTH_FACEBOOK_NO_REFRESH]: 'Facebook does not support token refresh',
  [ErrorCode.OAUTH_USER_INFO_FAILED]: 'Failed to fetch user information',
  [ErrorCode.OAUTH_NO_ID_TOKEN]: 'OAuth provider did not return an ID token',
  [ErrorCode.OAUTH_APPLE_REFRESH_NOT_SUPPORTED]: 'Apple token refresh is not supported through this service',
  [ErrorCode.OAUTH_INVALID_JWT_FORMAT]: 'Invalid JWT format',

  // Auth Provider
  [ErrorCode.AUTH_PROVIDER_EMPTY]: 'Provider name cannot be empty',
  [ErrorCode.AUTH_PROVIDER_INVALID]: 'Invalid provider',

  // Permission
  [ErrorCode.PERMISSION_EMPTY]: 'Permission cannot be empty',
  [ErrorCode.PERMISSION_INVALID_FORMAT]: 'Permission must be in format resource:action (e.g., users:read)',
  [ErrorCode.PERMISSION_RESOURCE_EMPTY]: 'Resource cannot be empty',
  [ErrorCode.PERMISSION_ACTION_EMPTY]: 'Action cannot be empty',
  [ErrorCode.PERMISSION_RESOURCE_INVALID_FORMAT]: 'Resource must start with a letter and contain only lowercase letters, numbers, and underscores',
  [ErrorCode.PERMISSION_ACTION_INVALID_FORMAT]: 'Action must start with a letter and contain only lowercase letters, numbers, and underscores (or use * for wildcard)',

  // Refresh Token
  [ErrorCode.REFRESH_TOKEN_INVALID_FORMAT]: 'Invalid refresh token format',

  // Infrastructure/Mapper
  [ErrorCode.MAPPER_INVALID_USER_ID]: 'Invalid user ID from database',
  [ErrorCode.MAPPER_INVALID_EMAIL]: 'Invalid email from database',
  [ErrorCode.MAPPER_INVALID_PASSWORD_HASH]: 'Invalid password hash from database',
  [ErrorCode.MAPPER_INVALID_OAUTH_CONNECTION_ID]: 'Invalid OAuth connection ID from database',
  [ErrorCode.MAPPER_INVALID_PROVIDER]: 'Invalid provider from database',

  // Password Hasher
  [ErrorCode.PASSWORD_TOO_SHORT_FOR_HASH]: 'Password must be at least 6 characters long',

  // Course
  [ErrorCode.INVALID_COURSE_ID]: 'Invalid course ID',
  [ErrorCode.COURSE_NOT_FOUND]: 'Course not found',
  [ErrorCode.COURSE_ALREADY_PUBLISHED]: 'Course is already published',
  [ErrorCode.COURSE_NOT_PUBLISHED]: 'Course is not published',
  [ErrorCode.COURSE_ALREADY_ARCHIVED]: 'Course is already archived',
  [ErrorCode.COURSE_CANNOT_ARCHIVE_DRAFT]: 'Cannot archive a draft course',
  [ErrorCode.COURSE_CANNOT_PUBLISH_WITHOUT_MODULES]: 'Cannot publish a course without modules containing lessons and sections',
  [ErrorCode.COURSE_TITLE_EMPTY]: 'Course title cannot be empty',
  [ErrorCode.COURSE_TITLE_TOO_SHORT]: 'Course title must be at least 3 characters',
  [ErrorCode.COURSE_TITLE_TOO_LONG]: 'Course title must be at most 200 characters',
  [ErrorCode.COURSE_DESCRIPTION_TOO_LONG]: 'Course description must be at most 2000 characters',

  // Slug
  [ErrorCode.SLUG_EMPTY]: 'Slug cannot be empty',
  [ErrorCode.SLUG_TOO_SHORT]: 'Slug must be at least 3 characters',
  [ErrorCode.SLUG_TOO_LONG]: 'Slug must be at most 100 characters',
  [ErrorCode.SLUG_INVALID_FORMAT]: 'Slug must contain only lowercase letters, numbers, and hyphens',
  [ErrorCode.SLUG_ALREADY_EXISTS]: 'A course with this slug already exists',

  // Module
  [ErrorCode.INVALID_MODULE_ID]: 'Invalid module ID',
  [ErrorCode.MODULE_NOT_FOUND]: 'Module not found',
  [ErrorCode.MODULE_TITLE_EMPTY]: 'Module title cannot be empty',
  [ErrorCode.MODULE_TITLE_TOO_LONG]: 'Module title must be at most 200 characters',
  [ErrorCode.MODULE_ALREADY_IN_COURSE]: 'Module is already in this course',
  [ErrorCode.MODULE_ORDER_INVALID]: 'Invalid module order',
  [ErrorCode.MODULE_CANNOT_DELETE_WITH_LESSONS]: 'Cannot delete a module that has lessons',

  // Lesson
  [ErrorCode.INVALID_LESSON_ID]: 'Invalid lesson ID',
  [ErrorCode.LESSON_NOT_FOUND]: 'Lesson not found',
  [ErrorCode.LESSON_TITLE_EMPTY]: 'Lesson title cannot be empty',
  [ErrorCode.LESSON_TITLE_TOO_LONG]: 'Lesson title must be at most 200 characters',
  [ErrorCode.LESSON_SLUG_EMPTY]: 'Lesson slug cannot be empty',
  [ErrorCode.LESSON_CONTENT_EMPTY]: 'Lesson content cannot be empty',
  [ErrorCode.LESSON_ALREADY_IN_MODULE]: 'Lesson is already in this module',
  [ErrorCode.LESSON_ORDER_INVALID]: 'Invalid lesson order',
  [ErrorCode.LESSON_CANNOT_MODIFY_PUBLISHED]: 'Cannot modify lessons of a published course',

  // Section
  [ErrorCode.INVALID_SECTION_ID]: 'Invalid section ID',
  [ErrorCode.SECTION_NOT_FOUND]: 'Section not found',
  [ErrorCode.SECTION_TITLE_EMPTY]: 'Section title cannot be empty',
  [ErrorCode.SECTION_TITLE_TOO_LONG]: 'Section title must be at most 200 characters',
  [ErrorCode.SECTION_ALREADY_IN_LESSON]: 'Section is already in this lesson',
  [ErrorCode.SECTION_ORDER_INVALID]: 'Invalid section order',
  [ErrorCode.SECTION_INVALID_CONTENT_TYPE]: 'Invalid section content type',

  // Section Progress
  [ErrorCode.INVALID_SECTION_PROGRESS_ID]: 'Invalid section progress ID',
  [ErrorCode.SECTION_PROGRESS_NOT_FOUND]: 'Section progress not found',
  [ErrorCode.SECTION_PROGRESS_ALREADY_COMPLETED]: 'Section is already completed',

  // Enrollment
  [ErrorCode.INVALID_ENROLLMENT_ID]: 'Invalid enrollment ID',
  [ErrorCode.ENROLLMENT_NOT_FOUND]: 'Enrollment not found',
  [ErrorCode.ENROLLMENT_ALREADY_EXISTS]: 'Student is already enrolled in this course',
  [ErrorCode.ENROLLMENT_COURSE_NOT_PUBLISHED]: 'Cannot enroll in an unpublished course',
  [ErrorCode.ENROLLMENT_ALREADY_CANCELLED]: 'Enrollment is already cancelled',
  [ErrorCode.ENROLLMENT_ALREADY_COMPLETED]: 'Enrollment is already completed',
  [ErrorCode.ENROLLMENT_NOT_ACTIVE]: 'Enrollment is not active',

  // Lesson Progress
  [ErrorCode.PROGRESS_NOT_FOUND]: 'Lesson progress not found',
  [ErrorCode.PROGRESS_ALREADY_COMPLETED]: 'Lesson is already completed',
  [ErrorCode.PROGRESS_INVALID_WATCH_TIME]: 'Invalid watch time',

  // LessonBundle
  [ErrorCode.INVALID_LESSON_BUNDLE_ID]: 'Invalid lesson bundle ID',
  [ErrorCode.BUNDLE_VERSION_INVALID]: 'Bundle version must be a positive integer',
  [ErrorCode.BUNDLE_STORAGE_PATH_EMPTY]: 'Bundle storage path cannot be empty',
  [ErrorCode.BUNDLE_NOT_FOUND]: 'Bundle not found',
  [ErrorCode.BUNDLE_ALREADY_ACTIVE]: 'Bundle is already active',
  [ErrorCode.BUNDLE_UPLOAD_FAILED]: 'Failed to upload bundle',
  [ErrorCode.BUNDLE_MANIFEST_INVALID]: 'Invalid bundle manifest',
  [ErrorCode.CANNOT_DELETE_ACTIVE_BUNDLE]: 'Cannot delete an active bundle',
  [ErrorCode.BUNDLE_ENTRYPOINT_NOT_FOUND]: 'Bundle entrypoint file not found',

  // SectionBundle
  [ErrorCode.INVALID_SECTION_BUNDLE_ID]: 'Invalid section bundle ID',
  [ErrorCode.SECTION_BUNDLE_NOT_FOUND]: 'Section bundle not found',
  [ErrorCode.SECTION_BUNDLE_ALREADY_ACTIVE]: 'Section bundle is already active',
  [ErrorCode.CANNOT_DELETE_ACTIVE_SECTION_BUNDLE]: 'Cannot delete an active section bundle',

  // Category
  [ErrorCode.INVALID_CATEGORY_ID]: 'Invalid category ID',
  [ErrorCode.CATEGORY_NOT_FOUND]: 'Category not found',
  [ErrorCode.CATEGORY_NAME_EMPTY]: 'Category name cannot be empty',
  [ErrorCode.CATEGORY_NAME_TOO_LONG]: 'Category name must be at most 100 characters',
  [ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS]: 'A category with this slug already exists',
  [ErrorCode.CATEGORY_HAS_COURSES]: 'Cannot delete category that has courses',

  // LLM Manufacturer
  [ErrorCode.INVALID_MANUFACTURER_ID]: 'Invalid manufacturer ID',
  [ErrorCode.MANUFACTURER_NOT_FOUND]: 'LLM manufacturer not found',
  [ErrorCode.MANUFACTURER_NAME_EMPTY]: 'Manufacturer name cannot be empty',
  [ErrorCode.MANUFACTURER_NAME_TOO_LONG]: 'Manufacturer name must be at most 100 characters',
  [ErrorCode.MANUFACTURER_SLUG_EMPTY]: 'Manufacturer slug cannot be empty',
  [ErrorCode.MANUFACTURER_SLUG_ALREADY_EXISTS]: 'A manufacturer with this slug already exists',
  [ErrorCode.MANUFACTURER_HAS_MODELS]: 'Cannot delete manufacturer that has models',

  // LLM Model
  [ErrorCode.INVALID_LLM_MODEL_ID]: 'Invalid LLM model ID',
  [ErrorCode.LLM_MODEL_NOT_FOUND]: 'LLM model not found',
  [ErrorCode.LLM_MODEL_NAME_EMPTY]: 'LLM model name cannot be empty',
  [ErrorCode.LLM_MODEL_NAME_TOO_LONG]: 'LLM model name must be at most 200 characters',
  [ErrorCode.LLM_MODEL_TECHNICAL_NAME_EMPTY]: 'LLM model technical name cannot be empty',
  [ErrorCode.LLM_MODEL_TECHNICAL_NAME_ALREADY_EXISTS]: 'An LLM model with this technical name already exists',
  [ErrorCode.NO_DEFAULT_LLM_MODEL]: 'No default LLM model configured',

  // Exercise Verification
  [ErrorCode.SECTION_NOT_EXERCISE]: 'Section is not an exercise',
  [ErrorCode.EXERCISE_VERIFICATION_FAILED]: 'Exercise verification failed',

  // Certificate
  [ErrorCode.INVALID_CERTIFICATE_ID]: 'Invalid certificate ID',
  [ErrorCode.CERTIFICATE_NOT_FOUND]: 'Certificate not found',

  // Calendar Event
  [ErrorCode.INVALID_CALENDAR_EVENT_ID]: 'Invalid calendar event ID',
  [ErrorCode.CALENDAR_EVENT_NOT_FOUND]: 'Calendar event not found',
  [ErrorCode.CALENDAR_EVENT_TITLE_EMPTY]: 'Calendar event title cannot be empty',
  [ErrorCode.CALENDAR_EVENT_TITLE_TOO_LONG]: 'Calendar event title must be at most 200 characters',
  [ErrorCode.CALENDAR_EVENT_INVALID_TYPE]: 'Invalid calendar event type',
};

/**
 * Get error message by code (legacy - uses English)
 * @deprecated Use getLocalizedErrorMessage with TranslationFunctions for i18n support
 */
export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] ?? ErrorMessages[ErrorCode.INTERNAL_ERROR];
}

/**
 * Maps ErrorCode to translation function
 * Each error code is mapped to its corresponding i18n translation path
 */
const errorCodeToTranslation: Record<ErrorCode, (t: TranslationFunctions) => string> = {
  // Generic errors
  [ErrorCode.INTERNAL_ERROR]: (t) => t.common.internalError(),
  [ErrorCode.VALIDATION_ERROR]: (t) => t.common.validationError(),
  [ErrorCode.NOT_FOUND]: (t) => t.common.notFound(),
  [ErrorCode.CONFLICT]: (t) => t.common.conflict(),
  [ErrorCode.UNAUTHORIZED]: (t) => t.common.unauthorized(),
  [ErrorCode.FORBIDDEN]: (t) => t.common.forbidden(),

  // User/Auth errors
  [ErrorCode.INVALID_EMAIL_FORMAT]: (t) => t.auth.email.invalidFormat(),
  [ErrorCode.EMAIL_TOO_LONG]: (t) => t.auth.email.tooLong(),
  [ErrorCode.USER_ALREADY_EXISTS]: (t) => t.auth.user.alreadyExists(),
  [ErrorCode.USER_NOT_FOUND]: (t) => t.auth.user.notFound(),
  [ErrorCode.INVALID_PASSWORD]: (t) => t.auth.password.invalid(),
  [ErrorCode.PASSWORD_REQUIRED]: (t) => t.auth.password.required(),
  [ErrorCode.PASSWORD_TOO_SHORT]: (t) => t.auth.password.tooShort({ minLength: 8 }),
  [ErrorCode.PASSWORD_TOO_LONG]: (t) => t.auth.password.tooLong({ maxLength: 128 }),
  [ErrorCode.PASSWORD_NEEDS_UPPERCASE]: (t) => t.auth.password.needsUppercase(),
  [ErrorCode.PASSWORD_NEEDS_LOWERCASE]: (t) => t.auth.password.needsLowercase(),
  [ErrorCode.PASSWORD_NEEDS_NUMBER]: (t) => t.auth.password.needsNumber(),
  [ErrorCode.PASSWORD_NEEDS_SPECIAL]: (t) => t.auth.password.needsSpecial(),
  [ErrorCode.PASSWORD_TOO_COMMON]: (t) => t.auth.password.tooCommon(),
  [ErrorCode.PASSWORD_HASH_FAILED]: (t) => t.auth.password.hashFailed(),
  [ErrorCode.INVALID_PASSWORD_HASH]: (t) => t.auth.password.hashInvalid(),
  [ErrorCode.PASSWORD_HASH_EMPTY]: (t) => t.auth.password.hashEmpty(),
  [ErrorCode.SAVE_USER_FAILED]: (t) => t.auth.user.saveFailed(),
  [ErrorCode.USER_ALREADY_HAS_ROLE]: (t) => t.auth.role.alreadyHas({ role: '' }),
  [ErrorCode.USER_DOES_NOT_HAVE_ROLE]: (t) => t.auth.role.notHas({ role: '' }),
  [ErrorCode.USER_ALREADY_HAS_PERMISSION]: (t) => t.auth.permission.userAlreadyHas({ permission: '' }),
  [ErrorCode.USER_DOES_NOT_HAVE_PERMISSION]: (t) => t.auth.permission.userNotHas({ permission: '' }),

  // Profile management errors (fallback to English until i18n is added)
  [ErrorCode.CURRENT_PASSWORD_INCORRECT]: () => ErrorMessages[ErrorCode.CURRENT_PASSWORD_INCORRECT],
  [ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT]: () => ErrorMessages[ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT],
  [ErrorCode.PHOTO_UPLOAD_FAILED]: () => ErrorMessages[ErrorCode.PHOTO_UPLOAD_FAILED],
  [ErrorCode.PHOTO_INVALID_TYPE]: () => ErrorMessages[ErrorCode.PHOTO_INVALID_TYPE],
  [ErrorCode.PHOTO_TOO_LARGE]: () => ErrorMessages[ErrorCode.PHOTO_TOO_LARGE],
  [ErrorCode.ACCOUNT_DELETION_REQUIRES_PASSWORD]: () => ErrorMessages[ErrorCode.ACCOUNT_DELETION_REQUIRES_PASSWORD],

  // ID errors
  [ErrorCode.INVALID_UUID_FORMAT]: (t) => t.id.invalidUuid(),
  [ErrorCode.INVALID_USER_ID]: (t) => t.id.invalidUserId(),
  [ErrorCode.INVALID_ROLE_ID]: (t) => t.id.invalidRoleId(),
  [ErrorCode.INVALID_PERMISSION_ID]: (t) => t.id.invalidPermissionId(),
  [ErrorCode.INVALID_OAUTH_CONNECTION_ID]: (t) => t.id.invalidOAuthConnectionId(),

  // Role errors
  [ErrorCode.ROLE_NAME_REQUIRED]: (t) => t.auth.role.nameRequired(),
  [ErrorCode.ROLE_NAME_TOO_SHORT]: (t) => t.auth.role.nameTooShort({ minLength: 2 }),
  [ErrorCode.ROLE_NAME_TOO_LONG]: (t) => t.auth.role.nameTooLong({ maxLength: 50 }),
  [ErrorCode.ROLE_NAME_INVALID_FORMAT]: (t) => t.auth.role.invalidFormat(),
  [ErrorCode.ROLE_RESERVED_NAME]: (t) => t.auth.role.reservedName(),
  [ErrorCode.ROLE_ONLY_ADMIN_SYSTEM]: (t) => t.auth.role.onlyAdminSystem(),
  [ErrorCode.ROLE_CANNOT_RENAME_SYSTEM]: (t) => t.auth.role.cannotRenameSystem(),
  [ErrorCode.ROLE_CANNOT_RENAME_TO_ADMIN]: (t) => t.auth.role.cannotRenameToAdmin(),
  [ErrorCode.ROLE_ALREADY_HAS_PERMISSION]: (t) => t.auth.role.alreadyHasPermission({ permission: '' }),
  [ErrorCode.ROLE_DOES_NOT_HAVE_PERMISSION]: (t) => t.auth.role.doesNotHavePermission({ permission: '' }),
  [ErrorCode.ROLE_NOT_FOUND]: (t) => t.auth.role.notFound(),
  [ErrorCode.ROLE_CANNOT_REMOVE_LAST]: (t) => t.auth.role.cannotRemoveLast(),
  [ErrorCode.ROLE_CANNOT_DELETE_SYSTEM]: (t) => t.auth.role.cannotDeleteSystem(),

  // OAuth errors
  [ErrorCode.OAUTH_UNSUPPORTED_PROVIDER]: (t) => t.auth.oauth.unsupportedProvider({ provider: '' }),
  [ErrorCode.OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER]: (t) => t.auth.oauth.cannotUpdateDifferentProvider(),
  [ErrorCode.OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER_ID]: (t) => t.auth.oauth.cannotUpdateDifferentProviderId(),
  [ErrorCode.OAUTH_USER_ID_REQUIRED]: (t) => t.auth.oauth.userIdRequired(),
  [ErrorCode.OAUTH_PROFILE_REQUIRED]: (t) => t.auth.oauth.profileRequired(),
  [ErrorCode.OAUTH_PROVIDER_REQUIRED]: (t) => t.auth.oauth.providerRequired(),
  [ErrorCode.OAUTH_PROVIDER_LOCAL_NOT_ALLOWED]: (t) => t.auth.oauth.providerLocalNotAllowed(),
  [ErrorCode.OAUTH_PROVIDER_USER_ID_REQUIRED]: (t) => t.auth.oauth.providerUserIdRequired(),
  [ErrorCode.OAUTH_INVALID_EMAIL_FORMAT]: (t) => t.auth.oauth.invalidEmailFormat(),
  [ErrorCode.OAUTH_INVALID_AVATAR_URL]: (t) => t.auth.oauth.invalidAvatarUrl(),
  [ErrorCode.OAUTH_PLACEHOLDER_EMAIL_FAILED]: (t) => t.auth.oauth.placeholderEmailFailed(),
  [ErrorCode.OAUTH_PASSWORD_GENERATION_FAILED]: (t) => t.auth.oauth.passwordGenerationFailed(),
  [ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED]: (t) => t.auth.oauth.providerNotConfigured(),
  [ErrorCode.OAUTH_AUTHORIZATION_URL_FAILED]: (t) => t.auth.oauth.authorizationUrlFailed(),
  [ErrorCode.OAUTH_CODE_EXCHANGE_FAILED]: (t) => t.auth.oauth.codeExchangeFailed(),
  [ErrorCode.OAUTH_TOKEN_REFRESH_FAILED]: (t) => t.auth.oauth.tokenRefreshFailed(),
  [ErrorCode.OAUTH_FACEBOOK_NO_REFRESH]: (t) => t.auth.oauth.facebookNoRefresh(),
  [ErrorCode.OAUTH_USER_INFO_FAILED]: (t) => t.auth.oauth.userInfoFailed(),
  [ErrorCode.OAUTH_NO_ID_TOKEN]: (t) => t.auth.oauth.noIdToken(),
  [ErrorCode.OAUTH_APPLE_REFRESH_NOT_SUPPORTED]: (t) => t.auth.oauth.appleRefreshNotSupported(),
  [ErrorCode.OAUTH_INVALID_JWT_FORMAT]: (t) => t.auth.oauth.invalidJwtFormat(),

  // Auth Provider errors
  [ErrorCode.AUTH_PROVIDER_EMPTY]: (t) => t.auth.provider.empty(),
  [ErrorCode.AUTH_PROVIDER_INVALID]: (t) => t.auth.provider.invalid({ value: '', supported: '' }),

  // Permission errors
  [ErrorCode.PERMISSION_EMPTY]: (t) => t.permission.empty(),
  [ErrorCode.PERMISSION_INVALID_FORMAT]: (t) => t.permission.invalidFormat(),
  [ErrorCode.PERMISSION_RESOURCE_EMPTY]: (t) => t.permission.resourceEmpty(),
  [ErrorCode.PERMISSION_ACTION_EMPTY]: (t) => t.permission.actionEmpty(),
  [ErrorCode.PERMISSION_RESOURCE_INVALID_FORMAT]: (t) => t.permission.resourceInvalidFormat(),
  [ErrorCode.PERMISSION_ACTION_INVALID_FORMAT]: (t) => t.permission.actionInvalidFormat(),

  // Refresh Token errors
  [ErrorCode.REFRESH_TOKEN_INVALID_FORMAT]: (t) => t.refreshToken.invalidFormat(),

  // Infrastructure/Mapper errors
  [ErrorCode.MAPPER_INVALID_USER_ID]: (t) => t.mapper.invalidUserId(),
  [ErrorCode.MAPPER_INVALID_EMAIL]: (t) => t.mapper.invalidEmail(),
  [ErrorCode.MAPPER_INVALID_PASSWORD_HASH]: (t) => t.mapper.invalidPasswordHash(),
  [ErrorCode.MAPPER_INVALID_OAUTH_CONNECTION_ID]: (t) => t.mapper.invalidOAuthConnectionId(),
  [ErrorCode.MAPPER_INVALID_PROVIDER]: (t) => t.mapper.invalidProvider(),

  // Password Hasher errors
  [ErrorCode.PASSWORD_TOO_SHORT_FOR_HASH]: (t) => t.auth.password.tooShortForHash(),

  // Course errors (fallback to English until i18n is added)
  [ErrorCode.INVALID_COURSE_ID]: () => ErrorMessages[ErrorCode.INVALID_COURSE_ID],
  [ErrorCode.COURSE_NOT_FOUND]: () => ErrorMessages[ErrorCode.COURSE_NOT_FOUND],
  [ErrorCode.COURSE_ALREADY_PUBLISHED]: () => ErrorMessages[ErrorCode.COURSE_ALREADY_PUBLISHED],
  [ErrorCode.COURSE_NOT_PUBLISHED]: () => ErrorMessages[ErrorCode.COURSE_NOT_PUBLISHED],
  [ErrorCode.COURSE_ALREADY_ARCHIVED]: () => ErrorMessages[ErrorCode.COURSE_ALREADY_ARCHIVED],
  [ErrorCode.COURSE_CANNOT_ARCHIVE_DRAFT]: () => ErrorMessages[ErrorCode.COURSE_CANNOT_ARCHIVE_DRAFT],
  [ErrorCode.COURSE_CANNOT_PUBLISH_WITHOUT_MODULES]: () => ErrorMessages[ErrorCode.COURSE_CANNOT_PUBLISH_WITHOUT_MODULES],
  [ErrorCode.COURSE_TITLE_EMPTY]: () => ErrorMessages[ErrorCode.COURSE_TITLE_EMPTY],
  [ErrorCode.COURSE_TITLE_TOO_SHORT]: () => ErrorMessages[ErrorCode.COURSE_TITLE_TOO_SHORT],
  [ErrorCode.COURSE_TITLE_TOO_LONG]: () => ErrorMessages[ErrorCode.COURSE_TITLE_TOO_LONG],
  [ErrorCode.COURSE_DESCRIPTION_TOO_LONG]: () => ErrorMessages[ErrorCode.COURSE_DESCRIPTION_TOO_LONG],

  // Slug errors
  [ErrorCode.SLUG_EMPTY]: () => ErrorMessages[ErrorCode.SLUG_EMPTY],
  [ErrorCode.SLUG_TOO_SHORT]: () => ErrorMessages[ErrorCode.SLUG_TOO_SHORT],
  [ErrorCode.SLUG_TOO_LONG]: () => ErrorMessages[ErrorCode.SLUG_TOO_LONG],
  [ErrorCode.SLUG_INVALID_FORMAT]: () => ErrorMessages[ErrorCode.SLUG_INVALID_FORMAT],
  [ErrorCode.SLUG_ALREADY_EXISTS]: () => ErrorMessages[ErrorCode.SLUG_ALREADY_EXISTS],

  // Module errors
  [ErrorCode.INVALID_MODULE_ID]: () => ErrorMessages[ErrorCode.INVALID_MODULE_ID],
  [ErrorCode.MODULE_NOT_FOUND]: () => ErrorMessages[ErrorCode.MODULE_NOT_FOUND],
  [ErrorCode.MODULE_TITLE_EMPTY]: () => ErrorMessages[ErrorCode.MODULE_TITLE_EMPTY],
  [ErrorCode.MODULE_TITLE_TOO_LONG]: () => ErrorMessages[ErrorCode.MODULE_TITLE_TOO_LONG],
  [ErrorCode.MODULE_ALREADY_IN_COURSE]: () => ErrorMessages[ErrorCode.MODULE_ALREADY_IN_COURSE],
  [ErrorCode.MODULE_ORDER_INVALID]: () => ErrorMessages[ErrorCode.MODULE_ORDER_INVALID],
  [ErrorCode.MODULE_CANNOT_DELETE_WITH_LESSONS]: () => ErrorMessages[ErrorCode.MODULE_CANNOT_DELETE_WITH_LESSONS],

  // Lesson errors
  [ErrorCode.INVALID_LESSON_ID]: () => ErrorMessages[ErrorCode.INVALID_LESSON_ID],
  [ErrorCode.LESSON_NOT_FOUND]: () => ErrorMessages[ErrorCode.LESSON_NOT_FOUND],
  [ErrorCode.LESSON_TITLE_EMPTY]: () => ErrorMessages[ErrorCode.LESSON_TITLE_EMPTY],
  [ErrorCode.LESSON_TITLE_TOO_LONG]: () => ErrorMessages[ErrorCode.LESSON_TITLE_TOO_LONG],
  [ErrorCode.LESSON_SLUG_EMPTY]: () => ErrorMessages[ErrorCode.LESSON_SLUG_EMPTY],
  [ErrorCode.LESSON_CONTENT_EMPTY]: () => ErrorMessages[ErrorCode.LESSON_CONTENT_EMPTY],
  [ErrorCode.LESSON_ALREADY_IN_MODULE]: () => ErrorMessages[ErrorCode.LESSON_ALREADY_IN_MODULE],
  [ErrorCode.LESSON_ORDER_INVALID]: () => ErrorMessages[ErrorCode.LESSON_ORDER_INVALID],
  [ErrorCode.LESSON_CANNOT_MODIFY_PUBLISHED]: () => ErrorMessages[ErrorCode.LESSON_CANNOT_MODIFY_PUBLISHED],

  // Section errors
  [ErrorCode.INVALID_SECTION_ID]: () => ErrorMessages[ErrorCode.INVALID_SECTION_ID],
  [ErrorCode.SECTION_NOT_FOUND]: () => ErrorMessages[ErrorCode.SECTION_NOT_FOUND],
  [ErrorCode.SECTION_TITLE_EMPTY]: () => ErrorMessages[ErrorCode.SECTION_TITLE_EMPTY],
  [ErrorCode.SECTION_TITLE_TOO_LONG]: () => ErrorMessages[ErrorCode.SECTION_TITLE_TOO_LONG],
  [ErrorCode.SECTION_ALREADY_IN_LESSON]: () => ErrorMessages[ErrorCode.SECTION_ALREADY_IN_LESSON],
  [ErrorCode.SECTION_ORDER_INVALID]: () => ErrorMessages[ErrorCode.SECTION_ORDER_INVALID],
  [ErrorCode.SECTION_INVALID_CONTENT_TYPE]: () => ErrorMessages[ErrorCode.SECTION_INVALID_CONTENT_TYPE],

  // Section Progress errors
  [ErrorCode.INVALID_SECTION_PROGRESS_ID]: () => ErrorMessages[ErrorCode.INVALID_SECTION_PROGRESS_ID],
  [ErrorCode.SECTION_PROGRESS_NOT_FOUND]: () => ErrorMessages[ErrorCode.SECTION_PROGRESS_NOT_FOUND],
  [ErrorCode.SECTION_PROGRESS_ALREADY_COMPLETED]: () => ErrorMessages[ErrorCode.SECTION_PROGRESS_ALREADY_COMPLETED],

  // Enrollment errors
  [ErrorCode.INVALID_ENROLLMENT_ID]: () => ErrorMessages[ErrorCode.INVALID_ENROLLMENT_ID],
  [ErrorCode.ENROLLMENT_NOT_FOUND]: () => ErrorMessages[ErrorCode.ENROLLMENT_NOT_FOUND],
  [ErrorCode.ENROLLMENT_ALREADY_EXISTS]: () => ErrorMessages[ErrorCode.ENROLLMENT_ALREADY_EXISTS],
  [ErrorCode.ENROLLMENT_COURSE_NOT_PUBLISHED]: () => ErrorMessages[ErrorCode.ENROLLMENT_COURSE_NOT_PUBLISHED],
  [ErrorCode.ENROLLMENT_ALREADY_CANCELLED]: () => ErrorMessages[ErrorCode.ENROLLMENT_ALREADY_CANCELLED],
  [ErrorCode.ENROLLMENT_ALREADY_COMPLETED]: () => ErrorMessages[ErrorCode.ENROLLMENT_ALREADY_COMPLETED],
  [ErrorCode.ENROLLMENT_NOT_ACTIVE]: () => ErrorMessages[ErrorCode.ENROLLMENT_NOT_ACTIVE],

  // Lesson Progress errors
  [ErrorCode.PROGRESS_NOT_FOUND]: () => ErrorMessages[ErrorCode.PROGRESS_NOT_FOUND],
  [ErrorCode.PROGRESS_ALREADY_COMPLETED]: () => ErrorMessages[ErrorCode.PROGRESS_ALREADY_COMPLETED],
  [ErrorCode.PROGRESS_INVALID_WATCH_TIME]: () => ErrorMessages[ErrorCode.PROGRESS_INVALID_WATCH_TIME],

  // LessonBundle errors
  [ErrorCode.INVALID_LESSON_BUNDLE_ID]: () => ErrorMessages[ErrorCode.INVALID_LESSON_BUNDLE_ID],
  [ErrorCode.BUNDLE_VERSION_INVALID]: () => ErrorMessages[ErrorCode.BUNDLE_VERSION_INVALID],
  [ErrorCode.BUNDLE_STORAGE_PATH_EMPTY]: () => ErrorMessages[ErrorCode.BUNDLE_STORAGE_PATH_EMPTY],
  [ErrorCode.BUNDLE_NOT_FOUND]: () => ErrorMessages[ErrorCode.BUNDLE_NOT_FOUND],
  [ErrorCode.BUNDLE_ALREADY_ACTIVE]: () => ErrorMessages[ErrorCode.BUNDLE_ALREADY_ACTIVE],
  [ErrorCode.BUNDLE_UPLOAD_FAILED]: () => ErrorMessages[ErrorCode.BUNDLE_UPLOAD_FAILED],
  [ErrorCode.BUNDLE_MANIFEST_INVALID]: () => ErrorMessages[ErrorCode.BUNDLE_MANIFEST_INVALID],
  [ErrorCode.CANNOT_DELETE_ACTIVE_BUNDLE]: () => ErrorMessages[ErrorCode.CANNOT_DELETE_ACTIVE_BUNDLE],
  [ErrorCode.BUNDLE_ENTRYPOINT_NOT_FOUND]: () => ErrorMessages[ErrorCode.BUNDLE_ENTRYPOINT_NOT_FOUND],

  // SectionBundle errors
  [ErrorCode.INVALID_SECTION_BUNDLE_ID]: () => ErrorMessages[ErrorCode.INVALID_SECTION_BUNDLE_ID],
  [ErrorCode.SECTION_BUNDLE_NOT_FOUND]: () => ErrorMessages[ErrorCode.SECTION_BUNDLE_NOT_FOUND],
  [ErrorCode.SECTION_BUNDLE_ALREADY_ACTIVE]: () => ErrorMessages[ErrorCode.SECTION_BUNDLE_ALREADY_ACTIVE],
  [ErrorCode.CANNOT_DELETE_ACTIVE_SECTION_BUNDLE]: () => ErrorMessages[ErrorCode.CANNOT_DELETE_ACTIVE_SECTION_BUNDLE],

  // Category errors
  [ErrorCode.INVALID_CATEGORY_ID]: () => ErrorMessages[ErrorCode.INVALID_CATEGORY_ID],
  [ErrorCode.CATEGORY_NOT_FOUND]: () => ErrorMessages[ErrorCode.CATEGORY_NOT_FOUND],
  [ErrorCode.CATEGORY_NAME_EMPTY]: () => ErrorMessages[ErrorCode.CATEGORY_NAME_EMPTY],
  [ErrorCode.CATEGORY_NAME_TOO_LONG]: () => ErrorMessages[ErrorCode.CATEGORY_NAME_TOO_LONG],
  [ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS]: () => ErrorMessages[ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS],
  [ErrorCode.CATEGORY_HAS_COURSES]: () => ErrorMessages[ErrorCode.CATEGORY_HAS_COURSES],

  // LLM Manufacturer errors
  [ErrorCode.INVALID_MANUFACTURER_ID]: () => ErrorMessages[ErrorCode.INVALID_MANUFACTURER_ID],
  [ErrorCode.MANUFACTURER_NOT_FOUND]: () => ErrorMessages[ErrorCode.MANUFACTURER_NOT_FOUND],
  [ErrorCode.MANUFACTURER_NAME_EMPTY]: () => ErrorMessages[ErrorCode.MANUFACTURER_NAME_EMPTY],
  [ErrorCode.MANUFACTURER_NAME_TOO_LONG]: () => ErrorMessages[ErrorCode.MANUFACTURER_NAME_TOO_LONG],
  [ErrorCode.MANUFACTURER_SLUG_EMPTY]: () => ErrorMessages[ErrorCode.MANUFACTURER_SLUG_EMPTY],
  [ErrorCode.MANUFACTURER_SLUG_ALREADY_EXISTS]: () => ErrorMessages[ErrorCode.MANUFACTURER_SLUG_ALREADY_EXISTS],
  [ErrorCode.MANUFACTURER_HAS_MODELS]: () => ErrorMessages[ErrorCode.MANUFACTURER_HAS_MODELS],

  // LLM Model errors
  [ErrorCode.INVALID_LLM_MODEL_ID]: () => ErrorMessages[ErrorCode.INVALID_LLM_MODEL_ID],
  [ErrorCode.LLM_MODEL_NOT_FOUND]: () => ErrorMessages[ErrorCode.LLM_MODEL_NOT_FOUND],
  [ErrorCode.LLM_MODEL_NAME_EMPTY]: () => ErrorMessages[ErrorCode.LLM_MODEL_NAME_EMPTY],
  [ErrorCode.LLM_MODEL_NAME_TOO_LONG]: () => ErrorMessages[ErrorCode.LLM_MODEL_NAME_TOO_LONG],
  [ErrorCode.LLM_MODEL_TECHNICAL_NAME_EMPTY]: () => ErrorMessages[ErrorCode.LLM_MODEL_TECHNICAL_NAME_EMPTY],
  [ErrorCode.LLM_MODEL_TECHNICAL_NAME_ALREADY_EXISTS]: () => ErrorMessages[ErrorCode.LLM_MODEL_TECHNICAL_NAME_ALREADY_EXISTS],
  [ErrorCode.NO_DEFAULT_LLM_MODEL]: () => ErrorMessages[ErrorCode.NO_DEFAULT_LLM_MODEL],

  // Exercise Verification errors
  [ErrorCode.SECTION_NOT_EXERCISE]: () => ErrorMessages[ErrorCode.SECTION_NOT_EXERCISE],
  [ErrorCode.EXERCISE_VERIFICATION_FAILED]: () => ErrorMessages[ErrorCode.EXERCISE_VERIFICATION_FAILED],

  // Certificate errors
  [ErrorCode.INVALID_CERTIFICATE_ID]: () => ErrorMessages[ErrorCode.INVALID_CERTIFICATE_ID],
  [ErrorCode.CERTIFICATE_NOT_FOUND]: () => ErrorMessages[ErrorCode.CERTIFICATE_NOT_FOUND],

  // Calendar Event errors
  [ErrorCode.INVALID_CALENDAR_EVENT_ID]: () => ErrorMessages[ErrorCode.INVALID_CALENDAR_EVENT_ID],
  [ErrorCode.CALENDAR_EVENT_NOT_FOUND]: () => ErrorMessages[ErrorCode.CALENDAR_EVENT_NOT_FOUND],
  [ErrorCode.CALENDAR_EVENT_TITLE_EMPTY]: () => ErrorMessages[ErrorCode.CALENDAR_EVENT_TITLE_EMPTY],
  [ErrorCode.CALENDAR_EVENT_TITLE_TOO_LONG]: () => ErrorMessages[ErrorCode.CALENDAR_EVENT_TITLE_TOO_LONG],
  [ErrorCode.CALENDAR_EVENT_INVALID_TYPE]: () => ErrorMessages[ErrorCode.CALENDAR_EVENT_INVALID_TYPE],
};

/**
 * Get localized error message by code using translation functions
 *
 * @param code - The error code to translate
 * @param t - Translation functions from i18n context
 * @returns Localized error message
 *
 * @example
 * ```typescript
 * // In a handler with locale context
 * const message = getLocalizedErrorMessage(ErrorCode.USER_NOT_FOUND, ctx.t);
 * // Returns "Usuário não encontrado" for pt-BR or "User not found" for en-US
 * ```
 */
export function getLocalizedErrorMessage(code: ErrorCode, t: TranslationFunctions): string {
  const translator = errorCodeToTranslation[code];
  return translator ? translator(t) : t.common.internalError();
}

/**
 * Domain Error class
 * Structured error with code, message, and optional details
 */
export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message ?? ErrorMessages[code]);
    this.name = 'DomainError';
  }

  /**
   * Create error from code
   */
  static fromCode(code: ErrorCode, details?: Record<string, unknown>): DomainError {
    return new DomainError(code, undefined, details);
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}
