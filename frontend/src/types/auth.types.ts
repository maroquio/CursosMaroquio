export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  photoUrl?: string | null;
  roles: string[];
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface LoginResponse extends TokenResponse {
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export type OAuthProviderType = 'google' | 'facebook' | 'apple';

export interface OAuthProvider {
  provider: OAuthProviderType;
  name: string;
  enabled: boolean;
}

export interface OAuthAuthorizationResponse {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
}

export interface OAuthCallbackParams {
  code: string;
  codeVerifier: string;
}

export interface OAuthConnection {
  provider: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  linkedAt: string;
}

export interface OAuthConnectionsResponse {
  connections: OAuthConnection[];
  totalConnections: number;
}
