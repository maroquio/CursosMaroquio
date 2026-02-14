import apiClient from './client';
import type { ApiResponse } from '../types/api.types';

export interface ExerciseVerificationResult {
  isCorrect: boolean;
  feedback: string;
  score?: number;
}

export interface LlmManufacturerDto {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface LlmModelDto {
  id: string;
  manufacturerId: string;
  name: string;
  technicalName: string;
  pricePerMillionInputTokens: number;
  pricePerMillionOutputTokens: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const aiApi = {
  // Exercise verification
  async verifyExercise(sectionId: string, code: string): Promise<ApiResponse<ExerciseVerificationResult>> {
    const response = await apiClient.post<ApiResponse<ExerciseVerificationResult>>(
      `/sections/${sectionId}/verify-exercise`,
      { code }
    );
    return response.data;
  },

  // LLM Manufacturers CRUD
  async listManufacturers(): Promise<ApiResponse<LlmManufacturerDto[]>> {
    const response = await apiClient.get<ApiResponse<LlmManufacturerDto[]>>('/admin/llm-manufacturers');
    return response.data;
  },

  async getManufacturer(id: string): Promise<ApiResponse<LlmManufacturerDto>> {
    const response = await apiClient.get<ApiResponse<LlmManufacturerDto>>(`/admin/llm-manufacturers/${id}`);
    return response.data;
  },

  async createManufacturer(data: { name: string; slug: string }): Promise<ApiResponse<LlmManufacturerDto>> {
    const response = await apiClient.post<ApiResponse<LlmManufacturerDto>>('/admin/llm-manufacturers', data);
    return response.data;
  },

  async updateManufacturer(id: string, data: { name?: string; slug?: string }): Promise<ApiResponse<LlmManufacturerDto>> {
    const response = await apiClient.put<ApiResponse<LlmManufacturerDto>>(`/admin/llm-manufacturers/${id}`, data);
    return response.data;
  },

  async deleteManufacturer(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/llm-manufacturers/${id}`);
    return response.data;
  },

  // LLM Models CRUD
  async listModels(manufacturerId?: string): Promise<ApiResponse<LlmModelDto[]>> {
    const response = await apiClient.get<ApiResponse<LlmModelDto[]>>('/admin/llm-models', {
      params: manufacturerId ? { manufacturerId } : undefined,
    });
    return response.data;
  },

  async getModel(id: string): Promise<ApiResponse<LlmModelDto>> {
    const response = await apiClient.get<ApiResponse<LlmModelDto>>(`/admin/llm-models/${id}`);
    return response.data;
  },

  async getDefaultModel(): Promise<ApiResponse<LlmModelDto>> {
    const response = await apiClient.get<ApiResponse<LlmModelDto>>('/admin/llm-models/default');
    return response.data;
  },

  async createModel(data: {
    manufacturerId: string;
    name: string;
    technicalName: string;
    pricePerMillionInputTokens?: number;
    pricePerMillionOutputTokens?: number;
    isDefault?: boolean;
  }): Promise<ApiResponse<LlmModelDto>> {
    const response = await apiClient.post<ApiResponse<LlmModelDto>>('/admin/llm-models', data);
    return response.data;
  },

  async updateModel(id: string, data: {
    name?: string;
    technicalName?: string;
    pricePerMillionInputTokens?: number;
    pricePerMillionOutputTokens?: number;
    isDefault?: boolean;
  }): Promise<ApiResponse<LlmModelDto>> {
    const response = await apiClient.put<ApiResponse<LlmModelDto>>(`/admin/llm-models/${id}`, data);
    return response.data;
  },

  async deleteModel(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/admin/llm-models/${id}`);
    if (response.status === 204) {
      return { statusCode: 204, success: true } as ApiResponse<void>;
    }
    return response.data;
  },

  async setDefaultModel(id: string): Promise<ApiResponse<LlmModelDto>> {
    const response = await apiClient.post<ApiResponse<LlmModelDto>>(`/admin/llm-models/${id}/set-default`);
    return response.data;
  },
};

export default aiApi;
