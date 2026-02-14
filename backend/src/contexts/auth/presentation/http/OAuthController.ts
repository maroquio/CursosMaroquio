import type { Elysia } from 'elysia';
import { t as schema } from 'elysia';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import type { OAuthLoginCommand } from '../../application/commands/oauth-login/OAuthLoginCommand.ts';
import { OAuthLoginHandler } from '../../application/commands/oauth-login/OAuthLoginHandler.ts';
import { GetOAuthAuthorizationUrlQuery } from '../../application/queries/get-oauth-authorization-url/GetOAuthAuthorizationUrlQuery.ts';
import { GetOAuthAuthorizationUrlHandler } from '../../application/queries/get-oauth-authorization-url/GetOAuthAuthorizationUrlHandler.ts';
import type { ITokenService } from '../../domain/services/ITokenService.ts';
import type { IOAuthService } from '../../domain/services/IOAuthService.ts';
import {
  extractClientInfo,
} from '../middleware/AuthMiddleware.ts';
import { setRefreshTokenCookie } from '@shared/presentation/http/CookieHelper.ts';

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

// Schema de URL de autorização OAuth
const OAuthUrlResponse = schema.Object({
  statusCode: schema.Literal(200),
  success: schema.Literal(true),
  data: schema.Object({
    authorizationUrl: schema.String({
      description: 'URL para redirecionar o usuário para autorização OAuth no provedor',
      example: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&state=abc123&code_challenge=...'
    }),
    state: schema.String({
      description: 'Parâmetro state para proteção CSRF. OBRIGATÓRIO armazenar no cliente (localStorage/sessionStorage)',
      example: 'abc123-random-state-value'
    }),
    codeVerifier: schema.Optional(schema.String({
      description: 'PKCE code verifier. OBRIGATÓRIO armazenar no cliente para enviar no callback. Usado para maior segurança no fluxo OAuth.',
      example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
    })),
  }),
});

// Schema de resposta de login OAuth
const OAuthLoginResponse = schema.Object({
  statusCode: schema.Literal(200),
  success: schema.Literal(true),
  data: schema.Object({
    accessToken: schema.String({
      description: 'Token JWT de acesso para autenticação nas requisições',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }),
    refreshToken: schema.String({
      description: 'Token de atualização para obter novos tokens de acesso',
      example: 'rt_abc123def456...'
    }),
    expiresIn: schema.Number({
      description: 'Tempo de expiração do token de acesso em segundos',
      example: 900
    }),
    user: schema.Object({
      id: schema.String({
        description: 'ID único do usuário',
        example: 'usr_123abc456def'
      }),
      email: schema.String({
        format: 'email',
        description: 'Email do usuário',
        example: 'usuario@exemplo.com'
      }),
      roles: schema.Array(schema.String({
        description: 'Papel/função do usuário',
        example: 'user'
      }), {
        description: 'Lista de papéis atribuídos ao usuário',
        example: ['user']
      }),
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
 * OAuthController
 * Handles HTTP requests for OAuth authentication (login/callback and provider listing)
 *
 * Routes:
 * - GET  /oauth/:provider/authorize  - Get OAuth authorization URL
 * - POST /oauth/:provider/callback   - Handle OAuth callback, return JWT
 * - GET  /oauth/providers            - List enabled OAuth providers
 */
export class OAuthController {
  constructor(
    private oauthLoginHandler: OAuthLoginHandler,
    private getOAuthAuthorizationUrlHandler: GetOAuthAuthorizationUrlHandler,
    private tokenService: ITokenService,
    private oauthService: IOAuthService
  ) {}

  /**
   * Register OAuth routes
   * Routes are registered under /v1/auth/oauth/* prefix
   */
  public routes(app: any) {
    // Register versioned routes
    this.registerOAuthRoutes(app, '/v1/auth/oauth');

    return app;
  }

  /**
   * Register OAuth routes under a specific base path
   */
  private registerOAuthRoutes(
    app: any,
    basePath: string
  ) {
    // Public endpoints
    this.registerGetProvidersRoute(app, basePath);
    this.registerAuthorizeRoute(app, basePath);
    this.registerCallbackRoute(app, basePath);

    return app;
  }

  // =====================
  // Public endpoints
  // =====================

  /**
   * GET /providers - List enabled OAuth providers
   */
  private registerGetProvidersRoute(app: any, basePath: string) {
    app.get(
      `${basePath}/providers`,
      async () => {
        const providers = this.oauthService.getEnabledProviders();
        return {
          statusCode: 200,
          success: true,
          data: {
            providers: providers.map((p) => p.getValue()),
          },
        };
      },
      {
        response: {
          200: schema.Object({
            statusCode: schema.Literal(200),
            success: schema.Literal(true),
            data: schema.Object({
              providers: schema.Array(schema.String({
                description: 'Nome do provedor OAuth habilitado',
                example: 'google'
              }), {
                description: 'Lista de provedores OAuth configurados e disponíveis',
                example: ['google', 'facebook', 'apple']
              }),
            }),
          }),
        },
        detail: {
          tags: ['OAuth'],
          summary: 'Listar provedores OAuth habilitados',
          description: `
Retorna a lista de provedores OAuth que estão configurados e disponíveis para uso na aplicação.

**Uso típico:**
- Frontend chama este endpoint para exibir botões de login social dinamicamente
- Apenas provedores configurados corretamente no backend são retornados
- Não requer autenticação (endpoint público)

**Provedores possíveis:**
- \`google\`: Login com Google (OAuth 2.0)
- \`facebook\`: Login com Facebook (OAuth 2.0)
- \`apple\`: Login com Apple ID (OAuth 2.0 + OpenID Connect)

**Exemplo de resposta:**
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "providers": ["google", "facebook"]
  }
}
\`\`\`

**Nota:** A lista retornada depende da configuração do backend (variáveis de ambiente).
          `,
        },
      }
    );
  }

  /**
   * GET /:provider/authorize - Get OAuth authorization URL
   */
  private registerAuthorizeRoute(app: any, basePath: string) {
    app.get(
      `${basePath}/:provider/authorize`,
      async ({ params, t }: { params: { provider: string }; t: TranslationFunctions }) => {
        const query = new GetOAuthAuthorizationUrlQuery(params.provider, undefined, undefined, t);
        const result = await this.getOAuthAuthorizationUrlHandler.execute(query);

        if (result.isFailure) {
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
        response: {
          200: OAuthUrlResponse,
          400: ValidationErrorResponse,
        },
        detail: {
          tags: ['OAuth'],
          summary: 'Obter URL de autorização OAuth',
          description: `
Retorna a URL de autorização OAuth para iniciar o fluxo de login social com o provedor especificado.

**Fluxo completo de uso:**

1. **Frontend solicita URL:** Chama este endpoint \`GET /v1/auth/oauth/:provider/authorize\`
2. **Backend gera URL:** Retorna \`authorizationUrl\`, \`state\` e \`codeVerifier\`
3. **Frontend armazena dados:** Salva \`state\` e \`codeVerifier\` no \`sessionStorage\` ou \`localStorage\`
4. **Redirecionamento:** Frontend redireciona usuário para \`authorizationUrl\`
5. **Usuário autoriza:** Usuário faz login no provedor (Google/Facebook/Apple) e autoriza a aplicação
6. **Callback do provedor:** Provedor redireciona de volta para a aplicação com \`code\` e \`state\` na URL
7. **Frontend valida state:** Verifica se o \`state\` recebido corresponde ao armazenado
8. **Frontend envia callback:** Chama \`POST /v1/auth/oauth/:provider/callback\` com \`code\` e \`codeVerifier\`
9. **Backend processa:** Troca o \`code\` por tokens e retorna JWT

**Segurança (PKCE - Proof Key for Code Exchange):**
- \`state\`: Protege contra ataques CSRF (Cross-Site Request Forgery)
- \`codeVerifier\`: Comprova que o cliente que iniciou o fluxo é o mesmo que está finalizando
- PKCE adiciona camada extra de segurança, especialmente importante em aplicações públicas

**Armazenamento no frontend (exemplo):**
\`\`\`javascript
const response = await fetch('/v1/auth/oauth/google/authorize');
const { data } = await response.json();

// Armazenar para uso posterior no callback
sessionStorage.setItem('oauth_state', data.state);
sessionStorage.setItem('oauth_code_verifier', data.codeVerifier);

// Redirecionar usuário
window.location.href = data.authorizationUrl;
\`\`\`

**Providers suportados:**
- \`google\`: Login com Google (OAuth 2.0)
- \`facebook\`: Login com Facebook (OAuth 2.0)
- \`apple\`: Login com Apple ID (OAuth 2.0 + OpenID Connect)

**Erros possíveis:**
- \`400\`: Provider inválido ou não habilitado no backend
- \`400\`: Provider não configurado corretamente (faltam variáveis de ambiente)

**Exemplo de resposta bem-sucedida:**
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&state=abc123&code_challenge=...",
    "state": "abc123-random-state-value",
    "codeVerifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
  }
}
\`\`\`

**Exemplo de erro:**
\`\`\`json
{
  "statusCode": 400,
  "success": false,
  "error": "Provider 'instagram' não é válido. Use google, facebook ou apple."
}
\`\`\`
          `,
        },
      }
    );
  }

  /**
   * POST /:provider/callback - Handle OAuth callback
   */
  private registerCallbackRoute(app: any, basePath: string) {
    app.post(
      `${basePath}/:provider/callback`,
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
        const { userAgent, ipAddress } = extractClientInfo({ request } as any);

        const command: OAuthLoginCommand = {
          provider: params.provider,
          code: body.code,
          codeVerifier: body.codeVerifier,
          userAgent,
          ipAddress,
          t,
        };

        const result = await this.oauthLoginHandler.execute(command);

        if (result.isFailure) {
          set.status = 401;
          return {
            statusCode: 401,
            success: false as const,
            error: result.getError() as string,
          };
        }

        const data = result.getValue();

        // Set refresh token as HttpOnly cookie
        setRefreshTokenCookie(set, data.refreshToken);

        return {
          statusCode: 200,
          success: true as const,
          data: {
            accessToken: data.accessToken,
            expiresIn: data.expiresIn,
            user: data.user,
          },
        };
      },
      {
        params: schema.Object({
          provider: ProviderParam,
        }),
        body: schema.Object({
          code: schema.String({
            description: 'Código de autorização recebido do provedor OAuth na URL de callback',
            example: '4/0AX4XfWh...7Q',
            minLength: 1
          }),
          codeVerifier: schema.Optional(
            schema.String({
              description: 'PKCE code verifier armazenado no frontend. OBRIGATÓRIO corresponder ao usado na geração da authorization URL',
              example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
              minLength: 43,
              maxLength: 128
            })
          ),
        }),
        response: {
          200: OAuthLoginResponse,
          400: ValidationErrorResponse,
          401: UnauthorizedResponse,
          409: ConflictResponse,
        },
        detail: {
          tags: ['OAuth'],
          summary: 'Processar callback OAuth e realizar login',
          description: `
Finaliza o fluxo OAuth trocando o código de autorização por tokens de acesso. Cria novo usuário se necessário ou autentica usuário existente.

**Fluxo do callback:**

1. **Provedor redireciona:** Após autorização, provedor redireciona para URL configurada com \`code\` e \`state\` na query string
2. **Frontend valida state:** Verifica se \`state\` recebido corresponde ao armazenado anteriormente
3. **Frontend recupera dados:** Busca \`codeVerifier\` armazenado no passo 1 (sessionStorage/localStorage)
4. **Frontend chama callback:** Envia \`POST\` para este endpoint com \`code\` e \`codeVerifier\`
5. **Backend valida PKCE:** Verifica se \`codeVerifier\` corresponde ao \`code_challenge\` usado na authorization URL
6. **Backend troca code:** Faz requisição ao provedor OAuth para trocar \`code\` por access token
7. **Backend busca perfil:** Obtém informações do usuário do provedor OAuth
8. **Backend processa conta:**
   - Se usuário OAuth já existe: faz login
   - Se email já existe com outro método: retorna erro 409 (conflito)
   - Se é novo usuário: cria conta automaticamente
9. **Backend retorna tokens:** Gera e retorna JWT access token + refresh token

**Exemplo de implementação no frontend:**
\`\`\`javascript
// 1. Capturar code e state da URL de callback
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const stateFromUrl = urlParams.get('state');

// 2. Validar state
const storedState = sessionStorage.getItem('oauth_state');
if (stateFromUrl !== storedState) {
  throw new Error('State inválido - possível ataque CSRF');
}

// 3. Recuperar codeVerifier
const codeVerifier = sessionStorage.getItem('oauth_code_verifier');

// 4. Chamar callback
const response = await fetch('/v1/auth/oauth/google/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, codeVerifier })
});

const result = await response.json();

if (result.success) {
  // 5. Armazenar tokens
  localStorage.setItem('access_token', result.data.accessToken);
  localStorage.setItem('refresh_token', result.data.refreshToken);

  // 6. Limpar dados OAuth temporários
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_code_verifier');

  // 7. Redirecionar para aplicação
  window.location.href = '/dashboard';
}
\`\`\`

**Comportamento de criação de conta:**
- Novos usuários são criados automaticamente sem necessidade de registro separado
- Email do provedor OAuth é usado como identificador principal
- Usuário recebe papel/role padrão (\`user\`)
- Senha não é definida (conta OAuth-only)

**Segurança PKCE:**
- \`codeVerifier\` deve ter entre 43-128 caracteres
- Backend valida que \`codeVerifier\` corresponde ao \`code_challenge\` enviado na authorization URL
- Protege contra ataques de interceptação de código

**Erros possíveis:**

- \`400\`: Código inválido ou expirado
- \`400\`: Provider inválido
- \`400\`: codeVerifier ausente quando PKCE está habilitado
- \`401\`: Falha na autenticação com o provedor OAuth
- \`401\`: Token de acesso do provedor inválido
- \`409\`: Email da conta OAuth já está vinculado a outro usuário (conta criada com email/senha ou outro provider)

**Exemplo de resposta bem-sucedida (novo usuário):**
\`\`\`json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rt_abc123def456...",
    "expiresIn": 900,
    "user": {
      "id": "usr_123abc456def",
      "email": "usuario@gmail.com",
      "roles": ["user"]
    }
  }
}
\`\`\`

**Exemplo de erro de conflito:**
\`\`\`json
{
  "statusCode": 409,
  "success": false,
  "error": "O email usuario@gmail.com já está registrado com outro método de autenticação"
}
\`\`\`

**Exemplo de erro de código inválido:**
\`\`\`json
{
  "statusCode": 401,
  "success": false,
  "error": "Código de autorização inválido ou expirado"
}
\`\`\`
          `,
        },
      }
    );
  }
}
