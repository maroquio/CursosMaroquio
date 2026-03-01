// Course Types

export type CourseStatus = 'draft' | 'published' | 'archived';
export type LessonType = 'video' | 'text' | 'quiz' | 'assignment';
export type SectionContentType = 'text' | 'video' | 'quiz' | 'exercise' | 'interactive';
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  status: CourseStatus;
  price: number;
  currency: string;
  duration?: number; // in minutes
  level?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  categoryId?: string;
  tags?: string[];
  instructorId: string;
  instructorName?: string;
  totalLessons: number;
  totalEnrollments: number;
  averageRating?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/**
 * Course with modules hierarchy (new structure)
 */
export interface CourseWithModules extends Course {
  modules: Module[];
}

/**
 * @deprecated Use CourseWithModules instead
 */
export interface CourseWithLessons extends Course {
  modules: Module[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

// Section Content Types
export interface TextSectionContent {
  body: string;
  estimatedMinutes?: number;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizSectionContent {
  passingScore: number;
  questions: QuizQuestion[];
}

export interface TestCase {
  description: string;
  type?: 'manual' | 'automated';
  input?: string;
  expectedOutput?: string;
  expectedPattern?: string; // Regex pattern for flexible validation
}

export interface ExerciseSectionContent {
  problem: string;
  starterCode?: string;
  testCases?: TestCase[];
  hints?: string[];
  solution?: string;
  /** Programming language for the exercise (e.g., 'python', 'javascript'). If 'python', enables Pyodide runner. */
  language?: 'python' | 'javascript' | 'typescript' | 'html' | 'css' | 'sql' | 'text';
  /** HTML template used as the base document for CSS exercises */
  htmlContent?: string;
}

export interface VideoSectionContent {
  videoUrl: string;
  duration?: number;
}

export type SectionContent =
  | TextSectionContent
  | QuizSectionContent
  | ExerciseSectionContent
  | VideoSectionContent
  | Record<string, unknown>
  | null;

export interface Section {
  id: string;
  lessonId: string;
  title: string;
  description?: string | null;
  contentType: SectionContentType;
  content?: SectionContent;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  slug?: string;
  description?: string | null;
  content?: string;
  type?: LessonType;
  videoUrl?: string | null;
  duration?: number; // in minutes
  order: number;
  sections: Section[];
  isFree?: boolean;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonWithProgress extends Lesson {
  progress?: LessonProgress;
  sectionsProgress?: SectionProgress[];
}

export interface LessonProgress {
  id?: string;
  enrollmentId?: string;
  lessonId: string;
  lessonTitle?: string;
  lessonOrder?: number;
  status: ProgressStatus;
  completedAt?: string | null;
  watchedSeconds?: number;
  lessonDuration?: number;
  lastWatchedAt?: string | null;
  lastPosition?: number;
}

export interface SectionProgress {
  id: string;
  enrollmentId: string;
  sectionId: string;
  sectionTitle?: string;
  sectionOrder?: number;
  status: ProgressStatus;
  completedAt?: string | null;
  lastViewedAt?: string | null;
}

export interface LessonSectionProgress {
  lessonId: string;
  sections: SectionProgress[];
  completedSections: number;
  totalSections: number;
  isLessonComplete: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  course?: Course;
  status: EnrollmentStatus;
  progress: number; // percentage 0-100
  completedLessons: number;
  totalLessons: number;
  enrolledAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  courseTitle?: string;
  courseSlug?: string;
  courseThumbnailUrl?: string | null;
}

export interface EnrollmentWithProgress extends Enrollment {
  lessonsProgress: LessonProgress[];
}

export interface EnrollmentDetails extends Enrollment {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// API Request/Response Types

export interface CreateCourseRequest {
  title: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  price?: number;
  currency?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  categoryId?: string;
  tags?: string[];
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
  bannerUrl?: string;
}

export interface CreateLessonRequest {
  title: string;
  description?: string;
  content?: string;
  type: LessonType;
  videoUrl?: string;
  duration?: number;
  isFree?: boolean;
  moduleId?: string;
}

export interface UpdateLessonRequest extends Partial<CreateLessonRequest> {
  order?: number;
  isPublished?: boolean;
}

export interface ReorderLessonsRequest {
  lessons: Array<{
    id: string;
    order: number;
  }>;
}

// Module Request Types
export interface CreateModuleRequest {
  title: string;
  description?: string;
}

export interface UpdateModuleRequest {
  title?: string;
  description?: string | null;
}

export interface ReorderModulesRequest {
  modules: Array<{
    id: string;
    order: number;
  }>;
}

// Section Request Types
export interface CreateSectionRequest {
  title: string;
  description?: string;
  contentType?: SectionContentType;
}

export interface UpdateSectionRequest {
  title?: string;
  description?: string | null;
  contentType?: SectionContentType;
}

export interface ReorderSectionsRequest {
  sections: Array<{
    id: string;
    order: number;
  }>;
}

export interface CourseFilters {
  search?: string;
  category?: string;
  level?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: CourseStatus;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'createdAt' | 'price' | 'enrollments' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateProgressRequest {
  completed?: boolean;
  watchedSeconds?: number;
  lastPosition?: number;
}

export interface CoursesListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnrollmentResponse {
  enrollment: Enrollment;
  message: string;
}

export interface ProgressResponse {
  enrollment: EnrollmentWithProgress;
  currentLesson?: Lesson;
  nextLesson?: Lesson;
}

// Matches the actual API response from /enrollments/:id/progress
export interface CourseProgressResponse {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  overallProgress: number;
  lessonsProgress: LessonProgress[];
  completedLessons: number;
  totalLessons: number;
}

// Statistics types for admin dashboard
export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalRevenue: number;
  averageRating: number;
}

export interface AdminDashboardStats extends CourseStats {
  recentEnrollments: Enrollment[];
  popularCourses: Course[];
  monthlyEnrollments: Array<{
    month: string;
    count: number;
  }>;
}

// Section Bundle Types
export interface SectionBundle {
  id: string;
  sectionId: string;
  version: number;
  entrypoint: string;
  storagePath: string;
  bundleUrl: string;
  manifestJson: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
}

export interface SectionBundlesListResponse {
  sectionId: string;
  bundles: SectionBundle[];
  activeVersion: number | null;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string | null;
}

export interface ExerciseVerificationResult {
  isCorrect: boolean;
  feedback: string;
  score?: number;
}
