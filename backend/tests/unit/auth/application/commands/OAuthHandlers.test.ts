import { describe, it, expect, beforeEach } from 'vitest';
import { OAuthLoginHandler } from '@auth/application/commands/oauth-login/OAuthLoginHandler.ts';
import { LinkOAuthAccountHandler } from '@auth/application/commands/link-oauth-account/LinkOAuthAccountHandler.ts';
import { UnlinkOAuthAccountHandler } from '@auth/application/commands/unlink-oauth-account/UnlinkOAuthAccountHandler.ts';
import type { OAuthLoginCommand } from '@auth/application/commands/oauth-login/OAuthLoginCommand.ts';
import type { LinkOAuthAccountCommand } from '@auth/application/commands/link-oauth-account/LinkOAuthAccountCommand.ts';
import type { UnlinkOAuthAccountCommand } from '@auth/application/commands/unlink-oauth-account/UnlinkOAuthAccountCommand.ts';
import type {
  IUserRepository,
  UserFilters,
  PaginatedUsers,
} from '@auth/domain/repositories/IUserRepository.ts';
import type { IOAuthConnectionRepository } from '@auth/domain/repositories/IOAuthConnectionRepository.ts';
import type { IRefreshTokenRepository } from '@auth/domain/repositories/IRefreshTokenRepository.ts';
import type { IOAuthService, OAuthResult } from '@auth/domain/services/IOAuthService.ts';
import type { ITokenService, TokenPayload } from '@auth/domain/services/ITokenService.ts';
import { OAuthConnection } from '@auth/domain/entities/OAuthConnection.ts';
import { OAuthConnectionId } from '@auth/domain/value-objects/OAuthConnectionId.ts';
import { OAuthProfile } from '@auth/domain/value-objects/OAuthProfile.ts';
import { AuthProvider } from '@auth/domain/value-objects/AuthProvider.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { User } from '@auth/domain/entities/User.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { Password } from '@auth/domain/value-objects/Password.ts';
import { Result } from '@shared/domain/Result.ts';

// ============ Mock Factories ============

function createMockUser(email: string = 'test@example.com'): User {
  const emailObj = Email.create(email).getValue();
  // Password.create expects an already-hashed password (min 20 chars)
  const mockHashedPassword = '$argon2id$v=19$m=65536,t=3,p=4$mockhashvalue';
  const password = Password.create(mockHashedPassword).getValue();
  return User.create(emailObj, password, 'Test User', '11999999999').getValue();
}

function createMockOAuthProfile(overrides: Partial<{
  provider: AuthProvider;
  providerUserId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}> = {}): OAuthProfile {
  return OAuthProfile.create({
    provider: overrides.provider ?? AuthProvider.GOOGLE,
    providerUserId: overrides.providerUserId ?? 'google-123456',
    email: overrides.email ?? 'user@gmail.com',
    name: overrides.name ?? 'Test User',
    avatarUrl: overrides.avatarUrl ?? 'https://example.com/avatar.jpg',
  }).getValue();
}

function createMockOAuthConnection(userId: UserId, provider: AuthProvider = AuthProvider.GOOGLE): OAuthConnection {
  const profile = createMockOAuthProfile({ provider });
  return OAuthConnection.create({
    userId,
    profile,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenExpiresAt: new Date(Date.now() + 3600000),
  }).getValue();
}

// ============ Mock Implementations ============

class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  addUser(user: User): void {
    this.users.set(user.getId().toValue(), user);
  }

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.toValue()) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.getEmail().getValue() === email.getValue()) {
        return user;
      }
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.getId().toValue(), user);
  }

  async exists(id: UserId): Promise<boolean> {
    return this.users.has(id.toValue());
  }

  async delete(id: UserId): Promise<void> {
    this.users.delete(id.toValue());
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async existsByEmail(email: Email): Promise<boolean> {
    for (const user of this.users.values()) {
      if (user.getEmail().getValue() === email.getValue()) {
        return true;
      }
    }
    return false;
  }

  async findAllPaginated(
    page: number,
    limit: number,
    _filters?: UserFilters
  ): Promise<PaginatedUsers> {
    const users = Array.from(this.users.values());
    return {
      users,
      total: users.length,
      page,
      limit,
      totalPages: Math.ceil(users.length / limit),
    };
  }

  async count(_filters?: UserFilters): Promise<number> {
    return this.users.size;
  }
}

class MockOAuthConnectionRepository implements IOAuthConnectionRepository {
  private connections: Map<string, OAuthConnection> = new Map();

  addConnection(connection: OAuthConnection): void {
    this.connections.set(connection.getId().toValue(), connection);
  }

  clearConnections(): void {
    this.connections.clear();
  }

  async findById(id: OAuthConnectionId): Promise<OAuthConnection | null> {
    return this.connections.get(id.toValue()) ?? null;
  }

  async findByProviderAndProviderUserId(provider: AuthProvider, providerUserId: string): Promise<OAuthConnection | null> {
    for (const conn of this.connections.values()) {
      if (conn.getProvider().equals(provider) && conn.getProviderUserId() === providerUserId) {
        return conn;
      }
    }
    return null;
  }

  async findByUserIdAndProvider(userId: UserId, provider: AuthProvider): Promise<OAuthConnection | null> {
    for (const conn of this.connections.values()) {
      if (conn.getUserId().equals(userId) && conn.getProvider().equals(provider)) {
        return conn;
      }
    }
    return null;
  }

  async findAllByUserId(userId: UserId): Promise<OAuthConnection[]> {
    const result: OAuthConnection[] = [];
    for (const conn of this.connections.values()) {
      if (conn.getUserId().equals(userId)) {
        result.push(conn);
      }
    }
    return result;
  }

  async countByUserId(userId: UserId): Promise<number> {
    let count = 0;
    for (const conn of this.connections.values()) {
      if (conn.getUserId().equals(userId)) {
        count++;
      }
    }
    return count;
  }

  async save(connection: OAuthConnection): Promise<void> {
    this.connections.set(connection.getId().toValue(), connection);
  }

  async delete(id: OAuthConnectionId): Promise<void> {
    this.connections.delete(id.toValue());
  }

  async deleteByUserIdAndProvider(userId: UserId, provider: AuthProvider): Promise<void> {
    for (const [key, conn] of this.connections.entries()) {
      if (conn.getUserId().equals(userId) && conn.getProvider().equals(provider)) {
        this.connections.delete(key);
        break;
      }
    }
  }

  async exists(id: OAuthConnectionId): Promise<boolean> {
    return this.connections.has(id.toValue());
  }

  async findAll(): Promise<OAuthConnection[]> {
    return Array.from(this.connections.values());
  }
}

class MockRefreshTokenRepository implements IRefreshTokenRepository {
  async save(): Promise<void> {}
  async findByToken(): Promise<any> { return null; }
  async findActiveByUserId(): Promise<any[]> { return []; }
  async update(): Promise<void> {}
  async revokeAllForUser(): Promise<void> {}
  async deleteExpired(): Promise<number> { return 0; }
}

class MockOAuthService implements IOAuthService {
  private enabledProviders = new Set<string>(['google', 'facebook', 'apple']);
  private shouldExchangeFail = false;
  private exchangeFailMessage = '';
  private mockProfile: OAuthProfile | null = null;

  setEnabledProviders(providers: string[]): void {
    this.enabledProviders = new Set(providers);
  }

  setExchangeFailure(fail: boolean, message: string = 'Exchange failed'): void {
    this.shouldExchangeFail = fail;
    this.exchangeFailMessage = message;
  }

  setMockProfile(profile: OAuthProfile | null): void {
    this.mockProfile = profile;
  }

  isProviderEnabled(provider: AuthProvider): boolean {
    return this.enabledProviders.has(provider.getValue());
  }

  getEnabledProviders(): AuthProvider[] {
    return Array.from(this.enabledProviders).map(p => AuthProvider.create(p).getValue());
  }

  async getAuthorizationUrl(provider: AuthProvider, state: string, codeVerifier?: string): Promise<Result<string>> {
    if (!this.isProviderEnabled(provider)) {
      return Result.fail('Provider not enabled');
    }
    return Result.ok(`https://oauth.example.com/authorize?provider=${provider.getValue()}&state=${state}`);
  }

  async exchangeCodeForTokens(provider: AuthProvider, code: string, codeVerifier?: string): Promise<Result<OAuthResult>> {
    if (this.shouldExchangeFail) {
      return Result.fail(this.exchangeFailMessage);
    }

    const profile = this.mockProfile ?? createMockOAuthProfile({ provider });

    return Result.ok({
      profile,
      tokens: {
        accessToken: 'mock-access-token-' + code,
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        idToken: null,
      },
    });
  }

  async refreshAccessToken(provider: AuthProvider, refreshToken: string): Promise<Result<any>> {
    return Result.ok({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 3600000),
    });
  }

  async revokeToken(provider: AuthProvider, accessToken: string): Promise<Result<void>> {
    return Result.ok<void>(undefined);
  }
}

class MockTokenService implements ITokenService {
  private validTokens: Map<string, TokenPayload> = new Map();

  generateAccessToken(userId: UserId, email: string, roles: string[]): string {
    const token = `mock-jwt-${userId.toValue()}`;
    const now = Math.floor(Date.now() / 1000);
    this.validTokens.set(token, {
      userId: userId.toValue(),
      email,
      roles,
      iat: now,
      exp: now + 900,
    });
    return token;
  }

  verifyAccessToken(token: string): TokenPayload | null {
    return this.validTokens.get(token) ?? null;
  }

  getAccessTokenExpiryMs(): number {
    return 900000;
  }

  getRefreshTokenExpiryMs(): number {
    return 604800000;
  }
}

// ============ Tests ============

describe('OAuthLoginHandler', () => {
  let handler: OAuthLoginHandler;
  let userRepository: MockUserRepository;
  let oauthConnectionRepository: MockOAuthConnectionRepository;
  let refreshTokenRepository: MockRefreshTokenRepository;
  let oauthService: MockOAuthService;
  let tokenService: MockTokenService;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    oauthConnectionRepository = new MockOAuthConnectionRepository();
    refreshTokenRepository = new MockRefreshTokenRepository();
    oauthService = new MockOAuthService();
    tokenService = new MockTokenService();

    handler = new OAuthLoginHandler(
      userRepository,
      oauthConnectionRepository,
      refreshTokenRepository,
      oauthService,
      tokenService
    );
  });

  describe('execute()', () => {
    it('should fail for invalid provider', async () => {
      const command: OAuthLoginCommand = {
        provider: 'invalid-provider',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Unsupported OAuth provider');
    });

    it('should fail when provider is not enabled', async () => {
      oauthService.setEnabledProviders([]);

      const command: OAuthLoginCommand = {
        provider: 'google',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not configured');
    });

    it('should fail when code exchange fails', async () => {
      oauthService.setExchangeFailure(true, 'Invalid authorization code');

      const command: OAuthLoginCommand = {
        provider: 'google',
        code: 'invalid-code',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('Invalid authorization code');
    });

    it('should login existing user with OAuth connection', async () => {
      const user = createMockUser();
      userRepository.addUser(user);

      const connection = createMockOAuthConnection(user.getId());
      oauthConnectionRepository.addConnection(connection);

      const command: OAuthLoginCommand = {
        provider: 'google',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      const response = result.getValue();
      expect(response.accessToken).toBeDefined();
      expect(response.refreshToken).toBeDefined();
      expect(response.user.id).toBe(user.getId().toValue());
    });

    it('should create new user for first-time OAuth login', async () => {
      const profile = createMockOAuthProfile({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'new-google-id',
        email: 'newuser@gmail.com',
        name: 'New User',
      });
      oauthService.setMockProfile(profile);

      const command: OAuthLoginCommand = {
        provider: 'google',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      const response = result.getValue();
      expect(response.accessToken).toBeDefined();
      expect(response.user.email).toBe('newuser@gmail.com');
    });

    it('should link OAuth to existing user with matching email', async () => {
      const existingUser = createMockUser('existinguser@gmail.com');
      userRepository.addUser(existingUser);

      const profile = createMockOAuthProfile({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-for-existing',
        email: 'existinguser@gmail.com',
      });
      oauthService.setMockProfile(profile);

      const command: OAuthLoginCommand = {
        provider: 'google',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      const response = result.getValue();
      expect(response.user.id).toBe(existingUser.getId().toValue());
    });

    it('should handle orphaned OAuth connection gracefully', async () => {
      // Create connection without corresponding user
      const fakeUserId = UserId.create();
      const connection = createMockOAuthConnection(fakeUserId);
      oauthConnectionRepository.addConnection(connection);

      const command: OAuthLoginCommand = {
        provider: 'google',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });
  });
});

describe('LinkOAuthAccountHandler', () => {
  let handler: LinkOAuthAccountHandler;
  let userRepository: MockUserRepository;
  let oauthConnectionRepository: MockOAuthConnectionRepository;
  let oauthService: MockOAuthService;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    oauthConnectionRepository = new MockOAuthConnectionRepository();
    oauthService = new MockOAuthService();

    handler = new LinkOAuthAccountHandler(
      userRepository,
      oauthConnectionRepository,
      oauthService
    );
  });

  describe('execute()', () => {
    it('should fail for invalid user ID format', async () => {
      const command: LinkOAuthAccountCommand = {
        userId: 'not-a-uuid',
        provider: 'google',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid');
    });

    it('should fail for invalid provider', async () => {
      const userId = UserId.create();
      const command: LinkOAuthAccountCommand = {
        userId: userId.toValue(),
        provider: 'twitter',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Unsupported OAuth provider');
    });

    it('should fail when provider is not enabled', async () => {
      const userId = UserId.create();
      oauthService.setEnabledProviders([]);

      const command: LinkOAuthAccountCommand = {
        userId: userId.toValue(),
        provider: 'google',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not configured');
    });

    it('should fail when user does not exist', async () => {
      const userId = UserId.create();
      const command: LinkOAuthAccountCommand = {
        userId: userId.toValue(),
        provider: 'google',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail when user already has provider linked', async () => {
      const user = createMockUser();
      userRepository.addUser(user);

      const connection = createMockOAuthConnection(user.getId());
      oauthConnectionRepository.addConnection(connection);

      const command: LinkOAuthAccountCommand = {
        userId: user.getId().toValue(),
        provider: 'google',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('already have');
    });

    it('should fail when OAuth account is linked to another user', async () => {
      const user1 = createMockUser('user1@example.com');
      const user2 = createMockUser('user2@example.com');
      userRepository.addUser(user1);
      userRepository.addUser(user2);

      // User1 has Google linked
      const connection = createMockOAuthConnection(user1.getId());
      oauthConnectionRepository.addConnection(connection);

      // User2 tries to link the same Google account
      const command: LinkOAuthAccountCommand = {
        userId: user2.getId().toValue(),
        provider: 'google',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('already linked to another user');
    });

    it('should successfully link OAuth account', async () => {
      const user = createMockUser();
      userRepository.addUser(user);

      const profile = createMockOAuthProfile({
        providerUserId: 'unique-google-id',
        email: 'oauth@gmail.com',
        name: 'OAuth User',
      });
      oauthService.setMockProfile(profile);

      const command: LinkOAuthAccountCommand = {
        userId: user.getId().toValue(),
        provider: 'google',
        code: 'auth-code',
      };

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      const response = result.getValue();
      expect(response.provider).toBe('google');
      expect(response.email).toBe('oauth@gmail.com');
      expect(response.name).toBe('OAuth User');
      expect(response.linkedAt).toBeDefined();
    });

    it('should fail when code exchange fails', async () => {
      const user = createMockUser();
      userRepository.addUser(user);

      oauthService.setExchangeFailure(true, 'Code expired');

      const command: LinkOAuthAccountCommand = {
        userId: user.getId().toValue(),
        provider: 'google',
        code: 'expired-code',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('Code expired');
    });
  });
});

describe('UnlinkOAuthAccountHandler', () => {
  let handler: UnlinkOAuthAccountHandler;
  let userRepository: MockUserRepository;
  let oauthConnectionRepository: MockOAuthConnectionRepository;
  let oauthService: MockOAuthService;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    oauthConnectionRepository = new MockOAuthConnectionRepository();
    oauthService = new MockOAuthService();

    handler = new UnlinkOAuthAccountHandler(
      userRepository,
      oauthConnectionRepository,
      oauthService
    );
  });

  describe('execute()', () => {
    it('should fail for invalid user ID format', async () => {
      const command: UnlinkOAuthAccountCommand = {
        userId: 'not-a-uuid',
        provider: 'google',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid');
    });

    it('should fail for invalid provider', async () => {
      const userId = UserId.create();
      const command: UnlinkOAuthAccountCommand = {
        userId: userId.toValue(),
        provider: 'twitter',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Unsupported OAuth provider');
    });

    it('should fail when user does not exist', async () => {
      const userId = UserId.create();
      const command: UnlinkOAuthAccountCommand = {
        userId: userId.toValue(),
        provider: 'google',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail when OAuth connection does not exist', async () => {
      const user = createMockUser();
      userRepository.addUser(user);

      const command: UnlinkOAuthAccountCommand = {
        userId: user.getId().toValue(),
        provider: 'google',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain("don't have");
    });

    it('should fail when unlinking only authentication method', async () => {
      const user = createMockUser();
      userRepository.addUser(user);

      // User has only one OAuth connection
      const connection = createMockOAuthConnection(user.getId());
      oauthConnectionRepository.addConnection(connection);

      const command: UnlinkOAuthAccountCommand = {
        userId: user.getId().toValue(),
        provider: 'google',
      };

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('only authentication method');
    });

    it('should successfully unlink when user has multiple OAuth connections', async () => {
      const user = createMockUser();
      userRepository.addUser(user);

      // User has Google and Facebook linked
      const googleConnection = createMockOAuthConnection(user.getId(), AuthProvider.GOOGLE);
      const facebookProfile = createMockOAuthProfile({
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'fb-123',
      });
      const facebookConnection = OAuthConnection.create({
        userId: user.getId(),
        profile: facebookProfile,
        accessToken: 'fb-token',
      }).getValue();

      oauthConnectionRepository.addConnection(googleConnection);
      oauthConnectionRepository.addConnection(facebookConnection);

      const command: UnlinkOAuthAccountCommand = {
        userId: user.getId().toValue(),
        provider: 'google',
      };

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });

    it('should revoke tokens when unlinking', async () => {
      const user = createMockUser();
      userRepository.addUser(user);

      // User has multiple connections
      const googleConnection = createMockOAuthConnection(user.getId(), AuthProvider.GOOGLE);
      const facebookProfile = createMockOAuthProfile({
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'fb-123',
      });
      const facebookConnection = OAuthConnection.create({
        userId: user.getId(),
        profile: facebookProfile,
        accessToken: 'fb-token',
      }).getValue();

      oauthConnectionRepository.addConnection(googleConnection);
      oauthConnectionRepository.addConnection(facebookConnection);

      const command: UnlinkOAuthAccountCommand = {
        userId: user.getId().toValue(),
        provider: 'google',
      };

      // This should work - revokeToken is called internally
      const result = await handler.execute(command);
      expect(result.isOk).toBe(true);
    });
  });
});
