import apiClient from './client';
import type { ApiResponse } from '../types/api.types';

export interface Certificate {
  id: string;
  enrollmentId: string;
  courseId: string;
  studentId: string;
  courseName: string;
  studentName: string;
  certificateNumber: string;
  issuedAt: string;
}

export const certificatesApi = {
  async getMyCertificates(): Promise<ApiResponse<Certificate[]>> {
    const response = await apiClient.get<ApiResponse<Certificate[]>>('/certificates/me');
    return response.data;
  },

  async generateCertificate(enrollmentId: string): Promise<ApiResponse<Certificate>> {
    const response = await apiClient.post<ApiResponse<Certificate>>(
      `/certificates/generate/${enrollmentId}`
    );
    return response.data;
  },

  async verifyCertificate(certificateNumber: string): Promise<ApiResponse<Certificate | null>> {
    const response = await apiClient.get<ApiResponse<Certificate | null>>(
      `/certificates/verify/${certificateNumber}`
    );
    return response.data;
  },
};

export default certificatesApi;
