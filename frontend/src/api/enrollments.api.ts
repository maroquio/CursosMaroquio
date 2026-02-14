import apiClient from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  Enrollment,
  EnrollmentResponse,
  EnrollmentWithProgress,
  CourseProgressResponse,
  UpdateProgressRequest,
  LessonProgress,
  SectionProgress,
  LessonSectionProgress,
} from '../types/course.types';

export const enrollmentsApi = {
  async enroll(courseId: string): Promise<ApiResponse<EnrollmentResponse>> {
    const response = await apiClient.post<ApiResponse<EnrollmentResponse>>('/enrollments', {
      courseId,
    });
    return response.data;
  },

  async getMyEnrollments(): Promise<ApiResponse<Enrollment[]>> {
    const response = await apiClient.get<ApiResponse<Enrollment[]>>('/enrollments/me');
    return response.data;
  },

  async getEnrollment(enrollmentId: string): Promise<ApiResponse<EnrollmentWithProgress>> {
    const response = await apiClient.get<ApiResponse<EnrollmentWithProgress>>(
      `/enrollments/${enrollmentId}`
    );
    return response.data;
  },

  async getProgress(enrollmentId: string): Promise<ApiResponse<CourseProgressResponse>> {
    const response = await apiClient.get<ApiResponse<CourseProgressResponse>>(
      `/enrollments/${enrollmentId}/progress`
    );
    return response.data;
  },

  async updateLessonProgress(
    enrollmentId: string,
    lessonId: string,
    progress: UpdateProgressRequest
  ): Promise<ApiResponse<LessonProgress>> {
    const response = await apiClient.post<ApiResponse<LessonProgress>>(
      `/enrollments/${enrollmentId}/lessons/${lessonId}/progress`,
      progress
    );
    return response.data;
  },

  async markLessonComplete(
    enrollmentId: string,
    lessonId: string
  ): Promise<ApiResponse<LessonProgress>> {
    return this.updateLessonProgress(enrollmentId, lessonId, { completed: true });
  },

  async getEnrollmentByCourse(courseId: string): Promise<ApiResponse<Enrollment | null>> {
    const response = await apiClient.get<ApiResponse<Enrollment | null>>(
      `/enrollments/course/${courseId}`
    );
    return response.data;
  },

  async cancelEnrollment(enrollmentId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/enrollments/${enrollmentId}`
    );
    return response.data;
  },

  // Section Progress
  async getSectionProgress(
    enrollmentId: string,
    lessonId: string
  ): Promise<ApiResponse<LessonSectionProgress>> {
    const response = await apiClient.get<ApiResponse<LessonSectionProgress>>(
      `/enrollments/${enrollmentId}/lessons/${lessonId}/sections/progress`
    );
    return response.data;
  },

  async completeSection(
    enrollmentId: string,
    sectionId: string
  ): Promise<ApiResponse<SectionProgress>> {
    const response = await apiClient.post<ApiResponse<SectionProgress>>(
      `/enrollments/${enrollmentId}/sections/${sectionId}/complete`
    );
    return response.data;
  },
};

export default enrollmentsApi;
