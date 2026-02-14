import apiClient from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  Course,
  CourseWithLessons,
  CourseFilters,
  CoursesListResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
  Module,
  CreateModuleRequest,
  UpdateModuleRequest,
  ReorderModulesRequest,
  Lesson,
  CreateLessonRequest,
  UpdateLessonRequest,
  ReorderLessonsRequest,
  Section,
  CreateSectionRequest,
  UpdateSectionRequest,
  ReorderSectionsRequest,
  EnrollmentDetails,
  AdminDashboardStats,
  SectionBundle,
  SectionBundlesListResponse,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/course.types';

export const adminApi = {
  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
    const response = await apiClient.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard');
    return response.data;
  },

  // Courses CRUD
  async listCourses(filters?: CourseFilters): Promise<ApiResponse<CoursesListResponse>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const queryString = params.toString();
    const url = queryString ? `/admin/courses?${queryString}` : '/admin/courses';

    const response = await apiClient.get<ApiResponse<CoursesListResponse>>(url);
    return response.data;
  },

  async getCourse(courseId: string): Promise<ApiResponse<CourseWithLessons>> {
    const response = await apiClient.get<ApiResponse<CourseWithLessons>>(
      `/admin/courses/${courseId}`
    );
    return response.data;
  },

  async createCourse(data: CreateCourseRequest): Promise<ApiResponse<Course>> {
    const response = await apiClient.post<ApiResponse<Course>>('/admin/courses', data);
    return response.data;
  },

  async updateCourse(courseId: string, data: UpdateCourseRequest): Promise<ApiResponse<Course>> {
    const response = await apiClient.put<ApiResponse<Course>>(`/admin/courses/${courseId}`, data);
    return response.data;
  },

  async deleteCourse(courseId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/courses/${courseId}`
    );
    return response.data;
  },

  async publishCourse(courseId: string): Promise<ApiResponse<Course>> {
    const response = await apiClient.post<ApiResponse<Course>>(
      `/admin/courses/${courseId}/publish`
    );
    return response.data;
  },

  async unpublishCourse(courseId: string): Promise<ApiResponse<Course>> {
    const response = await apiClient.post<ApiResponse<Course>>(
      `/admin/courses/${courseId}/unpublish`
    );
    return response.data;
  },

  async archiveCourse(courseId: string): Promise<ApiResponse<Course>> {
    const response = await apiClient.post<ApiResponse<Course>>(
      `/admin/courses/${courseId}/archive`
    );
    return response.data;
  },

  // Lessons CRUD (now under modules)
  async createLesson(moduleId: string, data: CreateLessonRequest): Promise<ApiResponse<Lesson>> {
    const response = await apiClient.post<ApiResponse<Lesson>>(
      `/admin/modules/${moduleId}/lessons`,
      data
    );
    return response.data;
  },

  async updateLesson(
    moduleId: string,
    lessonId: string,
    data: UpdateLessonRequest
  ): Promise<ApiResponse<Lesson>> {
    const response = await apiClient.put<ApiResponse<Lesson>>(
      `/admin/modules/${moduleId}/lessons/${lessonId}`,
      data
    );
    return response.data;
  },

  async deleteLesson(moduleId: string, lessonId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/modules/${moduleId}/lessons/${lessonId}`
    );
    return response.data;
  },

  async reorderLessons(
    moduleId: string,
    data: ReorderLessonsRequest
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/admin/modules/${moduleId}/lessons/reorder`,
      data
    );
    return response.data;
  },

  async publishLesson(moduleId: string, lessonId: string): Promise<ApiResponse<Lesson>> {
    const response = await apiClient.post<ApiResponse<Lesson>>(
      `/admin/modules/${moduleId}/lessons/${lessonId}/publish`
    );
    return response.data;
  },

  async unpublishLesson(moduleId: string, lessonId: string): Promise<ApiResponse<Lesson>> {
    const response = await apiClient.post<ApiResponse<Lesson>>(
      `/admin/modules/${moduleId}/lessons/${lessonId}/unpublish`
    );
    return response.data;
  },

  // Enrollments
  async listEnrollments(
    courseId: string,
    options?: { page?: number; limit?: number; status?: string }
  ): Promise<
    ApiResponse<{
      enrollments: EnrollmentDetails[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.status) params.append('status', options.status);

    const queryString = params.toString();
    const url = queryString
      ? `/admin/courses/${courseId}/enrollments?${queryString}`
      : `/admin/courses/${courseId}/enrollments`;

    const response = await apiClient.get<
      ApiResponse<{
        enrollments: EnrollmentDetails[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(url);
    return response.data;
  },

  async removeEnrollment(
    courseId: string,
    enrollmentId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/courses/${courseId}/enrollments/${enrollmentId}`
    );
    return response.data;
  },

  // Image uploads
  async uploadThumbnail(courseId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('thumbnail', file);

    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      `/admin/courses/${courseId}/thumbnail`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async uploadBanner(courseId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('banner', file);

    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      `/admin/courses/${courseId}/banner`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Modules CRUD
  async createModule(courseId: string, data: CreateModuleRequest): Promise<ApiResponse<Module>> {
    const response = await apiClient.post<ApiResponse<Module>>(
      `/admin/courses/${courseId}/modules`,
      data
    );
    return response.data;
  },

  async updateModule(
    courseId: string,
    moduleId: string,
    data: UpdateModuleRequest
  ): Promise<ApiResponse<Module>> {
    const response = await apiClient.put<ApiResponse<Module>>(
      `/admin/courses/${courseId}/modules/${moduleId}`,
      data
    );
    return response.data;
  },

  async deleteModule(
    courseId: string,
    moduleId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/courses/${courseId}/modules/${moduleId}`
    );
    return response.data;
  },

  async reorderModules(
    courseId: string,
    data: ReorderModulesRequest
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/admin/courses/${courseId}/modules/reorder`,
      data
    );
    return response.data;
  },

  // Sections CRUD
  async listSections(lessonId: string): Promise<ApiResponse<Section[]>> {
    const response = await apiClient.get<ApiResponse<Section[]>>(
      `/admin/lessons/${lessonId}/sections`
    );
    return response.data;
  },

  async createSection(lessonId: string, data: CreateSectionRequest): Promise<ApiResponse<Section>> {
    const response = await apiClient.post<ApiResponse<Section>>(
      `/admin/lessons/${lessonId}/sections`,
      data
    );
    return response.data;
  },

  async updateSection(
    lessonId: string,
    sectionId: string,
    data: UpdateSectionRequest
  ): Promise<ApiResponse<Section>> {
    const response = await apiClient.put<ApiResponse<Section>>(
      `/admin/lessons/${lessonId}/sections/${sectionId}`,
      data
    );
    return response.data;
  },

  async deleteSection(
    lessonId: string,
    sectionId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/lessons/${lessonId}/sections/${sectionId}`
    );
    return response.data;
  },

  async reorderSections(
    lessonId: string,
    data: ReorderSectionsRequest
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/admin/lessons/${lessonId}/sections/reorder`,
      data
    );
    return response.data;
  },

  // Section Bundles
  async listSectionBundles(sectionId: string): Promise<ApiResponse<SectionBundlesListResponse>> {
    const response = await apiClient.get<ApiResponse<SectionBundlesListResponse>>(
      `/admin/sections/${sectionId}/bundles`
    );
    return response.data;
  },

  async uploadSectionBundle(
    sectionId: string,
    file: File,
    activateImmediately: boolean = false
  ): Promise<ApiResponse<SectionBundle>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('activateImmediately', String(activateImmediately));

    const response = await apiClient.post<ApiResponse<SectionBundle>>(
      `/admin/sections/${sectionId}/bundles`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async activateSectionBundle(bundleId: string): Promise<ApiResponse<SectionBundle>> {
    const response = await apiClient.post<ApiResponse<SectionBundle>>(
      `/admin/section-bundles/${bundleId}/activate`
    );
    return response.data;
  },

  async deleteSectionBundle(bundleId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/section-bundles/${bundleId}`
    );
    return response.data;
  },

  // Categories CRUD
  async listCategories(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get<ApiResponse<Category[]>>('/admin/categories');
    return response.data;
  },

  async createCategory(data: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    const response = await apiClient.post<ApiResponse<Category>>('/admin/categories', data);
    return response.data;
  },

  async updateCategory(
    categoryId: string,
    data: UpdateCategoryRequest
  ): Promise<ApiResponse<Category>> {
    const response = await apiClient.put<ApiResponse<Category>>(
      `/admin/categories/${categoryId}`,
      data
    );
    return response.data;
  },

  async deleteCategory(categoryId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/categories/${categoryId}`
    );
    return response.data;
  },
};

export default adminApi;
