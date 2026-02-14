import type { Elysia } from 'elysia';
import { t as schema } from 'elysia';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import type { LinkOAuthAccountCommand } from '../../application/commands/link-oauth-account/LinkOAuthAccountCommand.ts';
import { LinkOAuthAccountHandler } from '../../application/commands/link-oauth-account/LinkOAuthAccountHandler.ts';
import type { UnlinkOAuthAccountCommand } from '../../application/commands/unlink-oauth-account/UnlinkOAuthAccountCommand.ts';
import { UnlinkOAuthAccountHandler } from '../../application/commands/unlink-oauth-account/UnlinkOAuthAccountHandler.ts';
import { GetUserOAuthConnectionsQuery } from '../../application/queries/get-user-oauth-connections/GetUserOAuthConnectionsQuery.ts';
import { GetUserOAuthConnectionsHandler } from '../../application/queries/get-user-oauth-connections/GetUserOAuthConnectionsHandler.ts';
import type { ITokenService } from '../../domain/services/ITokenService.ts';
import {
  createAuthMiddleware,
  type AuthenticatedUser,
} from '../middleware/AuthMiddleware.ts';

// =====================================================================
// Response schemas for OpenAPI documentation
// =====================================================================

// Schemas de erro reutilizáveis
const ValidationErrorResponse = schema.Object({
  statusCode: schema.Literal(400),
  success: schema.Literal(false),
  error: schema.String({
    description: 'Mensagem de erro detalhando o problema de validação',
    example: 'Provider inválido. Use google, facebook ou apple.'
  }),
});

const UnauthorizedResponse = schema.Object({
  statusCode: schema.Literal(401),
  success: schema.Literal(false),
  error: schema.String({
    description: 'Mensagem de erro de autenticação',
    example: 'Token de acesso inválido ou expirado'
  }),
});

const ConflictResponse = schema.Object({
  statusCode: schema.Literal(409),
  success: schema.Literal(false),
  error: schema.String({
    description: 'Mensagem de erro de conflito',
    example: 'Esta conta do Google já está vinculada a outro usuário'
  }),
});

// Schema de conexão OAuth individual
const OAuthConnectionResponse = schema.Object({
  provider: schema.String({
    description: 'Nome do provedor OAuth vinculado',
    example: 'google'
  }),
  email: schema.Union([schema.String({
    format: 'email',
    description: 'Email da conta OAuth vinculada',
    example: 'usuario@gmail.com'
  }), schema.Null()]),
  name: schema.Union([schema.String({
    description: 'Nome do usuário no provedor OAuth',
    example: 'João Silva'
  }), schema.Null()]),
  avatarUrl: schema.Union([schema.String({
    format: 'uri',
    description: 'URL da foto de perfil do provedor OAuth',
    example: 'https://lh3.googleusercontent.com/a/...'
  }), schema.Null()]),
  linkedAt: schema.String({
    format: 'date-time',
    description: 'Data e hora em que a conta OAuth foi vinculada',
    example: '2025-12-18T10:30:00.000Z'
  }),
});

// Schema de lista de conexões OAuth
const OAuthConnectionsListResponse = schema.Object({
  statusCode: schema.Literal(200),
  success: schema.Literal(true),
  data: schema.Object({
    connections: schema.Array(OAuthConnectionResponse, {
      description: 'Lista de provedores OAuth vinculados à conta do usuário'
    }),
    totalConnections: schema.Number({
      description: 'Número total de conexões OAuth vinculadas',
      example: 2
    }),
  }),
});

// Schema de parâmetro de provider
const ProviderParam = schema.String({
  description: 'Provedor OAuth (google, facebook, apple)',
  pattern: '^(google|facebook|apple)$',
  example: 'google',
});

/**
 * OAuthAccountController
 * Handles HTTP requests for OAuth account linking/unlinking and connections
 *
 * Routes:
 * - POST   /oauth/:provider/link       - Link OAuth to authenticated user
 * - DELETE /oauth/:provider/unlink     - Unlink OAuth from user
 * - GET    /oauth/connections          - List user's OAuth connections
 */
export class OAuthAccountController {
  constructor(
    private linkOAuthAccountHandler: LinkOAuthAccountHandler,
    private unlinkOAuthAccountHandler: UnlinkOAuthAccountHandler,
    private getUserOAuthConnectionsHandler: GetUserOAuthConnectionsHandler,
    private tokenService: ITokenService
  ) {}

  /**
   * Register OAuth account routes
   * Routes are registered under /v1/auth/oauth/* prefix
   */
  public routes(app: any) {
    const authMiddleware = createAuthMiddleware(this.tokenService);

    // Register versioned routes
    this.registerOAuthAccountRoutes(app, '/v1/auth/oauth', authMiddleware);

    return app;
  }

  /**
   * Register OAuth account routes under a specific base path
   */
  private registerOAuthAccountRoutes(
    app: any,
    basePath: string,
    authMiddleware: (ctx: any) => Promise<any>
  ) {
    // Protected endpoints
    this.registerLinkRoute(app, basePath, authMiddleware);
    this.registerUnlinkRoute(app, basePath, authMiddleware);
    this.registerConnectionsRoute(app, basePath, authMiddleware);

    return app;
  }

  // =====================
  // Protected endpoints
  // =====================

  /**
   * POST /:provider/link - Link OAuth provider to authenticated user
   */
  private registerLinkRoute(
    app: any,
    basePath: string,
    authMiddleware: (ctx: any) => Promise<any>
  ) {
    app.post(
      `${basePath}/:provider/link`,
      async ({
        params,
        body,
        request,
        set,
        t,
      }: {
        params: { provider: string };
        body: { code: string; codeVerifier?: string };
        request: Request;
        set: any;
        t: TranslationFunctions;
      }) => {
        // Authenticate user
        const authResult = await authMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = 401;
          return {
            statusCode: 401,
            success: false as const,
            error: t.common.unauthorized(),
          };
        }

        const user = authResult.user as AuthenticatedUser;

        const command: LinkOAuthAccountCommand = {
          userId: user.userId,
          provider: params.provider,
          code: body.code,
          codeVerifier: body.codeVerifier,
          t,
        };

        const result = await this.linkOAuthAccountHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return {
            statusCode: 400,
            success: false as const,
            error: result.getError() as string,
          };
        }

        return {
          statusCode: 200,
          success: true as const,
          data: result.getValue(),
        };
      },
      {
        params: schema.Object({
          provider: ProviderParam,
        }),
        body: schema.Object({
          code: schema.String({
            description: 'Código de autorização recebido do provedor OAuth',
            example: '4/0AX4XfWh...7Q',
            minLength: 1
          }),
          codeVerifier: schema.Optional(schema.String({
            description: 'PKCE code verifier para validação de segurança',
            example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
            minLength: 43,
            maxLength: 128
          })),
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: schema.Object({
              provider: schema.String({
                description: 'Nome do provedor OAuth vinculado',
                example: 'google'
              }),
              email: schema.Union([schema.String({
                format: 'email',
                description: 'Email da conta OAuth',
                example: 'usuario@gmail.com'
              }), schema.Null()]),
              name: schema.Union([schema.String({
                description: 'Nome do usuário no provedor OAuth',
                example: 'João Silva'
              }), schema.Null()]),
              linkedAt: schema.String({
                format: 'date-time',
                description: 'Data e hora da vinculação',
                example: '2025-12-18T10:30:00.000Z'
              }),
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          409: ConflictResponse,
        },
        detail: {
          tags: ['OAuth'],
          summary: 'Vincular provedor OAuth à conta autenticada',
          description: `
Vincula um provedor OAuth (Google, Facebook, Apple) à conta do usuário atualmente autenticado. Permite login social adicional para a mesma conta.

**Pré-requisitos:**
- Usuário DEVE estar autenticado (token JWT válido no header Authorization)
- Usuário deve primeiro obter authorization URL chamando \`GET /v1/auth/oauth/:provider/authorize\`
- Após autorização no provedor, usar o \`code\` recebido para vincular

**Fluxo completo de vinculação:**

1. **Frontend obtém URL:** Chama \`GET /v1/auth/oauth/google/authorize\` (armazena state e codeVerifier)
2. **Usuário autoriza:** Redireciona para Google e autoriza acesso
3. **Callback:** Google retorna \`code\` e \`state\`
4. **Frontend valida:** Verifica se \`state\` corresponde ao armazenado
5. **Frontend vincula:** Chama este endpoint com token JWT + code + codeVerifier
6. **Backend valida:** Verifica se conta OAuth já não está vinculada a outro usuário
7. **Backend vincula:** Associa conta OAuth ao usuário autenticado
8. **Sucesso:** Usuário agora pode fazer login com email/senha OU com OAuth

**Benefícios de vincular múltiplos providers:**
- Usuário pode escolher método de login preferido
- Backup se esquecer senha ou perder acesso a um provider
- Maior flexibilidade de acesso à conta

**Casos de uso:**
- Usuário criou conta com email/senha e quer adicionar login do Google
- Usuário já tem Google e quer adicionar Facebook
- Usuário quer consolidar múltiplas contas OAuth em uma única conta

**Exemplo de implementação no frontend:**
\`\`\`javascript
// 1. Obter URL de autorização (armazenar state e codeVerifier)
const authResponse = await fetch('/v1/auth/oauth/google/authorize');
const { data: authData } = await authResponse.json();
sessionStorage.setItem('oauth_state', authData.state);
sessionStorage.setItem('oauth_code_verifier', authData.codeVerifier);

// 2. Redirecionar para Google
window.location.href = authData.authorizationUrl;

// 3. Após callback do Google, validar state
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const stateFromUrl = urlParams.get('state');
const storedState = sessionStorage.getItem('oauth_state');

if (stateFromUrl !== storedState) {
  throw new Error('State inválido');
}

// 4. Vincular à conta (com token JWT no header)
const accessToken = localStorage.getItem('access_token');
const codeVerifier = sessionStorage.getItem('oauth_code_verifier');

const linkResponse = await fetch('/v1/auth/oauth/google/link', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${accessToken}\`
  },
  body: JSON.stringify({ code, codeVerifier })
});

const result = await linkResponse.json();
if (result.success) {
  console.log('Google vinculado com sucesso!');
  // Limpar dados temporários
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_code_verifier');
}
\`\`\`

**Segurança:**
- Requer autenticação (JWT no header Authorization: Bearer <token>)
- Valida que conta OAuth não está vinculada a outro usuário
- Usa PKCE para proteger o fluxo OAuth
- Valida state para prevenir CSRF

**Erros possíveis:**

- \`400\`: Código de autorização inválido ou expirado
- \`400\`: Provider inválido ou não habilitado
- \`400\`: codeVerifier ausente quando PKCE está habilitado
- \`401\`: Token JWT ausente, inválido ou expirado
- \`401\`: Falha na autenticação com o provedor OAuth
- \`409\`: Esta conta do provedor já está vinculada a outro usuário
- \`409\`: Este provedor já está vinculado a esta conta (duplicata)

**Exemplo de resposta bem-sucedida:**
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "provider": "google",
    "email": "usuario@gmail.com",
    "name": "João Silva",
    "linkedAt": "2025-12-18T10:30:00.000Z"
  }
}
\`\`\`

**Exemplo de erro (conta já vinculada):**
\`\`\`json
{
  "statusCode": 409,
  "success": false,
  "error": "Esta conta do Google já está vinculada ao usuário user@example.com"
}
\`\`\`

**Exemplo de erro (não autenticado):**
\`\`\`json
{
  "statusCode": 401,
  "success": false,
  "error": "Token de acesso inválido ou expirado"
}
\`\`\`
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * DELETE /:provider/unlink - Unlink OAuth provider from user
   */
  private registerUnlinkRoute(
    app: any,
    basePath: string,
    authMiddleware: (ctx: any) => Promise<any>
  ) {
    app.delete(
      `${basePath}/:provider/unlink`,
      async ({ params, request, set, t }: { params: { provider: string }; request: Request; set: any; t: TranslationFunctions }) => {
        // Authenticate user
        const authResult = await authMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = 401;
          return {
            statusCode: 401,
            success: false as const,
            error: t.common.unauthorized(),
          };
        }

        const user = authResult.user as AuthenticatedUser;

        const command: UnlinkOAuthAccountCommand = {
          userId: user.userId,
          provider: params.provider,
          t,
        };

        const result = await this.unlinkOAuthAccountHandler.execute(command);

        if (result.isFailure) {
          set.status = 400;
          return {
            statusCode: 400,
            success: false as const,
            error: result.getError() as string,
          };
        }

        return {
          statusCode: 200,
          success: true as const,
          message: t.auth.oauth.unlinkSuccess({ provider: params.provider }),
        };
      },
      {
        params: schema.Object({
          provider: ProviderParam,
        }),
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            message: schema.String({
              description: 'Mensagem de confirmação da desvinculação',
              example: 'Provedor google desvinculado com sucesso'
            }),
          }),
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
        },
        detail: {
          tags: ['OAuth'],
          summary: 'Desvincular provedor OAuth da conta',
          description: `
Remove a conexão de um provedor OAuth da conta do usuário autenticado. Permite que o usuário remova métodos de login que não deseja mais usar.

**Pré-requisitos:**
- Usuário DEVE estar autenticado (token JWT válido no header Authorization)
- Usuário DEVE ter pelo menos um método alternativo de autenticação:
  - Senha definida OU
  - Outro provedor OAuth vinculado
- Provider DEVE estar atualmente vinculado à conta

**Proteção de conta:**
Este endpoint possui proteção contra bloqueio de conta. Não é possível desvincular o último método de autenticação.

**Cenários de bloqueio (erro 400):**
1. Usuário só tem Google vinculado, sem senha → NÃO pode desvincular Google
2. Usuário tem Google + senha → PODE desvincular Google (ainda pode usar senha)
3. Usuário tem Google + Facebook, sem senha → PODE desvincular Google (ainda pode usar Facebook)
4. Usuário tem Google + Facebook + senha → PODE desvincular qualquer um

**Casos de uso:**
- Usuário não quer mais usar login do Facebook
- Usuário quer trocar conta do Google (desvincula antiga, vincula nova)
- Usuário prefere usar apenas email/senha
- Por questões de privacidade, usuário quer remover conexões OAuth

**Exemplo de implementação no frontend:**
\`\`\`javascript
const accessToken = localStorage.getItem('access_token');

const response = await fetch('/v1/auth/oauth/google/unlink', {
  method: 'DELETE',
  headers: {
    'Authorization': \`Bearer \${accessToken}\`
  }
});

const result = await response.json();

if (result.success) {
  console.log(result.message);
  // Atualizar UI removendo botão de login do Google
} else if (response.status === 400) {
  // Usuário tentou remover último método de autenticação
  alert('Você precisa ter pelo menos um método de login. Defina uma senha primeiro.');
}
\`\`\`

**Fluxo de segurança:**
1. Frontend envia requisição DELETE com token JWT
2. Backend valida token e identifica usuário
3. Backend verifica se provider está vinculado
4. Backend conta métodos de autenticação disponíveis:
   - Senha definida? (+1)
   - Outros providers OAuth? (+N)
5. Se total > 1: permite desvinculação
6. Se total = 1: bloqueia desvinculação (erro 400)
7. Se permitido: remove vinculação OAuth do banco de dados

**Segurança:**
- Requer autenticação (JWT no header Authorization: Bearer <token>)
- Valida que não é o único método de autenticação
- Apenas o próprio usuário pode desvincular suas contas

**Erros possíveis:**

- \`400\`: Provider não está vinculado a esta conta
- \`400\`: Não é possível desvincular o único método de autenticação disponível
- \`400\`: Provider inválido (não é google, facebook ou apple)
- \`401\`: Token JWT ausente, inválido ou expirado
- \`401\`: Usuário não encontrado

**Exemplo de resposta bem-sucedida:**
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "message": "Provedor google desvinculado com sucesso"
}
\`\`\`

**Exemplo de erro (último método):**
\`\`\`json
{
  "statusCode": 400,
  "success": false,
  "error": "Não é possível desvincular o único método de autenticação. Defina uma senha ou vincule outro provedor antes de remover este."
}
\`\`\`

**Exemplo de erro (provider não vinculado):**
\`\`\`json
{
  "statusCode": 400,
  "success": false,
  "error": "O provedor facebook não está vinculado a esta conta"
}
\`\`\`

**Exemplo de erro (não autenticado):**
\`\`\`json
{
  "statusCode": 401,
  "success": false,
  "error": "Token de acesso inválido ou expirado"
}
\`\`\`

**Dica de UX:**
No frontend, antes de permitir a desvinculação, mostre aviso se é o último método:
\`\`\`javascript
// Verificar conexões antes de permitir unlink
const connectionsResponse = await fetch('/v1/auth/oauth/connections', {
  headers: { 'Authorization': \`Bearer \${accessToken}\` }
});
const { data } = await connectionsResponse.json();

const hasPassword = user.hasPassword; // assumindo que você tem essa info
const totalMethods = data.totalConnections + (hasPassword ? 1 : 0);

if (totalMethods === 1) {
  alert('Este é seu único método de login. Defina uma senha primeiro.');
  return;
}

// Prosseguir com unlink...
\`\`\`
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }

  /**
   * GET /connections - List user's OAuth connections
   */
  private registerConnectionsRoute(
    app: any,
    basePath: string,
    authMiddleware: (ctx: any) => Promise<any>
  ) {
    app.get(
      `${basePath}/connections`,
      async ({ request, set, t }: { request: Request; set: any; t: TranslationFunctions }) => {
        // Authenticate user
        const authResult = await authMiddleware({ request } as any);
        if (authResult instanceof Response) {
          set.status = 401;
          return {
            statusCode: 401,
            success: false as const,
            error: t.common.unauthorized(),
          };
        }

        const user = authResult.user as AuthenticatedUser;

        const query = new GetUserOAuthConnectionsQuery(user.userId, t);
        const result = await this.getUserOAuthConnectionsHandler.execute(query);

        if (result.isFailure) {
          set.status = 400;
          return {
            statusCode: 400,
            success: false as const,
            error: result.getError() as string,
          };
        }

        return {
          statusCode: 200,
          success: true as const,
          data: result.getValue(),
        };
      },
      {
        response: {
          200: OAuthConnectionsListResponse,
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
        },
        detail: {
          tags: ['OAuth'],
          summary: 'Listar conexões OAuth do usuário',
          description: `
Retorna todas as contas OAuth (Google, Facebook, Apple) vinculadas à conta do usuário autenticado, com detalhes de cada conexão.

**Pré-requisitos:**
- Usuário DEVE estar autenticado (token JWT válido no header Authorization)

**Informações retornadas para cada conexão:**
- \`provider\`: Nome do provedor OAuth (google, facebook, apple)
- \`email\`: Email da conta OAuth vinculada
- \`name\`: Nome do usuário no provedor OAuth
- \`avatarUrl\`: URL da foto de perfil (pode ser usada na UI)
- \`linkedAt\`: Data e hora em que a vinculação foi feita

**Casos de uso:**
- Mostrar na página de configurações quais métodos de login estão disponíveis
- Exibir avatar e nome das contas vinculadas
- Permitir que usuário gerencie suas conexões (vincular/desvincular)
- Validar se usuário pode desvincular um provider (checar se há outros métodos)

**Exemplo de implementação no frontend:**
\`\`\`javascript
const accessToken = localStorage.getItem('access_token');

const response = await fetch('/v1/auth/oauth/connections', {
  headers: {
    'Authorization': \`Bearer \${accessToken}\`
  }
});

const result = await response.json();

if (result.success) {
  const { connections, totalConnections } = result.data;

  console.log(\`Você tem \${totalConnections} conexão(ões) OAuth:\`);

  connections.forEach(conn => {
    console.log(\`- \${conn.provider}: \${conn.email}\`);
    // Renderizar na UI com avatar, nome, email
  });

  // Verificar se pode desvincular
  const hasPassword = user.hasPassword;
  const canUnlink = totalConnections > 1 || hasPassword;

  if (!canUnlink) {
    showWarning('Defina uma senha antes de desvincular sua única conexão OAuth');
  }
}
\`\`\`

**Exemplo de UI com base neste endpoint:**
\`\`\`jsx
// React component exemplo
function OAuthConnections() {
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    const response = await fetch('/v1/auth/oauth/connections', {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    const { data } = await response.json();
    setConnections(data.connections);
  };

  return (
    <div>
      <h2>Contas Vinculadas ({connections.length})</h2>
      {connections.map(conn => (
        <div key={conn.provider}>
          <img src={conn.avatarUrl} alt={conn.name} />
          <div>
            <strong>{conn.name}</strong>
            <p>{conn.email}</p>
            <small>Vinculado em {new Date(conn.linkedAt).toLocaleDateString()}</small>
          </div>
          <button onClick={() => handleUnlink(conn.provider)}>
            Desvincular
          </button>
        </div>
      ))}
    </div>
  );
}
\`\`\`

**Segurança:**
- Requer autenticação (JWT no header Authorization: Bearer <token>)
- Retorna apenas conexões do usuário autenticado
- Não expõe informações de outros usuários

**Possíveis cenários de resposta:**

1. **Usuário sem conexões OAuth:**
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "connections": [],
    "totalConnections": 0
  }
}
\`\`\`

2. **Usuário com múltiplas conexões:**
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "connections": [
      {
        "provider": "google",
        "email": "usuario@gmail.com",
        "name": "João Silva",
        "avatarUrl": "https://lh3.googleusercontent.com/a/...",
        "linkedAt": "2025-12-18T10:30:00.000Z"
      },
      {
        "provider": "facebook",
        "email": "joao.silva@facebook.com",
        "name": "João Silva",
        "avatarUrl": "https://graph.facebook.com/.../picture",
        "linkedAt": "2025-12-15T14:20:00.000Z"
      }
    ],
    "totalConnections": 2
  }
}
\`\`\`

**Erros possíveis:**

- \`400\`: Erro ao buscar conexões (raro, problema no banco de dados)
- \`401\`: Token JWT ausente, inválido ou expirado
- \`401\`: Usuário não encontrado

**Exemplo de erro (não autenticado):**
\`\`\`json
{
  "statusCode": 401,
  "success": false,
  "error": "Token de acesso inválido ou expirado"
}
\`\`\`

**Notas:**
- Campos \`email\`, \`name\` e \`avatarUrl\` podem ser \`null\` se o provedor não forneceu a informação
- A ordem das conexões é determinada por \`linkedAt\` (mais recentes primeiro)
- \`totalConnections\` facilita exibir contadores sem iterar o array
- Este endpoint é útil para construir páginas de "Configurações de Conta" ou "Segurança"

**Integração com outros endpoints:**
Use em conjunto com:
- \`POST /v1/auth/oauth/:provider/link\` - Para adicionar novas conexões
- \`DELETE /v1/auth/oauth/:provider/unlink\` - Para remover conexões
- \`GET /v1/auth/oauth/providers\` - Para mostrar providers disponíveis para vincular
          `,
          security: [{ bearerAuth: [] }],
        },
      }
    );
  }
}
