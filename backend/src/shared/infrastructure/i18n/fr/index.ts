import type { Translation } from '../i18n-types.js';

const fr = {
  // ============================================
  // Common/Generic Messages
  // ============================================
  common: {
    internalError: 'Une erreur interne est survenue',
    validationError: 'Erreur de validation',
    notFound: 'Ressource non trouvée',
    conflict: 'Conflit de ressource',
    unauthorized: 'Non autorisé',
    forbidden: 'Accès refusé',
    success: 'Opération effectuée avec succès',
    created: 'Ressource créée avec succès',
    updated: 'Ressource mise à jour avec succès',
    deleted: 'Ressource supprimée avec succès',
    notImplemented: 'Fonctionnalité non implémentée',
  },

  // ============================================
  // Authentication Domain
  // ============================================
  auth: {
    // Email validation
    email: {
      invalidFormat: 'Format d\'email invalide',
      tooLong: 'Email trop long (max 254 caractères)',
    },

    // Password validation
    password: {
      required: 'Le mot de passe est requis',
      tooShort: 'Le mot de passe doit contenir au moins {minLength} caractères',
      tooLong: 'Le mot de passe ne doit pas dépasser {maxLength} caractères',
      needsUppercase: 'Le mot de passe doit contenir au moins une lettre majuscule',
      needsLowercase: 'Le mot de passe doit contenir au moins une lettre minuscule',
      needsNumber: 'Le mot de passe doit contenir au moins un chiffre',
      needsSpecial: 'Le mot de passe doit contenir au moins un caractère spécial',
      tooCommon: 'Ce mot de passe est trop courant',
      invalid: 'Mot de passe invalide',
      hashFailed: 'Échec du traitement du mot de passe',
      hashEmpty: 'Le hash du mot de passe ne peut pas être vide',
      hashInvalid: 'Format de hash de mot de passe invalide',
      tooShortForHash: 'Le mot de passe doit contenir au moins 6 caractères',
    },

    // User messages
    user: {
      alreadyExists: 'Un utilisateur avec cet email existe déjà',
      notFound: 'Utilisateur non trouvé',
      saveFailed: 'Échec de l\'enregistrement de l\'utilisateur',
      registeredSuccess: 'Utilisateur enregistré avec succès',
      loginSuccess: 'Connexion réussie',
      logoutSuccess: 'Déconnexion réussie',
      profileUpdated: 'Profil mis à jour avec succès',
      doesNotHaveRole: 'L\'utilisateur n\'a pas le rôle : {role}',
      doesNotHavePermission: 'L\'utilisateur n\'a pas la permission individuelle : {permission}',
    },

    // Token messages
    token: {
      invalidFormat: 'Format de jeton invalide',
      expired: 'Jeton expiré ou invalide',
      refreshSuccess: 'Jeton actualisé avec succès',
      missing: 'Jeton non fourni',
      malformed: 'Jeton malformé',
    },

    // Role messages
    role: {
      alreadyHas: 'L\'utilisateur a déjà le rôle : {role}',
      notHas: 'L\'utilisateur n\'a pas le rôle : {role}',
      cannotRemoveLast: 'Impossible de supprimer le dernier rôle de l\'utilisateur',
      nameRequired: 'Le nom du rôle ne peut pas être vide',
      nameEmpty: 'Le nom du rôle ne peut pas être vide',
      nameTooShort: 'Le nom du rôle doit contenir au moins {minLength} caractères',
      nameTooLong: 'Le nom du rôle ne doit pas dépasser {maxLength} caractères',
      invalidFormat: 'Le nom du rôle doit commencer par une lettre et ne contenir que des lettres minuscules, des chiffres et des underscores',
      invalidChars: 'Le nom du rôle ne peut contenir que des lettres, des chiffres, des underscores et des tirets',
      reservedName: 'Impossible de créer un rôle avec le nom réservé "admin"',
      onlyAdminSystem: 'Seul "admin" peut être créé comme rôle système',
      cannotRenameToAdmin: 'Impossible de renommer en nom réservé "admin"',
      alreadyHasPermission: 'Le rôle a déjà la permission : {permission}',
      doesNotHavePermission: 'Le rôle n\'a pas la permission : {permission}',
      alreadyExists: "Le rôle '{name}' existe déjà",
      notFound: 'Rôle non trouvé',
      deleted: 'Rôle supprimé avec succès',
      cannotRenameSystem: 'Les rôles système ne peuvent pas être renommés',
      cannotDeleteSystem: 'Les rôles système ne peuvent pas être supprimés',
      assigned: "Rôle '{role}' attribué à l'utilisateur avec succès",
      removed: "Rôle '{role}' retiré de l'utilisateur avec succès",
      created: "Rôle '{name}' créé avec succès",
      updated: "Rôle '{name}' mis à jour avec succès",
    },

    // Permission messages
    permission: {
      alreadyHas: 'Possède déjà la permission : {permission}',
      notHas: 'Ne possède pas la permission : {permission}',
      notFound: "Permission '{permission}' non trouvée",
      alreadyExists: "La permission '{permission}' existe déjà",
      invalidFormat: 'Format de permission invalide. Utilisez : ressource:action',
      assigned: "Permission '{permission}' attribuée avec succès",
      removed: "Permission '{permission}' retirée avec succès",
      assignedToRole: "Permission '{permission}' attribuée au rôle avec succès",
      removedFromRole: "Permission '{permission}' retirée du rôle avec succès",
      assignedToUser: "Permission '{permission}' attribuée à l'utilisateur avec succès",
      removedFromUser: "Permission '{permission}' retirée de l'utilisateur avec succès",
      roleAlreadyHas: "Le rôle '{role}' a déjà la permission '{permission}'",
      roleNotHas: "Le rôle '{role}' n'a pas la permission '{permission}'",
      userAlreadyHas: "L'utilisateur a déjà la permission individuelle '{permission}'",
      userNotHas: "L'utilisateur n'a pas la permission individuelle '{permission}'",
    },

    // OAuth messages
    oauth: {
      unsupportedProvider: 'Fournisseur OAuth non pris en charge : {provider}',
      notConfigured: 'OAuth {provider} n\'est pas configuré',
      facebookNoRefresh: 'Facebook ne prend pas en charge l\'actualisation des jetons',
      invalidEmail: 'Email invalide du fournisseur OAuth : {email}',
      linkSuccess: 'Compte {provider} lié avec succès',
      unlinkSuccess: 'Compte {provider} délié avec succès',
      alreadyLinked: 'Vous avez déjà un compte {provider} lié',
      linkedToAnotherUser: 'Ce compte {provider} est déjà lié à un autre utilisateur',
      notLinked: 'Aucun compte {provider} lié',
      cannotUnlinkOnlyMethod: 'Impossible de délier votre seule méthode d\'authentification. Veuillez d\'abord lier un autre fournisseur ou définir un mot de passe.',
      cannotUpdateDifferentProvider: 'Impossible de mettre à jour le profil avec un fournisseur différent',
      cannotUpdateDifferentProviderId: 'Impossible de mettre à jour le profil avec un ID utilisateur fournisseur différent',
      userIdRequired: 'L\'ID utilisateur est requis',
      profileRequired: 'Le profil OAuth est requis',
      providerRequired: 'Le fournisseur est requis',
      providerLocalNotAllowed: 'OAuthProfile ne peut pas être créé pour l\'authentification locale',
      providerUserIdRequired: 'L\'ID utilisateur du fournisseur est requis',
      invalidEmailFormat: 'Format d\'email invalide',
      invalidAvatarUrl: 'Format d\'URL d\'avatar invalide',
      placeholderEmailFailed: 'Échec de la génération de l\'email de remplacement',
      passwordGenerationFailed: 'Échec de la génération du mot de passe sécurisé',
      providerNotConfigured: 'Le fournisseur OAuth n\'est pas configuré',
      authorizationUrlFailed: 'Échec de la génération de l\'URL d\'autorisation',
      codeExchangeFailed: 'Échec de l\'échange du code contre les jetons',
      tokenRefreshFailed: 'Échec de l\'actualisation du jeton',
      userInfoFailed: 'Échec de la récupération des informations utilisateur',
      noIdToken: 'Le fournisseur OAuth n\'a pas retourné de jeton ID',
      appleRefreshNotSupported: 'L\'actualisation du jeton Apple n\'est pas prise en charge par ce service',
      invalidJwtFormat: 'Format JWT invalide',
    },

    // Auth Provider messages
    provider: {
      empty: 'Le nom du fournisseur ne peut pas être vide',
      invalid: 'Fournisseur invalide : {value}. Fournisseurs pris en charge : {supported}',
    },
  },

  // ============================================
  // Permission Domain
  // ============================================
  permission: {
    empty: 'La permission ne peut pas être vide',
    invalidFormat: 'La permission doit être au format ressource:action (ex. users:read)',
    resourceEmpty: 'La ressource ne peut pas être vide',
    actionEmpty: 'L\'action ne peut pas être vide',
    resourceInvalidFormat: 'La ressource doit commencer par une lettre et ne contenir que des lettres minuscules, des chiffres et des underscores',
    actionInvalidFormat: 'L\'action doit commencer par une lettre et ne contenir que des lettres minuscules, des chiffres et des underscores (ou utiliser * comme joker)',
  },

  // ============================================
  // Token Messages
  // ============================================
  refreshToken: {
    invalidFormat: 'Format de jeton de rafraîchissement invalide',
  },

  // ============================================
  // ID Validation
  // ============================================
  id: {
    invalidUuid: 'Format UUID invalide',
    invalidUserId: 'ID utilisateur invalide',
    invalidRoleId: 'ID de rôle invalide',
    invalidPermissionId: 'ID de permission invalide',
    invalidOAuthConnectionId: 'ID de connexion OAuth invalide',
    required: 'L\'ID est requis',
  },

  // ============================================
  // HTTP/API Messages
  // ============================================
  http: {
    welcome: 'Bienvenue sur TypeScript Bun Backend',
    rateLimitExceeded: 'Trop de tentatives. Veuillez réessayer plus tard.',
    rateLimitRefresh: 'Trop de tentatives d\'actualisation. Veuillez réessayer plus tard.',
    rateLimitOAuth: 'Trop de tentatives OAuth. Veuillez réessayer plus tard.',
    authHeaderRequired: 'En-tête d\'autorisation requis',
    invalidAuthFormat: 'Format d\'autorisation invalide. Utilisez : Bearer <jeton>',
    methodNotAllowed: 'Méthode non autorisée',
    routeNotFound: 'Route non trouvée',
  },

  // ============================================
  // Middleware Messages
  // ============================================
  middleware: {
    onlyAdmins: 'Seuls les administrateurs peuvent effectuer cette action',
    creatorNotFound: 'Utilisateur créateur non trouvé',
    targetNotFound: 'Utilisateur cible non trouvé',
    assignerNotFound: 'Utilisateur assignateur non trouvé',
    removerNotFound: 'Utilisateur suppresseur non trouvé',
    deleterNotFound: 'Utilisateur supprimant non trouvé',
    insufficientPermissions: 'Permissions insuffisantes',
    cannotRemoveOwnRole: 'Impossible de supprimer votre propre rôle admin',
    cannotModifyOwnPermissions: 'Impossible de modifier vos propres permissions',
    authRequired: 'Authentification requise',
    invalidSession: 'Session utilisateur invalide',
    permissionRequired: "Permission '{permission}' requise",
    anyPermissionRequired: 'Une des permissions suivantes est requise : {permissions}',
    allPermissionsRequired: 'Toutes les permissions suivantes sont requises : {permissions}',
  },

  // ============================================
  // Admin User Management
  // ============================================
  admin: {
    user: {
      created: 'Utilisateur créé avec succès',
      updated: 'Utilisateur mis à jour avec succès',
      deactivated: 'Utilisateur désactivé avec succès',
      activated: 'Utilisateur réactivé avec succès',
      passwordReset: 'Mot de passe réinitialisé avec succès',
      notFound: 'Utilisateur non trouvé',
      cannotDeactivateSelf: 'Impossible de désactiver votre propre compte',
      emailAlreadyExists: 'Cet email est déjà utilisé',
      alreadyActive: 'L\'utilisateur est déjà actif',
      alreadyInactive: 'L\'utilisateur est déjà inactif',
      isInactive: 'Le compte utilisateur est désactivé',
    },
  },

  // ============================================
  // Validation Messages (generic)
  // ============================================
  validation: {
    required: 'Champ obligatoire',
    invalidFormat: 'Format invalide',
    tooShort: 'Valeur trop courte (minimum {min} caractères)',
    tooLong: 'Valeur trop longue (maximum {max} caractères)',
    invalidEmail: 'Email invalide',
    invalidUrl: 'URL invalide',
    invalidDate: 'Date invalide',
    mustBeNumber: 'Doit être un nombre',
    mustBePositive: 'Doit être un nombre positif',
    mustBeInteger: 'Doit être un nombre entier',
  },

  // ============================================
  // Infrastructure/Mapper Messages
  // ============================================
  mapper: {
    invalidUserId: 'ID utilisateur invalide dans la base de données',
    invalidEmail: 'Email invalide dans la base de données',
    invalidPasswordHash: 'Hash de mot de passe invalide dans la base de données',
    invalidOAuthConnectionId: 'ID de connexion OAuth invalide dans la base de données',
    invalidProvider: 'Fournisseur invalide dans la base de données',
  },

  // ============================================
  // Date/Time Formatting Labels
  // ============================================
  dateTime: {
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
    tomorrow: 'Demain',
    daysAgo: 'il y a {count} jours',
    hoursAgo: 'il y a {count} heures',
    minutesAgo: 'il y a {count} minutes',
    justNow: 'à l\'instant',
  },

  // ============================================
  // Validation Error Messages (Elysia/TypeBox)
  // ============================================
  validationErrors: {
    // Format errors
    emailFormat: "Le champ '{field}' doit être un email valide",
    urlFormat: "Le champ '{field}' doit être une URL valide",
    uuidFormat: "Le champ '{field}' doit être un UUID valide",
    dateFormat: "Le champ '{field}' doit être une date valide",
    dateTimeFormat: "Le champ '{field}' doit être une date/heure valide",
    timeFormat: "Le champ '{field}' doit être une heure valide",

    // Length errors
    minLength: "Le champ '{field}' doit contenir au moins {min} caractères",
    maxLength: "Le champ '{field}' ne doit pas dépasser {max} caractères",
    exactLength: "Le champ '{field}' doit contenir exactement {length} caractères",

    // Range errors
    minimum: "Le champ '{field}' doit être au moins {min}",
    maximum: "Le champ '{field}' doit être au maximum {max}",
    exclusiveMinimum: "Le champ '{field}' doit être supérieur à {min}",
    exclusiveMaximum: "Le champ '{field}' doit être inférieur à {max}",

    // Type errors
    expectedString: "Le champ '{field}' doit être du texte",
    expectedNumber: "Le champ '{field}' doit être un nombre",
    expectedInteger: "Le champ '{field}' doit être un nombre entier",
    expectedBoolean: "Le champ '{field}' doit être vrai ou faux",
    expectedObject: "Le champ '{field}' doit être un objet",
    expectedArray: "Le champ '{field}' doit être un tableau",
    expectedNull: "Le champ '{field}' doit être null",

    // Required/Missing
    required: "Le champ '{field}' est requis",
    additionalProperties: "Propriété non autorisée : '{property}'",

    // Pattern
    pattern: "Le champ '{field}' ne correspond pas au format attendu",

    // Enum
    enumMismatch: "Le champ '{field}' doit être l'une des valeurs autorisées",

    // Array constraints
    minItems: "Le champ '{field}' doit contenir au moins {min} éléments",
    maxItems: "Le champ '{field}' doit contenir au maximum {max} éléments",
    uniqueItems: "Le champ '{field}' ne peut pas contenir d'éléments en double",

    // Generic fallback
    invalidValue: "Valeur invalide pour le champ '{field}'",
    unknownError: 'Erreur de validation inconnue',
  },
} satisfies Translation;

export default fr;
