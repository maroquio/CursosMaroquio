import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router';
import {
  Badge,
  Box,
  Button,
  Group,
  Skeleton,
  Stack,
  Title,
  TypographyStylesProvider,
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { SectionRenderer } from '../../components/courses';
import { ThemedPaper } from '../../components/common';
import { useAuthStore } from '../../stores/auth.store';
import { useNotification } from '../../hooks';
import { enrollmentsApi } from '../../api/enrollments.api';
import { sanitizeHtml } from '../../utils/sanitize';
import type { CourseWithLessons, EnrollmentWithProgress } from '../../types/course.types';

interface CourseShellContext {
  currentCourse: CourseWithLessons | null;
  enrollment: EnrollmentWithProgress | null;
  setEnrollment: (enrollment: EnrollmentWithProgress | null) => void;
  isLoadingCourse: boolean;
}

export function LessonPlayer() {
  const { slug, lessonSlug } = useParams<{ slug: string; lessonSlug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const notification = useNotification();

  const { currentCourse, enrollment, setEnrollment, isLoadingCourse } =
    useOutletContext<CourseShellContext>();

  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  const allLessons = currentCourse?.modules?.flatMap(m => m.lessons) ?? [];

  const currentLesson = lessonSlug
    ? allLessons.find(l => l.slug === lessonSlug) ?? null
    : null;

  // Redirect to first lesson if no lessonSlug provided
  useEffect(() => {
    if (currentCourse && !lessonSlug) {
      const firstLesson = currentCourse.modules?.[0]?.lessons?.[0];
      if (firstLesson?.slug) {
        navigate(`/courses/${slug}/lessons/${firstLesson.slug}`, { replace: true });
      }
    }
  }, [currentCourse, lessonSlug, slug, navigate]);

  // Scroll to top when lesson changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lessonSlug]);

  const currentLessonIndex = allLessons.findIndex((l) => l.slug === lessonSlug);
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  const isLessonCompleted =
    enrollment?.lessonsProgress?.find((lp) => lp.lessonId === currentLesson?.id)?.status ===
    'completed';

  const handleMarkComplete = useCallback(async () => {
    if (!enrollment || !currentLesson) return;

    setIsMarkingComplete(true);
    try {
      await enrollmentsApi.markLessonComplete(enrollment.id, currentLesson.id);
      const progressResponse = await enrollmentsApi.getProgress(enrollment.id);
      if (progressResponse.success && progressResponse.data) {
        setEnrollment({
          ...enrollment,
          lessonsProgress: progressResponse.data.lessonsProgress,
          progress: progressResponse.data.overallProgress,
          completedLessons: progressResponse.data.completedLessons,
          totalLessons: progressResponse.data.totalLessons,
        });
      }
      notification.success({
        title: t('courses.lessonCompleted'),
        message: t('courses.lessonCompletedMessage'),
      });
    } catch {
      notification.error({
        title: t('courses.error'),
        message: t('courses.errorMarkingComplete'),
      });
    } finally {
      setIsMarkingComplete(false);
    }
  }, [enrollment, currentLesson, setEnrollment, notification, t]);

  const handleNavigate = useCallback(
    (lessonSlugToNavigate: string) => {
      navigate(`/courses/${slug}/lessons/${lessonSlugToNavigate}`);
    },
    [navigate, slug]
  );

  if (isLoadingCourse || !currentLesson) {
    return (
      <Box p="xl">
        <Stack gap="xl">
          <Skeleton height={40} width={300} />
          <Skeleton height={400} />
        </Stack>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        {/* Lesson Header */}
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={2}>
            <Title order={2}>{currentLesson.title}</Title>
            <Group gap="xs">
              <Badge size="sm" variant="light" color="violet">
                {t('courses.lesson')} {currentLessonIndex + 1}/{allLessons.length}
              </Badge>
              {enrollment && (
                <Badge size="sm" variant="outline" color="gray">
                  {enrollment.progress}% {t('courses.completed').toLowerCase()}
                </Badge>
              )}
            </Group>
          </Stack>
        </Group>

        {/* Video Player */}
        {currentLesson.type === 'video' && currentLesson.videoUrl && (
          <ThemedPaper p={0} style={{ overflow: 'hidden' }}>
            <Box
              style={{
                position: 'relative',
                paddingTop: '56.25%',
                backgroundColor: '#000',
              }}
            >
              <iframe
                src={currentLesson.videoUrl}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
          </ThemedPaper>
        )}

        {/* Lesson Content */}
        {currentLesson.content && (
          <ThemedPaper p="xl">
            <TypographyStylesProvider>
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentLesson.content) }} />
            </TypographyStylesProvider>
          </ThemedPaper>
        )}

        {/* Lesson Sections */}
        {currentLesson.sections?.map((section) => (
          <ThemedPaper key={section.id} p="xl">
            <Stack gap="md">
              <Title order={4}>{section.title}</Title>
              <SectionRenderer
                section={section}
                textContent={section.description ?? undefined}
                onComplete={handleMarkComplete}
                isLessonCompleted={isLessonCompleted}
              />
            </Stack>
          </ThemedPaper>
        ))}

        {/* Navigation & Actions */}
        <ThemedPaper p="md">
          <Group justify="space-between">
            <Button
              variant="light"
              leftSection={<IconChevronLeft size={18} />}
              disabled={!prevLesson || !prevLesson.slug}
              onClick={() => prevLesson?.slug && handleNavigate(prevLesson.slug)}
            >
              {t('courses.previousLesson')}
            </Button>

            {isAuthenticated && enrollment && (
              <Button
                variant={isLessonCompleted ? 'light' : 'filled'}
                color={isLessonCompleted ? 'green' : 'violet'}
                leftSection={
                  isLessonCompleted ? <IconCheck size={18} /> : <IconPlayerPlay size={18} />
                }
                loading={isMarkingComplete}
                onClick={handleMarkComplete}
                disabled={isLessonCompleted}
              >
                {isLessonCompleted
                  ? t('courses.completed')
                  : t('courses.markAsComplete')}
              </Button>
            )}

            <Button
              variant="light"
              rightSection={<IconChevronRight size={18} />}
              disabled={!nextLesson || !nextLesson.slug}
              onClick={() => nextLesson?.slug && handleNavigate(nextLesson.slug)}
            >
              {t('courses.nextLesson')}
            </Button>
          </Group>
        </ThemedPaper>
      </Stack>
    </Box>
  );
}

export default LessonPlayer;
