import type { Translation } from '../i18n-types.js';

const de = {
  // ============================================
  // Common/Generic Messages
  // ============================================
  common: {
    internalError: 'Ein interner Fehler ist aufgetreten',
    validationError: 'Validierungsfehler',
    notFound: 'Ressource nicht gefunden',
    conflict: 'Ressourcenkonflikt',
    unauthorized: 'Nicht autorisiert',
    forbidden: 'Zugriff verweigert',
    success: 'Vorgang erfolgreich abgeschlossen',
    created: 'Ressource erfolgreich erstellt',
    updated: 'Ressource erfolgreich aktualisiert',
    deleted: 'Ressource erfolgreich gelöscht',
    notImplemented: 'Funktion nicht implementiert',
  },

  // ============================================
  // Authentication Domain
  // ============================================
  auth: {
    // Email validation
    email: {
      invalidFormat: 'Ungültiges E-Mail-Format',
      tooLong: 'E-Mail zu lang (max. 254 Zeichen)',
    },

    // Password validation
    password: {
      required: 'Passwort ist erforderlich',
      tooShort: 'Passwort muss mindestens {minLength} Zeichen haben',
      tooLong: 'Passwort darf maximal {maxLength} Zeichen haben',
      needsUppercase: 'Passwort muss mindestens einen Großbuchstaben enthalten',
      needsLowercase: 'Passwort muss mindestens einen Kleinbuchstaben enthalten',
      needsNumber: 'Passwort muss mindestens eine Zahl enthalten',
      needsSpecial: 'Passwort muss mindestens ein Sonderzeichen enthalten',
      tooCommon: 'Dieses Passwort ist zu häufig',
      invalid: 'Ungültiges Passwort',
      hashFailed: 'Passwortverarbeitung fehlgeschlagen',
      hashEmpty: 'Passwort-Hash darf nicht leer sein',
      hashInvalid: 'Ungültiges Passwort-Hash-Format',
      tooShortForHash: 'Passwort muss mindestens 6 Zeichen lang sein',
    },

    // User messages
    user: {
      alreadyExists: 'Benutzer mit dieser E-Mail existiert bereits',
      notFound: 'Benutzer nicht gefunden',
      saveFailed: 'Benutzer konnte nicht gespeichert werden',
      registeredSuccess: 'Benutzer erfolgreich registriert',
      loginSuccess: 'Anmeldung erfolgreich',
      logoutSuccess: 'Erfolgreich abgemeldet',
      profileUpdated: 'Profil erfolgreich aktualisiert',
      doesNotHaveRole: 'Benutzer hat keine Rolle: {role}',
      doesNotHavePermission: 'Benutzer hat keine individuelle Berechtigung: {permission}',
    },

    // Token messages
    token: {
      invalidFormat: 'Ungültiges Token-Format',
      expired: 'Token abgelaufen oder ungültig',
      refreshSuccess: 'Token erfolgreich aktualisiert',
      missing: 'Token nicht bereitgestellt',
      malformed: 'Fehlerhaftes Token',
    },

    // Role messages
    role: {
      alreadyHas: 'Benutzer hat bereits die Rolle: {role}',
      notHas: 'Benutzer hat nicht die Rolle: {role}',
      cannotRemoveLast: 'Letzte Rolle des Benutzers kann nicht entfernt werden',
      nameRequired: 'Rollenname darf nicht leer sein',
      nameEmpty: 'Rollenname darf nicht leer sein',
      nameTooShort: 'Rollenname muss mindestens {minLength} Zeichen haben',
      nameTooLong: 'Rollenname darf maximal {maxLength} Zeichen haben',
      invalidFormat: 'Rollenname muss mit einem Buchstaben beginnen und darf nur Kleinbuchstaben, Zahlen und Unterstriche enthalten',
      invalidChars: 'Rollenname darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten',
      reservedName: 'Rolle mit reserviertem Namen "admin" kann nicht erstellt werden',
      onlyAdminSystem: 'Nur "admin" kann als Systemrolle erstellt werden',
      cannotRenameToAdmin: 'Umbenennung in den reservierten Namen "admin" nicht möglich',
      alreadyHasPermission: 'Rolle hat bereits die Berechtigung: {permission}',
      doesNotHavePermission: 'Rolle hat nicht die Berechtigung: {permission}',
      alreadyExists: "Rolle '{name}' existiert bereits",
      notFound: 'Rolle nicht gefunden',
      deleted: 'Rolle erfolgreich gelöscht',
      cannotRenameSystem: 'Systemrollen können nicht umbenannt werden',
      cannotDeleteSystem: 'Systemrollen können nicht gelöscht werden',
      assigned: "Rolle '{role}' erfolgreich dem Benutzer zugewiesen",
      removed: "Rolle '{role}' erfolgreich vom Benutzer entfernt",
      created: "Rolle '{name}' erfolgreich erstellt",
      updated: "Rolle '{name}' erfolgreich aktualisiert",
    },

    // Permission messages
    permission: {
      alreadyHas: 'Hat bereits die Berechtigung: {permission}',
      notHas: 'Hat nicht die Berechtigung: {permission}',
      notFound: "Berechtigung '{permission}' nicht gefunden",
      alreadyExists: "Berechtigung '{permission}' existiert bereits",
      invalidFormat: 'Ungültiges Berechtigungsformat. Verwenden Sie: ressource:aktion',
      assigned: "Berechtigung '{permission}' erfolgreich zugewiesen",
      removed: "Berechtigung '{permission}' erfolgreich entfernt",
      assignedToRole: "Berechtigung '{permission}' erfolgreich der Rolle zugewiesen",
      removedFromRole: "Berechtigung '{permission}' erfolgreich von der Rolle entfernt",
      assignedToUser: "Berechtigung '{permission}' erfolgreich dem Benutzer zugewiesen",
      removedFromUser: "Berechtigung '{permission}' erfolgreich vom Benutzer entfernt",
      roleAlreadyHas: "Rolle '{role}' hat bereits die Berechtigung '{permission}'",
      roleNotHas: "Rolle '{role}' hat nicht die Berechtigung '{permission}'",
      userAlreadyHas: "Benutzer hat bereits die individuelle Berechtigung '{permission}'",
      userNotHas: "Benutzer hat nicht die individuelle Berechtigung '{permission}'",
    },

    // OAuth messages
    oauth: {
      unsupportedProvider: 'Nicht unterstützter OAuth-Anbieter: {provider}',
      notConfigured: 'OAuth {provider} ist nicht konfiguriert',
      facebookNoRefresh: 'Facebook unterstützt keine Token-Aktualisierung',
      invalidEmail: 'Ungültige E-Mail vom OAuth-Anbieter: {email}',
      linkSuccess: '{provider}-Konto erfolgreich verknüpft',
      unlinkSuccess: '{provider}-Konto erfolgreich getrennt',
      alreadyLinked: 'Sie haben bereits ein {provider}-Konto verknüpft',
      linkedToAnotherUser: 'Dieses {provider}-Konto ist bereits mit einem anderen Benutzer verknüpft',
      notLinked: 'Kein {provider}-Konto verknüpft',
      cannotUnlinkOnlyMethod: 'Ihre einzige Authentifizierungsmethode kann nicht getrennt werden. Bitte verknüpfen Sie zuerst einen anderen Anbieter oder legen Sie ein Passwort fest.',
      cannotUpdateDifferentProvider: 'Profil kann nicht mit einem anderen Anbieter aktualisiert werden',
      cannotUpdateDifferentProviderId: 'Profil kann nicht mit einer anderen Anbieter-Benutzer-ID aktualisiert werden',
      userIdRequired: 'Benutzer-ID ist erforderlich',
      profileRequired: 'OAuth-Profil ist erforderlich',
      providerRequired: 'Anbieter ist erforderlich',
      providerLocalNotAllowed: 'OAuthProfile kann nicht für lokale Authentifizierung erstellt werden',
      providerUserIdRequired: 'Anbieter-Benutzer-ID ist erforderlich',
      invalidEmailFormat: 'Ungültiges E-Mail-Format',
      invalidAvatarUrl: 'Ungültiges Avatar-URL-Format',
      placeholderEmailFailed: 'Platzhalter-E-Mail konnte nicht generiert werden',
      passwordGenerationFailed: 'Sicheres Passwort konnte nicht generiert werden',
      providerNotConfigured: 'OAuth-Anbieter ist nicht konfiguriert',
      authorizationUrlFailed: 'Autorisierungs-URL konnte nicht generiert werden',
      codeExchangeFailed: 'Code konnte nicht gegen Token ausgetauscht werden',
      tokenRefreshFailed: 'Token konnte nicht aktualisiert werden',
      userInfoFailed: 'Benutzerinformationen konnten nicht abgerufen werden',
      noIdToken: 'OAuth-Anbieter hat kein ID-Token zurückgegeben',
      appleRefreshNotSupported: 'Apple-Token-Aktualisierung wird von diesem Dienst nicht unterstützt',
      invalidJwtFormat: 'Ungültiges JWT-Format',
    },

    // Auth Provider messages
    provider: {
      empty: 'Anbietername darf nicht leer sein',
      invalid: 'Ungültiger Anbieter: {value}. Unterstützte Anbieter: {supported}',
    },
  },

  // ============================================
  // Permission Domain
  // ============================================
  permission: {
    empty: 'Berechtigung darf nicht leer sein',
    invalidFormat: 'Berechtigung muss im Format ressource:aktion sein (z.B. users:read)',
    resourceEmpty: 'Ressource darf nicht leer sein',
    actionEmpty: 'Aktion darf nicht leer sein',
    resourceInvalidFormat: 'Ressource muss mit einem Buchstaben beginnen und darf nur Kleinbuchstaben, Zahlen und Unterstriche enthalten',
    actionInvalidFormat: 'Aktion muss mit einem Buchstaben beginnen und darf nur Kleinbuchstaben, Zahlen und Unterstriche enthalten (oder * als Platzhalter verwenden)',
  },

  // ============================================
  // Token Messages
  // ============================================
  refreshToken: {
    invalidFormat: 'Ungültiges Refresh-Token-Format',
  },

  // ============================================
  // ID Validation
  // ============================================
  id: {
    invalidUuid: 'Ungültiges UUID-Format',
    invalidUserId: 'Ungültige Benutzer-ID',
    invalidRoleId: 'Ungültige Rollen-ID',
    invalidPermissionId: 'Ungültige Berechtigungs-ID',
    invalidOAuthConnectionId: 'Ungültige OAuth-Verbindungs-ID',
    required: 'ID ist erforderlich',
  },

  // ============================================
  // HTTP/API Messages
  // ============================================
  http: {
    welcome: 'Willkommen beim TypeScript Bun Backend',
    rateLimitExceeded: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.',
    rateLimitRefresh: 'Zu viele Aktualisierungsversuche. Bitte versuchen Sie es später erneut.',
    rateLimitOAuth: 'Zu viele OAuth-Versuche. Bitte versuchen Sie es später erneut.',
    authHeaderRequired: 'Authorization-Header erforderlich',
    invalidAuthFormat: 'Ungültiges Autorisierungsformat. Verwenden Sie: Bearer <token>',
    methodNotAllowed: 'Methode nicht erlaubt',
    routeNotFound: 'Route nicht gefunden',
  },

  // ============================================
  // Middleware Messages
  // ============================================
  middleware: {
    onlyAdmins: 'Nur Administratoren können diese Aktion ausführen',
    creatorNotFound: 'Ersteller-Benutzer nicht gefunden',
    targetNotFound: 'Ziel-Benutzer nicht gefunden',
    assignerNotFound: 'Zuweiser-Benutzer nicht gefunden',
    removerNotFound: 'Entferner-Benutzer nicht gefunden',
    deleterNotFound: 'Löschender Benutzer nicht gefunden',
    insufficientPermissions: 'Unzureichende Berechtigungen',
    cannotRemoveOwnRole: 'Eigene Admin-Rolle kann nicht entfernt werden',
    cannotModifyOwnPermissions: 'Eigene Berechtigungen können nicht geändert werden',
    authRequired: 'Authentifizierung erforderlich',
    invalidSession: 'Ungültige Benutzersitzung',
    permissionRequired: "Berechtigung '{permission}' erforderlich",
    anyPermissionRequired: 'Eine der folgenden Berechtigungen ist erforderlich: {permissions}',
    allPermissionsRequired: 'Alle folgenden Berechtigungen sind erforderlich: {permissions}',
  },

  // ============================================
  // Admin User Management
  // ============================================
  admin: {
    user: {
      created: 'Benutzer erfolgreich erstellt',
      updated: 'Benutzer erfolgreich aktualisiert',
      deactivated: 'Benutzer erfolgreich deaktiviert',
      activated: 'Benutzer erfolgreich reaktiviert',
      passwordReset: 'Passwort erfolgreich zurückgesetzt',
      notFound: 'Benutzer nicht gefunden',
      cannotDeactivateSelf: 'Das eigene Konto kann nicht deaktiviert werden',
      emailAlreadyExists: 'Diese E-Mail wird bereits verwendet',
      alreadyActive: 'Benutzer ist bereits aktiv',
      alreadyInactive: 'Benutzer ist bereits inaktiv',
      isInactive: 'Benutzerkonto ist deaktiviert',
    },
  },

  // ============================================
  // Validation Messages (generic)
  // ============================================
  validation: {
    required: 'Pflichtfeld',
    invalidFormat: 'Ungültiges Format',
    tooShort: 'Wert zu kurz (mindestens {min} Zeichen)',
    tooLong: 'Wert zu lang (maximal {max} Zeichen)',
    invalidEmail: 'Ungültige E-Mail',
    invalidUrl: 'Ungültige URL',
    invalidDate: 'Ungültiges Datum',
    mustBeNumber: 'Muss eine Zahl sein',
    mustBePositive: 'Muss eine positive Zahl sein',
    mustBeInteger: 'Muss eine ganze Zahl sein',
  },

  // ============================================
  // Infrastructure/Mapper Messages
  // ============================================
  mapper: {
    invalidUserId: 'Ungültige Benutzer-ID in der Datenbank',
    invalidEmail: 'Ungültige E-Mail in der Datenbank',
    invalidPasswordHash: 'Ungültiger Passwort-Hash in der Datenbank',
    invalidOAuthConnectionId: 'Ungültige OAuth-Verbindungs-ID in der Datenbank',
    invalidProvider: 'Ungültiger Anbieter in der Datenbank',
  },

  // ============================================
  // Date/Time Formatting Labels
  // ============================================
  dateTime: {
    today: 'Heute',
    yesterday: 'Gestern',
    tomorrow: 'Morgen',
    daysAgo: 'vor {count} Tagen',
    hoursAgo: 'vor {count} Stunden',
    minutesAgo: 'vor {count} Minuten',
    justNow: 'gerade eben',
  },

  // ============================================
  // Validation Error Messages (Elysia/TypeBox)
  // ============================================
  validationErrors: {
    // Format errors
    emailFormat: "Feld '{field}' muss eine gültige E-Mail sein",
    urlFormat: "Feld '{field}' muss eine gültige URL sein",
    uuidFormat: "Feld '{field}' muss eine gültige UUID sein",
    dateFormat: "Feld '{field}' muss ein gültiges Datum sein",
    dateTimeFormat: "Feld '{field}' muss ein gültiges Datum/Uhrzeit sein",
    timeFormat: "Feld '{field}' muss eine gültige Uhrzeit sein",

    // Length errors
    minLength: "Feld '{field}' muss mindestens {min} Zeichen haben",
    maxLength: "Feld '{field}' darf maximal {max} Zeichen haben",
    exactLength: "Feld '{field}' muss genau {length} Zeichen haben",

    // Range errors
    minimum: "Feld '{field}' muss mindestens {min} sein",
    maximum: "Feld '{field}' darf maximal {max} sein",
    exclusiveMinimum: "Feld '{field}' muss größer als {min} sein",
    exclusiveMaximum: "Feld '{field}' muss kleiner als {max} sein",

    // Type errors
    expectedString: "Feld '{field}' muss Text sein",
    expectedNumber: "Feld '{field}' muss eine Zahl sein",
    expectedInteger: "Feld '{field}' muss eine ganze Zahl sein",
    expectedBoolean: "Feld '{field}' muss wahr oder falsch sein",
    expectedObject: "Feld '{field}' muss ein Objekt sein",
    expectedArray: "Feld '{field}' muss ein Array sein",
    expectedNull: "Feld '{field}' muss null sein",

    // Required/Missing
    required: "Feld '{field}' ist erforderlich",
    additionalProperties: "Eigenschaft nicht erlaubt: '{property}'",

    // Pattern
    pattern: "Feld '{field}' entspricht nicht dem erwarteten Muster",

    // Enum
    enumMismatch: "Feld '{field}' muss einer der erlaubten Werte sein",

    // Array constraints
    minItems: "Feld '{field}' muss mindestens {min} Elemente haben",
    maxItems: "Feld '{field}' darf maximal {max} Elemente haben",
    uniqueItems: "Feld '{field}' darf keine doppelten Elemente haben",

    // Generic fallback
    invalidValue: "Ungültiger Wert für Feld '{field}'",
    unknownError: 'Unbekannter Validierungsfehler',
  },
} satisfies Translation;

export default de;
