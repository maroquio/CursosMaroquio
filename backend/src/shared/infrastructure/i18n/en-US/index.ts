import type { Translation } from '../i18n-types.js';

const en_US = {
  // ============================================
  // Common/Generic Messages
  // ============================================
  common: {
    internalError: 'An internal error occurred',
    validationError: 'Validation error',
    notFound: 'Resource not found',
    conflict: 'Resource conflict',
    unauthorized: 'Unauthorized',
    forbidden: 'Access denied',
    success: 'Operation completed successfully',
    created: 'Resource created successfully',
    updated: 'Resource updated successfully',
    deleted: 'Resource deleted successfully',
    notImplemented: 'Feature not implemented',
  },

  // ============================================
  // Authentication Domain
  // ============================================
  auth: {
    // Email validation
    email: {
      invalidFormat: 'Invalid email format',
      tooLong: 'Email too long (max 254 characters)',
    },

    // Password validation
    password: {
      required: 'Password is required',
      tooShort: 'Password must be at least {minLength} characters',
      tooLong: 'Password must be at most {maxLength} characters',
      needsUppercase: 'Password must contain at least one uppercase letter',
      needsLowercase: 'Password must contain at least one lowercase letter',
      needsNumber: 'Password must contain at least one number',
      needsSpecial: 'Password must contain at least one special character',
      tooCommon: 'This password is too common',
      invalid: 'Invalid password',
      hashFailed: 'Failed to process password',
      hashEmpty: 'Password hash cannot be empty',
      hashInvalid: 'Invalid password hash format',
      tooShortForHash: 'Password must be at least 6 characters long',
    },

    // User messages
    user: {
      alreadyExists: 'User with this email already exists',
      notFound: 'User not found',
      saveFailed: 'Failed to save user',
      registeredSuccess: 'User registered successfully',
      loginSuccess: 'Login successful',
      logoutSuccess: 'Logged out successfully',
      profileUpdated: 'Profile updated successfully',
      doesNotHaveRole: 'User does not have role: {role}',
      doesNotHavePermission: 'User does not have individual permission: {permission}',
    },

    // Token messages
    token: {
      invalidFormat: 'Invalid token format',
      expired: 'Token expired or invalid',
      refreshSuccess: 'Token refreshed successfully',
      missing: 'Token not provided',
      malformed: 'Malformed token',
    },

    // Role messages
    role: {
      alreadyHas: 'User already has the role: {role}',
      notHas: 'User does not have the role: {role}',
      cannotRemoveLast: 'Cannot remove the last role from user',
      nameRequired: 'Role name cannot be empty',
      nameEmpty: 'Role name cannot be empty',
      nameTooShort: 'Role name must be at least {minLength} characters',
      nameTooLong: 'Role name must be at most {maxLength} characters',
      invalidFormat: 'Role name must start with a letter and contain only lowercase letters, numbers, and underscores',
      invalidChars: 'Role name can only contain letters, numbers, underscores, and hyphens',
      reservedName: 'Cannot create role with reserved name "admin"',
      onlyAdminSystem: 'Only "admin" can be created as a system role',
      cannotRenameToAdmin: 'Cannot rename to the reserved name "admin"',
      alreadyHasPermission: 'Role already has permission: {permission}',
      doesNotHavePermission: 'Role does not have permission: {permission}',
      alreadyExists: "Role '{name}' already exists",
      notFound: 'Role not found',
      deleted: 'Role deleted successfully',
      cannotRenameSystem: 'Cannot rename system roles',
      cannotDeleteSystem: 'System roles cannot be deleted',
      assigned: "Role '{role}' assigned to user successfully",
      removed: "Role '{role}' removed from user successfully",
      created: "Role '{name}' created successfully",
      updated: "Role '{name}' updated successfully",
    },

    // Permission messages
    permission: {
      alreadyHas: 'Already has the permission: {permission}',
      notHas: 'Does not have the permission: {permission}',
      notFound: "Permission '{permission}' not found",
      alreadyExists: "Permission '{permission}' already exists",
      invalidFormat: 'Invalid permission format. Use: resource:action',
      assigned: "Permission '{permission}' assigned successfully",
      removed: "Permission '{permission}' removed successfully",
      assignedToRole: "Permission '{permission}' assigned to role successfully",
      removedFromRole: "Permission '{permission}' removed from role successfully",
      assignedToUser: "Permission '{permission}' assigned to user successfully",
      removedFromUser: "Permission '{permission}' removed from user successfully",
      roleAlreadyHas: "Role '{role}' already has permission '{permission}'",
      roleNotHas: "Role '{role}' does not have permission '{permission}'",
      userAlreadyHas: "User already has individual permission '{permission}'",
      userNotHas: "User does not have individual permission '{permission}'",
    },

    // OAuth messages
    oauth: {
      unsupportedProvider: 'Unsupported OAuth provider: {provider}',
      notConfigured: 'OAuth {provider} is not configured',
      facebookNoRefresh: 'Facebook does not support token refresh',
      invalidEmail: 'Invalid email from OAuth provider: {email}',
      linkSuccess: '{provider} account linked successfully',
      unlinkSuccess: '{provider} account unlinked successfully',
      alreadyLinked: 'You already have a {provider} account linked',
      linkedToAnotherUser: 'This {provider} account is already linked to another user',
      notLinked: 'No {provider} account linked',
      cannotUnlinkOnlyMethod: 'Cannot unlink your only authentication method. Please link another provider or set a password first.',
      cannotUpdateDifferentProvider: 'Cannot update profile with different provider',
      cannotUpdateDifferentProviderId: 'Cannot update profile with different provider user ID',
      userIdRequired: 'User ID is required',
      profileRequired: 'OAuth profile is required',
      providerRequired: 'Provider is required',
      providerLocalNotAllowed: 'OAuthProfile cannot be created for local authentication',
      providerUserIdRequired: 'Provider user ID is required',
      invalidEmailFormat: 'Invalid email format',
      invalidAvatarUrl: 'Invalid avatar URL format',
      placeholderEmailFailed: 'Failed to generate placeholder email',
      passwordGenerationFailed: 'Failed to generate secure password',
      providerNotConfigured: 'OAuth provider is not configured',
      authorizationUrlFailed: 'Failed to generate authorization URL',
      codeExchangeFailed: 'Failed to exchange code for tokens',
      tokenRefreshFailed: 'Failed to refresh token',
      userInfoFailed: 'Failed to fetch user information',
      noIdToken: 'OAuth provider did not return ID token',
      appleRefreshNotSupported: 'Apple token refresh is not supported by this service',
      invalidJwtFormat: 'Invalid JWT format',
    },

    // Auth Provider messages
    provider: {
      empty: 'Provider name cannot be empty',
      invalid: 'Invalid provider: {value}. Supported providers: {supported}',
    },
  },

  // ============================================
  // Permission Domain
  // ============================================
  permission: {
    empty: 'Permission cannot be empty',
    invalidFormat: 'Permission must be in format resource:action (e.g., users:read)',
    resourceEmpty: 'Resource cannot be empty',
    actionEmpty: 'Action cannot be empty',
    resourceInvalidFormat: 'Resource must start with a letter and contain only lowercase letters, numbers, and underscores',
    actionInvalidFormat: 'Action must start with a letter and contain only lowercase letters, numbers, and underscores (or use * for wildcard)',
  },

  // ============================================
  // Token Messages
  // ============================================
  refreshToken: {
    invalidFormat: 'Invalid refresh token format',
  },

  // ============================================
  // ID Validation
  // ============================================
  id: {
    invalidUuid: 'Invalid UUID format',
    invalidUserId: 'Invalid user ID',
    invalidRoleId: 'Invalid role ID',
    invalidPermissionId: 'Invalid permission ID',
    invalidOAuthConnectionId: 'Invalid OAuth connection ID',
    required: 'ID is required',
  },

  // ============================================
  // HTTP/API Messages
  // ============================================
  http: {
    welcome: 'Welcome to TypeScript Bun Backend',
    rateLimitExceeded: 'Too many attempts. Please try again later.',
    rateLimitRefresh: 'Too many refresh attempts. Please try again later.',
    rateLimitOAuth: 'Too many OAuth attempts. Please try again later.',
    authHeaderRequired: 'Authorization header required',
    invalidAuthFormat: 'Invalid authorization format. Use: Bearer <token>',
    methodNotAllowed: 'Method not allowed',
    routeNotFound: 'Route not found',
  },

  // ============================================
  // Middleware Messages
  // ============================================
  middleware: {
    onlyAdmins: 'Only administrators can perform this action',
    creatorNotFound: 'Creator user not found',
    targetNotFound: 'Target user not found',
    assignerNotFound: 'Assigner user not found',
    removerNotFound: 'Remover user not found',
    deleterNotFound: 'Deleter user not found',
    insufficientPermissions: 'Insufficient permissions',
    cannotRemoveOwnRole: 'Cannot remove your own admin role',
    cannotModifyOwnPermissions: 'Cannot modify your own permissions',
    authRequired: 'Authentication required',
    invalidSession: 'Invalid user session',
    permissionRequired: "Permission '{permission}' required",
    anyPermissionRequired: 'One of the following permissions is required: {permissions}',
    allPermissionsRequired: 'All of the following permissions are required: {permissions}',
  },

  // ============================================
  // Admin User Management
  // ============================================
  admin: {
    user: {
      created: 'User created successfully',
      updated: 'User updated successfully',
      deactivated: 'User deactivated successfully',
      activated: 'User reactivated successfully',
      passwordReset: 'Password reset successfully',
      notFound: 'User not found',
      cannotDeactivateSelf: 'Cannot deactivate your own account',
      emailAlreadyExists: 'This email is already in use',
      alreadyActive: 'User is already active',
      alreadyInactive: 'User is already inactive',
      isInactive: 'User account is deactivated',
    },
  },

  // ============================================
  // Validation Messages (generic)
  // ============================================
  validation: {
    required: 'Required field',
    invalidFormat: 'Invalid format',
    tooShort: 'Value too short (minimum {min} characters)',
    tooLong: 'Value too long (maximum {max} characters)',
    invalidEmail: 'Invalid email',
    invalidUrl: 'Invalid URL',
    invalidDate: 'Invalid date',
    mustBeNumber: 'Must be a number',
    mustBePositive: 'Must be a positive number',
    mustBeInteger: 'Must be an integer',
  },

  // ============================================
  // Infrastructure/Mapper Messages
  // ============================================
  mapper: {
    invalidUserId: 'Invalid user ID in database',
    invalidEmail: 'Invalid email in database',
    invalidPasswordHash: 'Invalid password hash in database',
    invalidOAuthConnectionId: 'Invalid OAuth connection ID in database',
    invalidProvider: 'Invalid provider in database',
  },

  // ============================================
  // Date/Time Formatting Labels
  // ============================================
  dateTime: {
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    daysAgo: '{count} days ago',
    hoursAgo: '{count} hours ago',
    minutesAgo: '{count} minutes ago',
    justNow: 'just now',
  },

  // ============================================
  // Validation Error Messages (Elysia/TypeBox)
  // ============================================
  validationErrors: {
    // Format errors
    emailFormat: "Field '{field}' must be a valid email",
    urlFormat: "Field '{field}' must be a valid URL",
    uuidFormat: "Field '{field}' must be a valid UUID",
    dateFormat: "Field '{field}' must be a valid date",
    dateTimeFormat: "Field '{field}' must be a valid date/time",
    timeFormat: "Field '{field}' must be a valid time",

    // Length errors
    minLength: "Field '{field}' must have at least {min} characters",
    maxLength: "Field '{field}' must have at most {max} characters",
    exactLength: "Field '{field}' must have exactly {length} characters",

    // Range errors
    minimum: "Field '{field}' must be at least {min}",
    maximum: "Field '{field}' must be at most {max}",
    exclusiveMinimum: "Field '{field}' must be greater than {min}",
    exclusiveMaximum: "Field '{field}' must be less than {max}",

    // Type errors
    expectedString: "Field '{field}' must be text",
    expectedNumber: "Field '{field}' must be a number",
    expectedInteger: "Field '{field}' must be an integer",
    expectedBoolean: "Field '{field}' must be true or false",
    expectedObject: "Field '{field}' must be an object",
    expectedArray: "Field '{field}' must be an array",
    expectedNull: "Field '{field}' must be null",

    // Required/Missing
    required: "Field '{field}' is required",
    additionalProperties: "Property not allowed: '{property}'",

    // Pattern
    pattern: "Field '{field}' does not match the expected pattern",

    // Enum
    enumMismatch: "Field '{field}' must be one of the allowed values",

    // Array constraints
    minItems: "Field '{field}' must have at least {min} items",
    maxItems: "Field '{field}' must have at most {max} items",
    uniqueItems: "Field '{field}' cannot have duplicate items",

    // Generic fallback
    invalidValue: "Invalid value for field '{field}'",
    unknownError: 'Unknown validation error',
  },
} satisfies Translation;

export default en_US;
