import apiClient from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  ChangePasswordRequest,
  DeleteAccountRequest,
  LoginCredentials,
  LoginResponse,
  OAuthAuthorizationResponse,
  OAuthCallbackParams,
  OAuthConnectionsResponse,
  OAuthProviderType,
  RegisterCredentials,
  UpdateProfileRequest,
  User,
} from '../types/auth.types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/register',
      credentials
    );
    return response.data;
  },

  async logout(logoutAll = false): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout', {
      logoutAll,
    });
    return response.data;
  },

  async refreshToken(): Promise<ApiResponse<{ accessToken: string; expiresIn: number }>> {
    // Refresh token is sent automatically via HttpOnly cookie
    const response = await apiClient.post<
      ApiResponse<{ accessToken: string; expiresIn: number }>
    >('/auth/refresh', {});
    return response.data;
  },

  async getMe(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  async getOAuthProviders(): Promise<
    ApiResponse<Array<{ provider: OAuthProviderType; name: string; enabled: boolean }>>
  > {
    const response = await apiClient.get<
      ApiResponse<Array<{ provider: OAuthProviderType; name: string; enabled: boolean }>>
    >('/auth/oauth/providers');
    return response.data;
  },

  async getOAuthAuthorizationUrl(
    provider: OAuthProviderType
  ): Promise<ApiResponse<OAuthAuthorizationResponse>> {
    const response = await apiClient.get<ApiResponse<OAuthAuthorizationResponse>>(
      `/auth/oauth/${provider}/authorize`
    );
    return response.data;
  },

  async oauthCallback(
    provider: OAuthProviderType,
    params: OAuthCallbackParams
  ): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      `/auth/oauth/${provider}/callback`,
      params
    );
    return response.data;
  },

  async linkOAuthAccount(
    provider: OAuthProviderType,
    params: OAuthCallbackParams
  ): Promise<ApiResponse<{ provider: string; email: string; linkedAt: string }>> {
    const response = await apiClient.post<
      ApiResponse<{ provider: string; email: string; linkedAt: string }>
    >(`/auth/oauth/${provider}/link`, params);
    return response.data;
  },

  async unlinkOAuthAccount(provider: OAuthProviderType): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/auth/oauth/${provider}/unlink`
    );
    return response.data;
  },

  async getOAuthConnections(): Promise<ApiResponse<OAuthConnectionsResponse>> {
    const response = await apiClient.get<ApiResponse<OAuthConnectionsResponse>>(
      '/auth/oauth/connections'
    );
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>('/auth/profile', data);
    return response.data;
  },

  async uploadPhoto(file: File): Promise<ApiResponse<{ photoUrl: string }>> {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await apiClient.post<ApiResponse<{ photoUrl: string }>>(
      '/auth/profile/photo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/change-password',
      data
    );
    return response.data;
  },

  async deleteAccount(data: DeleteAccountRequest): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>('/auth/account', {
      data,
    });
    return response.data;
  },
};

export default authApi;
