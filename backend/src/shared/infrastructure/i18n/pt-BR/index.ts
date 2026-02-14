import type { BaseTranslation } from '../i18n-types.js';

const pt_BR = {
  // ============================================
  // Common/Generic Messages
  // ============================================
  common: {
    internalError: 'Ocorreu um erro interno',
    validationError: 'Erro de validação',
    notFound: 'Recurso não encontrado',
    conflict: 'Conflito de recurso',
    unauthorized: 'Não autorizado',
    forbidden: 'Acesso negado',
    success: 'Operação realizada com sucesso',
    created: 'Recurso criado com sucesso',
    updated: 'Recurso atualizado com sucesso',
    deleted: 'Recurso excluído com sucesso',
    notImplemented: 'Funcionalidade não implementada',
  },

  // ============================================
  // Authentication Domain
  // ============================================
  auth: {
    // Email validation
    email: {
      invalidFormat: 'Formato de email inválido',
      tooLong: 'Email muito longo (máximo 254 caracteres)',
    },

    // Password validation
    password: {
      required: 'Senha obrigatória',
      tooShort: 'A senha deve ter pelo menos {minLength} caracteres',
      tooLong: 'A senha deve ter no máximo {maxLength} caracteres',
      needsUppercase: 'A senha deve conter pelo menos uma letra maiúscula',
      needsLowercase: 'A senha deve conter pelo menos uma letra minúscula',
      needsNumber: 'A senha deve conter pelo menos um número',
      needsSpecial: 'A senha deve conter pelo menos um caractere especial',
      tooCommon: 'Esta senha é muito comum',
      invalid: 'Senha inválida',
      hashFailed: 'Falha ao processar senha',
      hashEmpty: 'Hash de senha não pode estar vazio',
      hashInvalid: 'Formato de hash de senha inválido',
      tooShortForHash: 'Senha deve ter pelo menos 6 caracteres',
    },

    // User messages
    user: {
      alreadyExists: 'Usuário com este email já existe',
      notFound: 'Usuário não encontrado',
      saveFailed: 'Falha ao salvar usuário',
      registeredSuccess: 'Usuário registrado com sucesso',
      loginSuccess: 'Login realizado com sucesso',
      logoutSuccess: 'Logout realizado com sucesso',
      profileUpdated: 'Perfil atualizado com sucesso',
      doesNotHaveRole: 'Usuário não possui a role: {role}',
      doesNotHavePermission: 'Usuário não possui a permissão individual: {permission}',
    },

    // Token messages
    token: {
      invalidFormat: 'Formato de token inválido',
      expired: 'Token expirado ou inválido',
      refreshSuccess: 'Token renovado com sucesso',
      missing: 'Token não fornecido',
      malformed: 'Token malformado',
    },

    // Role messages
    role: {
      alreadyHas: 'Usuário já possui a role: {role}',
      notHas: 'Usuário não possui a role: {role}',
      cannotRemoveLast: 'Não é possível remover a última role do usuário',
      nameRequired: 'Nome da role não pode estar vazio',
      nameEmpty: 'Nome da role não pode estar vazio',
      nameTooShort: 'Nome da role deve ter pelo menos {minLength} caracteres',
      nameTooLong: 'Nome da role deve ter no máximo {maxLength} caracteres',
      invalidFormat:
        'Nome da role deve começar com uma letra e conter apenas letras minúsculas, números e underscores',
      invalidChars: 'Nome da role pode conter apenas letras, números, underscores e hífens',
      reservedName: 'Não é possível criar role com o nome reservado "admin"',
      onlyAdminSystem: 'Apenas "admin" pode ser criado como role de sistema',
      cannotRenameToAdmin: 'Não é possível renomear para o nome reservado "admin"',
      alreadyHasPermission: "Role já possui a permissão: {permission}",
      doesNotHavePermission: "Role não possui a permissão: {permission}",
      alreadyExists: "Role '{name}' já existe",
      notFound: 'Role não encontrada',
      deleted: 'Role excluída com sucesso',
      cannotRenameSystem: 'Não é possível renomear roles de sistema',
      cannotDeleteSystem: 'Roles de sistema não podem ser excluídas',
      assigned: "Role '{role}' atribuída ao usuário com sucesso",
      removed: "Role '{role}' removida do usuário com sucesso",
      created: "Role '{name}' criada com sucesso",
      updated: "Role '{name}' atualizada com sucesso",
    },

    // Permission messages
    permission: {
      alreadyHas: 'Já possui a permissão: {permission}',
      notHas: 'Não possui a permissão: {permission}',
      notFound: "Permissão '{permission}' não encontrada",
      alreadyExists: "Permissão '{permission}' já existe",
      invalidFormat: 'Formato de permissão inválido. Use: recurso:acao',
      assigned: "Permissão '{permission}' atribuída com sucesso",
      removed: "Permissão '{permission}' removida com sucesso",
      assignedToRole: "Permissão '{permission}' atribuída à role com sucesso",
      removedFromRole: "Permissão '{permission}' removida da role com sucesso",
      assignedToUser: "Permissão '{permission}' atribuída ao usuário com sucesso",
      removedFromUser: "Permissão '{permission}' removida do usuário com sucesso",
      roleAlreadyHas: "Role '{role}' já possui a permissão '{permission}'",
      roleNotHas: "Role '{role}' não possui a permissão '{permission}'",
      userAlreadyHas: "Usuário já possui a permissão individual '{permission}'",
      userNotHas: "Usuário não possui a permissão individual '{permission}'",
    },

    // OAuth messages
    oauth: {
      unsupportedProvider: 'Provedor OAuth não suportado: {provider}',
      notConfigured: 'OAuth {provider} não está configurado',
      facebookNoRefresh: 'Facebook não suporta renovação de token',
      invalidEmail: 'Email inválido do provedor OAuth: {email}',
      linkSuccess: 'Conta {provider} vinculada com sucesso',
      unlinkSuccess: 'Conta {provider} desvinculada com sucesso',
      alreadyLinked: 'Você já tem uma conta {provider} vinculada',
      linkedToAnotherUser: 'Esta conta {provider} já está vinculada a outro usuário',
      notLinked: 'Nenhuma conta {provider} vinculada',
      cannotUnlinkOnlyMethod: 'Não é possível desvincular seu único método de autenticação. Vincule outro provedor ou defina uma senha primeiro.',
      cannotUpdateDifferentProvider: 'Não é possível atualizar perfil com provedor diferente',
      cannotUpdateDifferentProviderId: 'Não é possível atualizar perfil com ID de provedor diferente',
      userIdRequired: 'ID do usuário é obrigatório',
      profileRequired: 'Perfil OAuth é obrigatório',
      providerRequired: 'Provedor é obrigatório',
      providerLocalNotAllowed: 'OAuthProfile não pode ser criado para autenticação local',
      providerUserIdRequired: 'ID do usuário no provedor é obrigatório',
      invalidEmailFormat: 'Formato de email inválido',
      invalidAvatarUrl: 'Formato de URL do avatar inválido',
      placeholderEmailFailed: 'Falha ao gerar email temporário',
      passwordGenerationFailed: 'Falha ao gerar senha segura',
      providerNotConfigured: 'Provedor OAuth não está configurado',
      authorizationUrlFailed: 'Falha ao gerar URL de autorização',
      codeExchangeFailed: 'Falha ao trocar código por tokens',
      tokenRefreshFailed: 'Falha ao renovar token',
      userInfoFailed: 'Falha ao buscar informações do usuário',
      noIdToken: 'Provedor OAuth não retornou ID token',
      appleRefreshNotSupported: 'Renovação de token da Apple não é suportada por este serviço',
      invalidJwtFormat: 'Formato de JWT inválido',
    },

    // Auth Provider messages
    provider: {
      empty: 'Nome do provedor não pode estar vazio',
      invalid: 'Provedor inválido: {value}. Provedores suportados: {supported}',
    },
  },

  // ============================================
  // Permission Domain
  // ============================================
  permission: {
    empty: 'Permissão não pode estar vazia',
    invalidFormat: 'Permissão deve estar no formato recurso:acao (ex: users:read)',
    resourceEmpty: 'Recurso não pode estar vazio',
    actionEmpty: 'Ação não pode estar vazia',
    resourceInvalidFormat: 'Recurso deve começar com uma letra e conter apenas letras minúsculas, números e underscores',
    actionInvalidFormat: 'Ação deve começar com uma letra e conter apenas letras minúsculas, números e underscores (ou use * para wildcard)',
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
    invalidUserId: 'ID de usuário inválido',
    invalidRoleId: 'ID de role inválido',
    invalidPermissionId: 'ID de permissão inválido',
    invalidOAuthConnectionId: 'ID de conexão OAuth inválido',
    required: 'ID é obrigatório',
  },

  // ============================================
  // HTTP/API Messages
  // ============================================
  http: {
    welcome: 'Bem-vindo ao TypeScript Bun Backend',
    rateLimitExceeded: 'Muitas tentativas. Tente novamente mais tarde.',
    rateLimitRefresh: 'Muitas tentativas de renovação. Tente novamente mais tarde.',
    rateLimitOAuth: 'Muitas tentativas de OAuth. Tente novamente mais tarde.',
    authHeaderRequired: 'Cabeçalho de autorização obrigatório',
    invalidAuthFormat: 'Formato de autorização inválido. Use: Bearer <token>',
    methodNotAllowed: 'Método não permitido',
    routeNotFound: 'Rota não encontrada',
  },

  // ============================================
  // Middleware Messages
  // ============================================
  middleware: {
    onlyAdmins: 'Apenas administradores podem realizar esta ação',
    creatorNotFound: 'Usuário criador não encontrado',
    targetNotFound: 'Usuário alvo não encontrado',
    assignerNotFound: 'Usuário atribuidor não encontrado',
    removerNotFound: 'Usuário removedor não encontrado',
    deleterNotFound: 'Usuário excluidor não encontrado',
    insufficientPermissions: 'Permissões insuficientes',
    cannotRemoveOwnRole: 'Não é possível remover sua própria role de admin',
    cannotModifyOwnPermissions: 'Não é possível modificar suas próprias permissões',
    authRequired: 'Autenticação obrigatória',
    invalidSession: 'Sessão de usuário inválida',
    permissionRequired: "Permissão '{permission}' necessária",
    anyPermissionRequired: 'Uma das seguintes permissões é necessária: {permissions}',
    allPermissionsRequired: 'Todas as seguintes permissões são necessárias: {permissions}',
  },

  // ============================================
  // Admin User Management
  // ============================================
  admin: {
    user: {
      created: 'Usuário criado com sucesso',
      updated: 'Usuário atualizado com sucesso',
      deactivated: 'Usuário desativado com sucesso',
      activated: 'Usuário reativado com sucesso',
      passwordReset: 'Senha redefinida com sucesso',
      notFound: 'Usuário não encontrado',
      cannotDeactivateSelf: 'Não é possível desativar sua própria conta',
      emailAlreadyExists: 'Este email já está em uso',
      alreadyActive: 'Usuário já está ativo',
      alreadyInactive: 'Usuário já está inativo',
      isInactive: 'Conta de usuário está desativada',
    },
  },

  // ============================================
  // Validation Messages (generic)
  // ============================================
  validation: {
    required: 'Campo obrigatório',
    invalidFormat: 'Formato inválido',
    tooShort: 'Valor muito curto (mínimo {min} caracteres)',
    tooLong: 'Valor muito longo (máximo {max} caracteres)',
    invalidEmail: 'Email inválido',
    invalidUrl: 'URL inválida',
    invalidDate: 'Data inválida',
    mustBeNumber: 'Deve ser um número',
    mustBePositive: 'Deve ser um número positivo',
    mustBeInteger: 'Deve ser um número inteiro',
  },

  // ============================================
  // Infrastructure/Mapper Messages
  // ============================================
  mapper: {
    invalidUserId: 'ID de usuário inválido no banco de dados',
    invalidEmail: 'Email inválido no banco de dados',
    invalidPasswordHash: 'Hash de senha inválido no banco de dados',
    invalidOAuthConnectionId: 'ID de conexão OAuth inválido no banco de dados',
    invalidProvider: 'Provedor inválido no banco de dados',
  },

  // ============================================
  // Date/Time Formatting Labels
  // ============================================
  dateTime: {
    today: 'Hoje',
    yesterday: 'Ontem',
    tomorrow: 'Amanhã',
    daysAgo: 'há {count} dias',
    hoursAgo: 'há {count} horas',
    minutesAgo: 'há {count} minutos',
    justNow: 'agora mesmo',
  },

  // ============================================
  // Validation Error Messages (Elysia/TypeBox)
  // ============================================
  validationErrors: {
    // Format errors
    emailFormat: "O campo '{field}' deve ser um email válido",
    urlFormat: "O campo '{field}' deve ser uma URL válida",
    uuidFormat: "O campo '{field}' deve ser um UUID válido",
    dateFormat: "O campo '{field}' deve ser uma data válida",
    dateTimeFormat: "O campo '{field}' deve ser uma data/hora válida",
    timeFormat: "O campo '{field}' deve ser um horário válido",

    // Length errors
    minLength: "O campo '{field}' deve ter no mínimo {min} caracteres",
    maxLength: "O campo '{field}' deve ter no máximo {max} caracteres",
    exactLength: "O campo '{field}' deve ter exatamente {length} caracteres",

    // Range errors
    minimum: "O campo '{field}' deve ser no mínimo {min}",
    maximum: "O campo '{field}' deve ser no máximo {max}",
    exclusiveMinimum: "O campo '{field}' deve ser maior que {min}",
    exclusiveMaximum: "O campo '{field}' deve ser menor que {max}",

    // Type errors
    expectedString: "O campo '{field}' deve ser texto",
    expectedNumber: "O campo '{field}' deve ser um número",
    expectedInteger: "O campo '{field}' deve ser um número inteiro",
    expectedBoolean: "O campo '{field}' deve ser verdadeiro ou falso",
    expectedObject: "O campo '{field}' deve ser um objeto",
    expectedArray: "O campo '{field}' deve ser uma lista",
    expectedNull: "O campo '{field}' deve ser nulo",

    // Required/Missing
    required: "O campo '{field}' é obrigatório",
    additionalProperties: "Propriedade não permitida: '{property}'",

    // Pattern
    pattern: "O campo '{field}' não corresponde ao padrão esperado",

    // Enum
    enumMismatch: "O campo '{field}' deve ser um dos valores permitidos",

    // Array constraints
    minItems: "O campo '{field}' deve ter no mínimo {min} itens",
    maxItems: "O campo '{field}' deve ter no máximo {max} itens",
    uniqueItems: "O campo '{field}' não pode ter itens duplicados",

    // Generic fallback
    invalidValue: "Valor inválido para o campo '{field}'",
    unknownError: 'Erro de validação desconhecido',
  },
} satisfies BaseTranslation;

export default pt_BR;
