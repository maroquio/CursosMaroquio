import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Container,
  Grid,
  Skeleton,
  Stack,
  Text,
  Title,
  TypographyStylesProvider,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { CourseBanner, EnrollButton, LessonList } from '../../components/courses';
import { ThemedPaper } from '../../components/common';
import { useAuthStore } from '../../stores/auth.store';
import { useCoursesStore } from '../../stores/courses.store';
import { enrollmentsApi } from '../../api/enrollments.api';
import { sanitizeHtml } from '../../utils/sanitize';
import type { Enrollment, EnrollmentWithProgress } from '../../types/course.types';

export function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  const {
    currentCourse,
    isLoadingCourse,
    fetchCourseBySlug,
    clearCurrentCourse,
  } = useCoursesStore();

  const [enrollment, setEnrollment] = useState<EnrollmentWithProgress | null>(null);

  useEffect(() => {
    if (slug) {
      fetchCourseBySlug(slug);
    }
    return () => {
      clearCurrentCourse();
    };
  }, [slug, fetchCourseBySlug, clearCurrentCourse]);

  useEffect(() => {
    const fetchEnrollment = async () => {
      if (currentCourse && isAuthenticated) {
        try {
          const response = await enrollmentsApi.getEnrollmentByCourse(currentCourse.id);
          if (response.success && response.data) {
            const progressResponse = await enrollmentsApi.getProgress(response.data.id);
            if (progressResponse.success && progressResponse.data) {
              setEnrollment({
                ...response.data,
                lessonsProgress: progressResponse.data.lessonsProgress,
                progress: progressResponse.data.overallProgress,
                completedLessons: progressResponse.data.completedLessons,
                totalLessons: progressResponse.data.totalLessons,
              });
            }
          }
        } catch {
          // User not enrolled
        }
      }
    };
    fetchEnrollment();
  }, [currentCourse, isAuthenticated]);

  const allLessons = currentCourse?.modules?.flatMap(m => m.lessons) ?? [];
  const completedLessonIds = new Set(
    (enrollment?.lessonsProgress ?? []).filter(p => p.status === 'completed').map(p => p.lessonId)
  );
  const nextLesson = allLessons.find(l => !completedLessonIds.has(l.id));
  const nextLessonSlug = nextLesson?.slug ?? allLessons[0]?.slug ?? null;

  const handleEnrollSuccess = (newEnrollment: Enrollment) => {
    setEnrollment({
      ...newEnrollment,
      lessonsProgress: [],
      progress: 0,
      completedLessons: 0,
      totalLessons: allLessons.length,
    } as EnrollmentWithProgress);
  };

  const handleLessonNavigate = useCallback(
    (lessonSlug: string) => {
      navigate(`/courses/${slug}/lessons/${lessonSlug}`);
    },
    [navigate, slug]
  );

  if (isLoadingCourse) {
    return (
      <Container size="xl" py="xl">
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="xl">
              <Skeleton height={280} radius="lg" />
              <Skeleton height={30} width="60%" />
              <Skeleton height={200} />
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Skeleton height={400} radius="md" />
          </Grid.Col>
        </Grid>
      </Container>
    );
  }

  if (!currentCourse) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="md" py="xl">
          <Title order={2}>{t('courses.notFound')}</Title>
          <Text c="dimmed">{t('courses.notFoundDescription')}</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Grid gutter="xl">
        {/* Main content */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="xl">
            <CourseBanner course={currentCourse} />

            <EnrollButton
              course={currentCourse}
              enrollment={enrollment}
              isAuthenticated={isAuthenticated}
              nextLessonSlug={nextLessonSlug}
              onEnrollSuccess={handleEnrollSuccess}
            />

            {currentCourse.description && (
              <ThemedPaper p="lg">
                <Stack gap="md">
                  <Title order={3}>{t('courses.about')}</Title>
                  <TypographyStylesProvider>
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentCourse.description) }} />
                  </TypographyStylesProvider>
                </Stack>
              </ThemedPaper>
            )}
          </Stack>
        </Grid.Col>

        {/* Curriculum panel */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <ThemedPaper p="lg">
            <Stack gap="md">
              <Title order={4}>{t('courses.curriculum')}</Title>
              <LessonList
                lessons={allLessons}
                modules={currentCourse.modules}
                courseSlug={currentCourse.slug}
                isEnrolled={!!enrollment}
                progress={enrollment?.lessonsProgress || []}
                onLessonClick={(lesson) => lesson.slug && handleLessonNavigate(lesson.slug)}
              />
            </Stack>
          </ThemedPaper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

export default CourseDetail;
