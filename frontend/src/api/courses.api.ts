import apiClient from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  Course,
  CourseWithLessons,
  CourseFilters,
  CoursesListResponse,
  Lesson,
  SectionBundle,
  Category,
} from '../types/course.types';

export const coursesApi = {
  async list(filters?: CourseFilters): Promise<ApiResponse<CoursesListResponse>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.level) params.append('level', filters.level);
      if (filters.minPrice !== undefined) params.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice !== undefined) params.append('maxPrice', String(filters.maxPrice));
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const queryString = params.toString();
    const url = queryString ? `/courses?${queryString}` : '/courses';

    const response = await apiClient.get<ApiResponse<CoursesListResponse>>(url);
    return response.data;
  },

  async getBySlug(slug: string): Promise<ApiResponse<CourseWithLessons>> {
    const response = await apiClient.get<ApiResponse<CourseWithLessons>>(`/courses/${slug}`);
    return response.data;
  },

  async getLesson(courseSlug: string, lessonSlug: string): Promise<ApiResponse<Lesson>> {
    const response = await apiClient.get<ApiResponse<Lesson>>(
      `/courses/${courseSlug}/lessons/${lessonSlug}`
    );
    return response.data;
  },

  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get<ApiResponse<Category[]>>('/courses/categories');
    return response.data;
  },

  async getFeatured(): Promise<ApiResponse<Course[]>> {
    const response = await apiClient.get<ApiResponse<Course[]>>('/courses/featured');
    return response.data;
  },

  async getPopular(limit = 6): Promise<ApiResponse<Course[]>> {
    const response = await apiClient.get<ApiResponse<Course[]>>(`/courses/popular?limit=${limit}`);
    return response.data;
  },

  async getRecent(limit = 6): Promise<ApiResponse<Course[]>> {
    const response = await apiClient.get<ApiResponse<Course[]>>(`/courses/recent?limit=${limit}`);
    return response.data;
  },

  async getActiveSectionBundle(sectionId: string): Promise<ApiResponse<SectionBundle | null>> {
    const response = await apiClient.get<ApiResponse<SectionBundle | null>>(
      `/sections/${sectionId}/bundle`
    );
    return response.data;
  },
};

export default coursesApi;
