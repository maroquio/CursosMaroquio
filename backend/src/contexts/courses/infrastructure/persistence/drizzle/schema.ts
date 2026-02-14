import { pgTable, text, timestamp, index, integer, pgEnum, boolean, jsonb, unique, varchar } from 'drizzle-orm/pg-core';
import { usersTable } from '@auth/infrastructure/persistence/drizzle/schema.ts';

/**
 * Categories table schema
 * Stores course categories for organization
 */
export const categoriesTable = pgTable(
  'categories',
  {
    id: text('id').primaryKey().notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_categories_slug').on(table.slug),
    index('idx_categories_name').on(table.name),
  ]
);

export type CategorySchema = typeof categoriesTable.$inferSelect;
export type CategoryInsert = typeof categoriesTable.$inferInsert;

/**
 * Course Status enum for PostgreSQL
 */
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published', 'archived']);

/**
 * Enrollment Status enum for PostgreSQL
 */
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'cancelled']);

/**
 * Lesson Progress Status enum for PostgreSQL
 */
export const lessonProgressStatusEnum = pgEnum('lesson_progress_status', ['not_started', 'in_progress', 'completed']);

/**
 * Section Content Type enum for PostgreSQL
 */
export const sectionContentTypeEnum = pgEnum('section_content_type', ['text', 'video', 'quiz', 'exercise', 'interactive']);

/**
 * Lesson Type enum for PostgreSQL
 */
export const lessonTypeEnum = pgEnum('lesson_type', ['video', 'text', 'quiz', 'assignment']);

/**
 * Courses table schema
 * Maps Course aggregate to database table
 */
export const coursesTable = pgTable(
  'courses',
  {
    id: text('id').primaryKey().notNull(),
    title: text('title').notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description'),
    thumbnailUrl: text('thumbnail_url'),
    bannerUrl: text('banner_url'),
    shortDescription: text('short_description'),
    price: integer('price').notNull().default(0), // Price in cents
    currency: varchar('currency', { length: 3 }).notNull().default('BRL'),
    level: varchar('level', { length: 20 }), // 'beginner' | 'intermediate' | 'advanced'
    categoryId: text('category_id').references(() => categoriesTable.id, { onDelete: 'set null' }),
    tags: text('tags').array(),
    status: courseStatusEnum('status').notNull().default('draft'),
    instructorId: text('instructor_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    exerciseCorrectionPrompt: text('exercise_correction_prompt'),
  },
  (table) => [
    index('idx_courses_slug').on(table.slug),
    index('idx_courses_status').on(table.status),
    index('idx_courses_instructor_id').on(table.instructorId),
    index('idx_courses_category_id').on(table.categoryId),
  ]
);

export type CourseSchema = typeof coursesTable.$inferSelect;
export type CourseInsert = typeof coursesTable.$inferInsert;

/**
 * Modules table schema
 * Represents modules within a course (mandatory hierarchy: Course → Modules → Lessons)
 */
export const modulesTable = pgTable(
  'modules',
  {
    id: text('id').primaryKey().notNull(),
    courseId: text('course_id')
      .notNull()
      .references(() => coursesTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    order: integer('order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    exerciseCorrectionPrompt: text('exercise_correction_prompt'),
  },
  (table) => [
    index('idx_modules_course_id').on(table.courseId),
    index('idx_modules_order').on(table.courseId, table.order),
  ]
);

export type ModuleSchema = typeof modulesTable.$inferSelect;
export type ModuleInsert = typeof modulesTable.$inferInsert;

/**
 * Lessons table schema
 * Maps Lesson entity to database table
 * Now references Module instead of Course directly
 */
export const lessonsTable = pgTable(
  'lessons',
  {
    id: text('id').primaryKey().notNull(),
    moduleId: text('module_id')
      .notNull()
      .references(() => modulesTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    content: text('content'), // HTML/text content for text-based lessons
    videoUrl: text('video_url'),
    duration: integer('duration').notNull().default(0), // Duration in seconds
    type: lessonTypeEnum('type').notNull().default('video'),
    isFree: boolean('is_free').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(false),
    order: integer('order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    exerciseCorrectionPrompt: text('exercise_correction_prompt'),
  },
  (table) => [
    index('idx_lessons_module_id').on(table.moduleId),
    index('idx_lessons_order').on(table.moduleId, table.order),
    index('idx_lessons_slug').on(table.slug),
  ]
);

export type LessonSchema = typeof lessonsTable.$inferSelect;
export type LessonInsert = typeof lessonsTable.$inferInsert;

/**
 * Sections table schema
 * Represents sections within a lesson (mandatory hierarchy: Lesson → Sections)
 */
export const sectionsTable = pgTable(
  'sections',
  {
    id: text('id').primaryKey().notNull(),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessonsTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    contentType: sectionContentTypeEnum('content_type').notNull().default('text'),
    /**
     * Content field stores the actual section content as JSON.
     * Structure varies by contentType:
     * - text: { body: string, estimatedMinutes: number }
     * - quiz: { passingScore: number, questions: QuizQuestion[] }
     * - exercise: { problem: string, starterCode: string, testCases: TestCase[], hints: string[], solution: string }
     * - video: { videoUrl: string, duration: number }
     */
    content: jsonb('content'),
    order: integer('order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_sections_lesson_id').on(table.lessonId),
    index('idx_sections_order').on(table.lessonId, table.order),
  ]
);

export type SectionSchema = typeof sectionsTable.$inferSelect;
export type SectionInsert = typeof sectionsTable.$inferInsert;

/**
 * Enrollments table schema
 * Maps Enrollment aggregate to database table
 */
export const enrollmentsTable = pgTable(
  'enrollments',
  {
    id: text('id').primaryKey().notNull(),
    courseId: text('course_id')
      .notNull()
      .references(() => coursesTable.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    status: enrollmentStatusEnum('status').notNull().default('active'),
    progress: integer('progress').notNull().default(0), // Percentage 0-100
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_enrollments_course_id').on(table.courseId),
    index('idx_enrollments_student_id').on(table.studentId),
    index('idx_enrollments_status').on(table.status),
  ]
);

export type EnrollmentSchema = typeof enrollmentsTable.$inferSelect;
export type EnrollmentInsert = typeof enrollmentsTable.$inferInsert;

/**
 * Lesson Progress table schema
 * Tracks student progress on individual lessons
 */
export const lessonProgressTable = pgTable(
  'lesson_progress',
  {
    id: text('id').primaryKey().notNull(),
    enrollmentId: text('enrollment_id')
      .notNull()
      .references(() => enrollmentsTable.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessonsTable.id, { onDelete: 'cascade' }),
    status: lessonProgressStatusEnum('status').notNull().default('not_started'),
    watchedSeconds: integer('watched_seconds').notNull().default(0),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    lastWatchedAt: timestamp('last_watched_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_lesson_progress_enrollment_id').on(table.enrollmentId),
    index('idx_lesson_progress_lesson_id').on(table.lessonId),
    index('idx_lesson_progress_status').on(table.status),
  ]
);

export type LessonProgressSchema = typeof lessonProgressTable.$inferSelect;
export type LessonProgressInsert = typeof lessonProgressTable.$inferInsert;

/**
 * Section Progress table schema
 * Tracks student progress on individual sections within a lesson
 */
export const sectionProgressTable = pgTable(
  'section_progress',
  {
    id: text('id').primaryKey().notNull(),
    enrollmentId: text('enrollment_id')
      .notNull()
      .references(() => enrollmentsTable.id, { onDelete: 'cascade' }),
    sectionId: text('section_id')
      .notNull()
      .references(() => sectionsTable.id, { onDelete: 'cascade' }),
    status: lessonProgressStatusEnum('status').notNull().default('not_started'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_section_progress_enrollment_id').on(table.enrollmentId),
    index('idx_section_progress_section_id').on(table.sectionId),
    unique('unique_enrollment_section').on(table.enrollmentId, table.sectionId),
  ]
);

export type SectionProgressSchema = typeof sectionProgressTable.$inferSelect;
export type SectionProgressInsert = typeof sectionProgressTable.$inferInsert;

/**
 * Lesson Bundles table schema
 * Stores versioned static bundles (HTML/CSS/JS) for interactive lessons
 */
export const lessonBundlesTable = pgTable(
  'lesson_bundles',
  {
    id: text('id').primaryKey().notNull(),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessonsTable.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    entrypoint: text('entrypoint').notNull().default('index.html'),
    storagePath: text('storage_path').notNull(),
    manifestJson: jsonb('manifest_json'),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_lesson_bundles_lesson_id').on(table.lessonId),
    index('idx_lesson_bundles_active').on(table.lessonId, table.isActive),
    unique('unique_lesson_version').on(table.lessonId, table.version),
  ]
);

export type LessonBundleSchema = typeof lessonBundlesTable.$inferSelect;
export type LessonBundleInsert = typeof lessonBundlesTable.$inferInsert;

/**
 * Section Bundles table schema
 * Stores versioned static bundles (HTML/CSS/JS) for interactive sections
 */
export const sectionBundlesTable = pgTable(
  'section_bundles',
  {
    id: text('id').primaryKey().notNull(),
    sectionId: text('section_id')
      .notNull()
      .references(() => sectionsTable.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    entrypoint: text('entrypoint').notNull().default('index.html'),
    storagePath: text('storage_path').notNull(),
    manifestJson: jsonb('manifest_json'),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_section_bundles_section_id').on(table.sectionId),
    index('idx_section_bundles_active').on(table.sectionId, table.isActive),
    unique('unique_section_version').on(table.sectionId, table.version),
  ]
);

export type SectionBundleSchema = typeof sectionBundlesTable.$inferSelect;
export type SectionBundleInsert = typeof sectionBundlesTable.$inferInsert;

/**
 * Certificates table schema
 * Stores course completion certificates
 */
export const certificatesTable = pgTable(
  'certificates',
  {
    id: text('id').primaryKey().notNull(),
    enrollmentId: text('enrollment_id')
      .notNull()
      .unique()
      .references(() => enrollmentsTable.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => coursesTable.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    courseName: text('course_name').notNull(),
    studentName: text('student_name').notNull(),
    certificateNumber: varchar('certificate_number', { length: 50 }).notNull().unique(),
    sequentialNumber: integer('sequential_number').notNull().unique(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_certificates_student_id').on(table.studentId),
    index('idx_certificates_enrollment_id').on(table.enrollmentId),
    index('idx_certificates_course_id').on(table.courseId),
  ]
);

export type CertificateSchema = typeof certificatesTable.$inferSelect;
export type CertificateInsert = typeof certificatesTable.$inferInsert;

/**
 * Calendar Event Type enum for PostgreSQL
 */
export const calendarEventTypeEnum = pgEnum('calendar_event_type', ['live', 'deadline', 'mentoring', 'other']);

/**
 * Calendar Events table schema
 * Stores scheduled events for students
 */
export const calendarEventsTable = pgTable(
  'calendar_events',
  {
    id: text('id').primaryKey().notNull(),
    title: text('title').notNull(),
    description: text('description'),
    date: timestamp('date', { withTimezone: true }).notNull(),
    time: varchar('time', { length: 10 }),
    type: calendarEventTypeEnum('type').notNull().default('other'),
    courseId: text('course_id').references(() => coursesTable.id, { onDelete: 'set null' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_calendar_events_date').on(table.date),
    index('idx_calendar_events_type').on(table.type),
    index('idx_calendar_events_course_id').on(table.courseId),
  ]
);

export type CalendarEventSchema = typeof calendarEventsTable.$inferSelect;
export type CalendarEventInsert = typeof calendarEventsTable.$inferInsert;
