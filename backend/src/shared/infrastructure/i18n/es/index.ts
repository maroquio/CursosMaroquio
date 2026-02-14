import type { Translation } from '../i18n-types.js';

const es = {
  // ============================================
  // Common/Generic Messages
  // ============================================
  common: {
    internalError: 'Ocurrió un error interno',
    validationError: 'Error de validación',
    notFound: 'Recurso no encontrado',
    conflict: 'Conflicto de recurso',
    unauthorized: 'No autorizado',
    forbidden: 'Acceso denegado',
    success: 'Operación realizada con éxito',
    created: 'Recurso creado con éxito',
    updated: 'Recurso actualizado con éxito',
    deleted: 'Recurso eliminado con éxito',
    notImplemented: 'Funcionalidad no implementada',
  },

  // ============================================
  // Authentication Domain
  // ============================================
  auth: {
    // Email validation
    email: {
      invalidFormat: 'Formato de correo electrónico inválido',
      tooLong: 'Correo electrónico muy largo (máximo 254 caracteres)',
    },

    // Password validation
    password: {
      required: 'Contraseña obligatoria',
      tooShort: 'La contraseña debe tener al menos {minLength} caracteres',
      tooLong: 'La contraseña debe tener como máximo {maxLength} caracteres',
      needsUppercase: 'La contraseña debe contener al menos una letra mayúscula',
      needsLowercase: 'La contraseña debe contener al menos una letra minúscula',
      needsNumber: 'La contraseña debe contener al menos un número',
      needsSpecial: 'La contraseña debe contener al menos un carácter especial',
      tooCommon: 'Esta contraseña es muy común',
      invalid: 'Contraseña inválida',
      hashFailed: 'Error al procesar la contraseña',
      hashEmpty: 'El hash de contraseña no puede estar vacío',
      hashInvalid: 'Formato de hash de contraseña inválido',
      tooShortForHash: 'La contraseña debe tener al menos 6 caracteres',
    },

    // User messages
    user: {
      alreadyExists: 'Ya existe un usuario con este correo electrónico',
      notFound: 'Usuario no encontrado',
      saveFailed: 'Error al guardar el usuario',
      registeredSuccess: 'Usuario registrado con éxito',
      loginSuccess: 'Inicio de sesión exitoso',
      logoutSuccess: 'Cierre de sesión exitoso',
      profileUpdated: 'Perfil actualizado con éxito',
      doesNotHaveRole: 'El usuario no tiene el rol: {role}',
      doesNotHavePermission: 'El usuario no tiene el permiso individual: {permission}',
    },

    // Token messages
    token: {
      invalidFormat: 'Formato de token inválido',
      expired: 'Token expirado o inválido',
      refreshSuccess: 'Token renovado con éxito',
      missing: 'Token no proporcionado',
      malformed: 'Token malformado',
    },

    // Role messages
    role: {
      alreadyHas: 'El usuario ya tiene el rol: {role}',
      notHas: 'El usuario no tiene el rol: {role}',
      cannotRemoveLast: 'No se puede eliminar el último rol del usuario',
      nameRequired: 'El nombre del rol no puede estar vacío',
      nameEmpty: 'El nombre del rol no puede estar vacío',
      nameTooShort: 'El nombre del rol debe tener al menos {minLength} caracteres',
      nameTooLong: 'El nombre del rol debe tener como máximo {maxLength} caracteres',
      invalidFormat:
        'El nombre del rol debe comenzar con una letra y contener solo letras minúsculas, números y guiones bajos',
      invalidChars: 'El nombre del rol solo puede contener letras, números, guiones bajos y guiones',
      reservedName: 'No se puede crear un rol con el nombre reservado "admin"',
      onlyAdminSystem: 'Solo "admin" puede ser creado como rol de sistema',
      cannotRenameToAdmin: 'No se puede renombrar al nombre reservado "admin"',
      alreadyHasPermission: 'El rol ya tiene el permiso: {permission}',
      doesNotHavePermission: 'El rol no tiene el permiso: {permission}',
      alreadyExists: "El rol '{name}' ya existe",
      notFound: 'Rol no encontrado',
      deleted: 'Rol eliminado con éxito',
      cannotRenameSystem: 'No se pueden renombrar los roles del sistema',
      cannotDeleteSystem: 'Los roles del sistema no pueden ser eliminados',
      assigned: "Rol '{role}' asignado al usuario con éxito",
      removed: "Rol '{role}' eliminado del usuario con éxito",
      created: "Rol '{name}' creado con éxito",
      updated: "Rol '{name}' actualizado con éxito",
    },

    // Permission messages
    permission: {
      alreadyHas: 'Ya tiene el permiso: {permission}',
      notHas: 'No tiene el permiso: {permission}',
      notFound: "Permiso '{permission}' no encontrado",
      alreadyExists: "Permiso '{permission}' ya existe",
      invalidFormat: 'Formato de permiso inválido. Use: recurso:accion',
      assigned: "Permiso '{permission}' asignado con éxito",
      removed: "Permiso '{permission}' eliminado con éxito",
      assignedToRole: "Permiso '{permission}' asignado al rol con éxito",
      removedFromRole: "Permiso '{permission}' eliminado del rol con éxito",
      assignedToUser: "Permiso '{permission}' asignado al usuario con éxito",
      removedFromUser: "Permiso '{permission}' eliminado del usuario con éxito",
      roleAlreadyHas: "El rol '{role}' ya tiene el permiso '{permission}'",
      roleNotHas: "El rol '{role}' no tiene el permiso '{permission}'",
      userAlreadyHas: "El usuario ya tiene el permiso individual '{permission}'",
      userNotHas: "El usuario no tiene el permiso individual '{permission}'",
    },

    // OAuth messages
    oauth: {
      unsupportedProvider: 'Proveedor OAuth no soportado: {provider}',
      notConfigured: 'OAuth {provider} no está configurado',
      facebookNoRefresh: 'Facebook no soporta la renovación de token',
      invalidEmail: 'Correo electrónico inválido del proveedor OAuth: {email}',
      linkSuccess: 'Cuenta de {provider} vinculada con éxito',
      unlinkSuccess: 'Cuenta de {provider} desvinculada con éxito',
      alreadyLinked: 'Ya tiene una cuenta de {provider} vinculada',
      linkedToAnotherUser: 'Esta cuenta de {provider} ya está vinculada a otro usuario',
      notLinked: 'Ninguna cuenta de {provider} vinculada',
      cannotUnlinkOnlyMethod: 'No se puede desvincular su único método de autenticación. Vincule otro proveedor o establezca una contraseña primero.',
      cannotUpdateDifferentProvider: 'No se puede actualizar el perfil con un proveedor diferente',
      cannotUpdateDifferentProviderId: 'No se puede actualizar el perfil con un ID de proveedor diferente',
      userIdRequired: 'ID de usuario es obligatorio',
      profileRequired: 'Perfil OAuth es obligatorio',
      providerRequired: 'Proveedor es obligatorio',
      providerLocalNotAllowed: 'OAuthProfile no puede ser creado para autenticación local',
      providerUserIdRequired: 'ID del usuario en el proveedor es obligatorio',
      invalidEmailFormat: 'Formato de correo electrónico inválido',
      invalidAvatarUrl: 'Formato de URL del avatar inválido',
      placeholderEmailFailed: 'Error al generar correo electrónico temporal',
      passwordGenerationFailed: 'Error al generar contraseña segura',
      providerNotConfigured: 'Proveedor OAuth no está configurado',
      authorizationUrlFailed: 'Error al generar URL de autorización',
      codeExchangeFailed: 'Error al intercambiar código por tokens',
      tokenRefreshFailed: 'Error al renovar token',
      userInfoFailed: 'Error al obtener información del usuario',
      noIdToken: 'Proveedor OAuth no devolvió ID token',
      appleRefreshNotSupported: 'La renovación de token de Apple no es soportada por este servicio',
      invalidJwtFormat: 'Formato de JWT inválido',
    },

    // Auth Provider messages
    provider: {
      empty: 'Nombre del proveedor no puede estar vacío',
      invalid: 'Proveedor inválido: {value}. Proveedores soportados: {supported}',
    },
  },

  // ============================================
  // Permission Domain
  // ============================================
  permission: {
    empty: 'Permiso no puede estar vacío',
    invalidFormat: 'Permiso debe estar en formato recurso:accion (ej: users:read)',
    resourceEmpty: 'Recurso no puede estar vacío',
    actionEmpty: 'Acción no puede estar vacía',
    resourceInvalidFormat: 'Recurso debe comenzar con una letra y contener solo letras minúsculas, números y guiones bajos',
    actionInvalidFormat: 'Acción debe comenzar con una letra y contener solo letras minúsculas, números y guiones bajos (o use * para wildcard)',
  },

  // ============================================
  // Token Messages
  // ============================================
  refreshToken: {
    invalidFormat: 'Formato de refresh token inválido',
  },

  // ============================================
  // ID Validation
  // ============================================
  id: {
    invalidUuid: 'Formato de UUID inválido',
    invalidUserId: 'ID de usuario inválido',
    invalidRoleId: 'ID de rol inválido',
    invalidPermissionId: 'ID de permiso inválido',
    invalidOAuthConnectionId: 'ID de conexión OAuth inválido',
    required: 'ID es obligatorio',
  },

  // ============================================
  // HTTP/API Messages
  // ============================================
  http: {
    welcome: 'Bienvenido a TypeScript Bun Backend',
    rateLimitExceeded: 'Demasiados intentos. Por favor, inténtelo más tarde.',
    rateLimitRefresh: 'Demasiados intentos de renovación. Por favor, inténtelo más tarde.',
    rateLimitOAuth: 'Demasiados intentos de OAuth. Por favor, inténtelo más tarde.',
    authHeaderRequired: 'Encabezado de autorización requerido',
    invalidAuthFormat: 'Formato de autorización inválido. Use: Bearer <token>',
    methodNotAllowed: 'Método no permitido',
    routeNotFound: 'Ruta no encontrada',
  },

  // ============================================
  // Middleware Messages
  // ============================================
  middleware: {
    onlyAdmins: 'Solo los administradores pueden realizar esta acción',
    creatorNotFound: 'Usuario creador no encontrado',
    targetNotFound: 'Usuario objetivo no encontrado',
    assignerNotFound: 'Usuario asignador no encontrado',
    removerNotFound: 'Usuario eliminador no encontrado',
    deleterNotFound: 'Usuario que elimina no encontrado',
    insufficientPermissions: 'Permisos insuficientes',
    cannotRemoveOwnRole: 'No puede eliminar su propio rol de administrador',
    cannotModifyOwnPermissions: 'No puede modificar sus propios permisos',
    authRequired: 'Autenticación requerida',
    invalidSession: 'Sesión de usuario inválida',
    permissionRequired: "Permiso '{permission}' requerido",
    anyPermissionRequired: 'Se requiere uno de los siguientes permisos: {permissions}',
    allPermissionsRequired: 'Se requieren todos los siguientes permisos: {permissions}',
  },

  // ============================================
  // Admin User Management
  // ============================================
  admin: {
    user: {
      created: 'Usuario creado con éxito',
      updated: 'Usuario actualizado con éxito',
      deactivated: 'Usuario desactivado con éxito',
      activated: 'Usuario reactivado con éxito',
      passwordReset: 'Contraseña restablecida con éxito',
      notFound: 'Usuario no encontrado',
      cannotDeactivateSelf: 'No puede desactivar su propia cuenta',
      emailAlreadyExists: 'Este correo electrónico ya está en uso',
      alreadyActive: 'El usuario ya está activo',
      alreadyInactive: 'El usuario ya está inactivo',
      isInactive: 'La cuenta de usuario está desactivada',
    },
  },

  // ============================================
  // Validation Messages (generic)
  // ============================================
  validation: {
    required: 'Campo obligatorio',
    invalidFormat: 'Formato inválido',
    tooShort: 'Valor muy corto (mínimo {min} caracteres)',
    tooLong: 'Valor muy largo (máximo {max} caracteres)',
    invalidEmail: 'Correo electrónico inválido',
    invalidUrl: 'URL inválida',
    invalidDate: 'Fecha inválida',
    mustBeNumber: 'Debe ser un número',
    mustBePositive: 'Debe ser un número positivo',
    mustBeInteger: 'Debe ser un número entero',
  },

  // ============================================
  // Infrastructure/Mapper Messages
  // ============================================
  mapper: {
    invalidUserId: 'ID de usuario inválido en la base de datos',
    invalidEmail: 'Correo electrónico inválido en la base de datos',
    invalidPasswordHash: 'Hash de contraseña inválido en la base de datos',
    invalidOAuthConnectionId: 'ID de conexión OAuth inválido en la base de datos',
    invalidProvider: 'Proveedor inválido en la base de datos',
  },

  // ============================================
  // Date/Time Formatting Labels
  // ============================================
  dateTime: {
    today: 'Hoy',
    yesterday: 'Ayer',
    tomorrow: 'Mañana',
    daysAgo: 'hace {count} días',
    hoursAgo: 'hace {count} horas',
    minutesAgo: 'hace {count} minutos',
    justNow: 'ahora mismo',
  },

  // ============================================
  // Validation Error Messages (Elysia/TypeBox)
  // ============================================
  validationErrors: {
    // Format errors
    emailFormat: "El campo '{field}' debe ser un correo electrónico válido",
    urlFormat: "El campo '{field}' debe ser una URL válida",
    uuidFormat: "El campo '{field}' debe ser un UUID válido",
    dateFormat: "El campo '{field}' debe ser una fecha válida",
    dateTimeFormat: "El campo '{field}' debe ser una fecha/hora válida",
    timeFormat: "El campo '{field}' debe ser una hora válida",

    // Length errors
    minLength: "El campo '{field}' debe tener al menos {min} caracteres",
    maxLength: "El campo '{field}' debe tener como máximo {max} caracteres",
    exactLength: "El campo '{field}' debe tener exactamente {length} caracteres",

    // Range errors
    minimum: "El campo '{field}' debe ser al menos {min}",
    maximum: "El campo '{field}' debe ser como máximo {max}",
    exclusiveMinimum: "El campo '{field}' debe ser mayor que {min}",
    exclusiveMaximum: "El campo '{field}' debe ser menor que {max}",

    // Type errors
    expectedString: "El campo '{field}' debe ser texto",
    expectedNumber: "El campo '{field}' debe ser un número",
    expectedInteger: "El campo '{field}' debe ser un número entero",
    expectedBoolean: "El campo '{field}' debe ser verdadero o falso",
    expectedObject: "El campo '{field}' debe ser un objeto",
    expectedArray: "El campo '{field}' debe ser una lista",
    expectedNull: "El campo '{field}' debe ser nulo",

    // Required/Missing
    required: "El campo '{field}' es obligatorio",
    additionalProperties: "Propiedad no permitida: '{property}'",

    // Pattern
    pattern: "El campo '{field}' no corresponde al patrón esperado",

    // Enum
    enumMismatch: "El campo '{field}' debe ser uno de los valores permitidos",

    // Array constraints
    minItems: "El campo '{field}' debe tener al menos {min} elementos",
    maxItems: "El campo '{field}' debe tener como máximo {max} elementos",
    uniqueItems: "El campo '{field}' no puede tener elementos duplicados",

    // Generic fallback
    invalidValue: "Valor inválido para el campo '{field}'",
    unknownError: 'Error de validación desconocido',
  },
} satisfies Translation;

export default es;
