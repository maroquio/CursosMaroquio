import { create } from 'zustand';
import { coursesApi } from '../api/courses.api';
import { enrollmentsApi } from '../api/enrollments.api';
import type {
  Course,
  CourseWithLessons,
  CourseFilters,
  Enrollment,
  EnrollmentWithProgress,
  Lesson,
  LessonProgress,
  Category,
} from '../types/course.types';

interface CoursesState {
  // Course catalog
  courses: Course[];
  totalCourses: number;
  currentPage: number;
  totalPages: number;
  filters: CourseFilters;
  categories: Category[];

  // Current course
  currentCourse: CourseWithLessons | null;
  currentLesson: Lesson | null;

  // Enrollments
  enrollments: Enrollment[];
  currentEnrollment: EnrollmentWithProgress | null;

  // Loading states
  isLoading: boolean;
  isLoadingCourse: boolean;
  isLoadingEnrollments: boolean;
  isLoadingProgress: boolean;

  // Error states
  error: string | null;
}

interface CoursesActions {
  // Course catalog actions
  fetchCourses: (filters?: CourseFilters) => Promise<void>;
  setFilters: (filters: CourseFilters) => void;
  fetchCategories: () => Promise<void>;

  // Course detail actions
  fetchCourseBySlug: (slug: string) => Promise<void>;
  fetchLesson: (courseSlug: string, lessonSlug: string) => Promise<void>;
  clearCurrentCourse: () => void;

  // Enrollment actions
  fetchMyEnrollments: () => Promise<void>;
  fetchEnrollmentProgress: (enrollmentId: string) => Promise<void>;
  enrollInCourse: (courseId: string) => Promise<Enrollment>;
  updateLessonProgress: (
    enrollmentId: string,
    lessonId: string,
    progress: Partial<LessonProgress>
  ) => Promise<void>;
  markLessonComplete: (enrollmentId: string, lessonId: string) => Promise<void>;

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

type CoursesStore = CoursesState & CoursesActions;

const initialState: CoursesState = {
  courses: [],
  totalCourses: 0,
  currentPage: 1,
  totalPages: 1,
  filters: { page: 1, limit: 12 },
  categories: [],

  currentCourse: null,
  currentLesson: null,

  enrollments: [],
  currentEnrollment: null,

  isLoading: false,
  isLoadingCourse: false,
  isLoadingEnrollments: false,
  isLoadingProgress: false,

  error: null,
};

export const useCoursesStore = create<CoursesStore>((set, get) => ({
  ...initialState,

  fetchCourses: async (filters?: CourseFilters) => {
    const currentFilters = filters || get().filters;
    set({ isLoading: true, error: null, filters: currentFilters });

    try {
      const response = await coursesApi.list(currentFilters);
      if (response.success && response.data) {
        set({
          courses: response.data.courses,
          totalCourses: response.data.total,
          currentPage: response.data.page,
          totalPages: response.data.totalPages,
          isLoading: false,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch courses');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch courses';
      set({ error: message, isLoading: false });
    }
  },

  setFilters: (filters: CourseFilters) => {
    set({ filters });
    get().fetchCourses(filters);
  },

  fetchCategories: async () => {
    try {
      const response = await coursesApi.getCategories();
      if (response.success && response.data) {
        set({ categories: response.data });
      }
    } catch {
      // Ignore category fetch errors
    }
  },

  fetchCourseBySlug: async (slug: string) => {
    set({ isLoadingCourse: true, error: null, currentCourse: null });

    try {
      const response = await coursesApi.getBySlug(slug);
      if (response.success && response.data) {
        set({ currentCourse: response.data, isLoadingCourse: false });
      } else {
        throw new Error(response.error || 'Course not found');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch course';
      set({ error: message, isLoadingCourse: false });
    }
  },

  fetchLesson: async (courseSlug: string, lessonSlug: string) => {
    set({ isLoadingCourse: true, error: null });

    try {
      const response = await coursesApi.getLesson(courseSlug, lessonSlug);
      if (response.success && response.data) {
        set({ currentLesson: response.data, isLoadingCourse: false });
      } else {
        throw new Error(response.error || 'Lesson not found');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch lesson';
      set({ error: message, isLoadingCourse: false });
    }
  },

  clearCurrentCourse: () => {
    set({ currentCourse: null, currentLesson: null, currentEnrollment: null });
  },

  fetchMyEnrollments: async () => {
    set({ isLoadingEnrollments: true, error: null });

    try {
      const response = await enrollmentsApi.getMyEnrollments();
      if (response.success && response.data) {
        set({ enrollments: response.data, isLoadingEnrollments: false });
      } else {
        throw new Error(response.error || 'Failed to fetch enrollments');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch enrollments';
      set({ error: message, isLoadingEnrollments: false });
    }
  },

  fetchEnrollmentProgress: async (enrollmentId: string) => {
    set({ isLoadingProgress: true, error: null });

    try {
      const response = await enrollmentsApi.getEnrollment(enrollmentId);
      if (response.success && response.data) {
        set({
          currentEnrollment: response.data,
          isLoadingProgress: false,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch progress');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch progress';
      set({ error: message, isLoadingProgress: false });
    }
  },

  enrollInCourse: async (courseId: string) => {
    try {
      const response = await enrollmentsApi.enroll(courseId);
      if (response.success && response.data) {
        const enrollment = response.data.enrollment;
        set((state) => ({
          enrollments: [...state.enrollments, enrollment],
        }));
        return enrollment;
      } else {
        throw new Error(response.error || 'Failed to enroll');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enroll';
      set({ error: message });
      throw error;
    }
  },

  updateLessonProgress: async (enrollmentId: string, lessonId: string, progress) => {
    try {
      const response = await enrollmentsApi.updateLessonProgress(enrollmentId, lessonId, progress);
      if (response.success && response.data) {
        const { currentEnrollment } = get();
        if (currentEnrollment && currentEnrollment.id === enrollmentId) {
          const updatedLessonsProgress = currentEnrollment.lessonsProgress.map((lp) =>
            lp.lessonId === lessonId ? { ...lp, ...response.data } : lp
          );
          if (!updatedLessonsProgress.find((lp) => lp.lessonId === lessonId)) {
            updatedLessonsProgress.push(response.data);
          }
          set({
            currentEnrollment: {
              ...currentEnrollment,
              lessonsProgress: updatedLessonsProgress,
            },
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update progress';
      set({ error: message });
    }
  },

  markLessonComplete: async (enrollmentId: string, lessonId: string) => {
    try {
      await enrollmentsApi.markLessonComplete(enrollmentId, lessonId);
      // Refresh enrollment progress
      await get().fetchEnrollmentProgress(enrollmentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark lesson complete';
      set({ error: message });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
