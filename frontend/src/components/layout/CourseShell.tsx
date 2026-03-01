import { useEffect, useState, useCallback } from 'react';
import {
  AppShell as MantineAppShell,
  Box,
  Burger,
  Group,
  Text,
  ThemeIcon,
  ActionIcon,
  Badge,
  ScrollArea,
  Stack,
  Title,
  Skeleton,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconSchool, IconArrowLeft } from '@tabler/icons-react';
import { Outlet, Link, useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LessonList } from '../courses';
import { useThemedStyles } from '../../hooks';
import { useCoursesStore } from '../../stores/courses.store';
import { useAuthStore } from '../../stores/auth.store';
import { enrollmentsApi } from '../../api/enrollments.api';
import { LAYOUT, BREAKPOINTS } from '../../constants';
import type { EnrollmentWithProgress } from '../../types/course.types';

export function CourseShell() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const { isDark, mainBgStyle, headerStyle } = useThemedStyles();

  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure();
  const [desktopCollapsed, { toggle: toggleDesktop }] = useDisclosure(false);

  const {
    currentCourse,
    isLoadingCourse,
    fetchCourseBySlug,
    clearCurrentCourse,
  } = useCoursesStore();

  const [enrollment, setEnrollment] = useState<EnrollmentWithProgress | null>(null);

  // Fetch course
  useEffect(() => {
    if (slug) {
      fetchCourseBySlug(slug);
    }
    return () => {
      clearCurrentCourse();
    };
  }, [slug, fetchCourseBySlug, clearCurrentCourse]);

  // Fetch enrollment
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

  const handleLessonNavigate = useCallback(
    (lessonSlugToNavigate: string) => {
      navigate(`/courses/${slug}/lessons/${lessonSlugToNavigate}`);
      closeMobile();
    },
    [navigate, slug, closeMobile]
  );

  const sidebarWidth = desktopCollapsed ? LAYOUT.NAVBAR_COLLAPSED_WIDTH : 360;

  return (
    <MantineAppShell
      header={{ height: LAYOUT.HEADER_HEIGHT }}
      navbar={{
        width: { base: sidebarWidth },
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: false },
      }}
      padding={0}
      transitionDuration={200}
      transitionTimingFunction="ease"
      styles={(theme) => ({
        main: mainBgStyle(theme),
      })}
    >
      <MantineAppShell.Header
        style={(theme) => ({
          ...headerStyle(theme),
          borderBottom: `1px solid ${isDark ? theme.colors.slate[7] : theme.colors.slate[2]}`,
        })}
      >
        <Group h="100%" gap={0} style={{ flex: 1 }}>
          {/* Desktop header left - sidebar toggle */}
          <Box
            visibleFrom="sm"
            style={{
              width: sidebarWidth,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: desktopCollapsed ? 'center' : 'space-between',
              padding: `0 var(--mantine-spacing-md)`,
              borderRight: `1px solid ${isDark ? 'var(--mantine-color-slate-7)' : 'var(--mantine-color-slate-2)'}`,
              transition: 'width 200ms ease',
              overflow: 'hidden',
            }}
          >
            {!desktopCollapsed && (
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit', overflow: 'hidden' }}>
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon
                    size="lg"
                    radius="md"
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
                    style={{ flexShrink: 0 }}
                  >
                    <IconSchool size={20} />
                  </ThemeIcon>
                  <Text
                    fw={700}
                    size="lg"
                    style={{
                      fontFamily: '"Outfit", sans-serif',
                      whiteSpace: 'nowrap',
                      opacity: desktopCollapsed ? 0 : 1,
                      transition: 'opacity 150ms ease',
                    }}
                  >
                    Maroquio.com
                  </Text>
                </Group>
              </Link>
            )}
            <Burger
              opened={!desktopCollapsed}
              onClick={toggleDesktop}
              size="sm"
              aria-label="Toggle sidebar"
              style={{ flexShrink: 0 }}
            />
          </Box>

          {/* Mobile header */}
          <Group h="100%" px="md" gap="sm" hiddenFrom="sm">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              size="sm"
              aria-label="Toggle navigation"
            />
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => navigate('/courses')}
              aria-label={t('courses.backToCourse')}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Text fw={600} size="sm" lineClamp={1} style={{ fontFamily: '"Outfit", sans-serif' }}>
              {currentCourse?.title || '...'}
            </Text>
          </Group>

          {/* Desktop right side - course title + back button */}
          <Group visibleFrom="sm" gap="md" px="md" style={{ flex: 1 }} justify="space-between">
            <Group gap="md">
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => navigate('/courses')}
                aria-label={t('courses.backToCourse')}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Text fw={600} size="lg" lineClamp={1} style={{ fontFamily: '"Outfit", sans-serif' }}>
                {currentCourse?.title || '...'}
              </Text>
            </Group>
            {enrollment && (
              <Badge size="lg" variant="light" color="violet">
                {enrollment.progress}% {t('courses.completed').toLowerCase()}
              </Badge>
            )}
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar
        style={(theme) => ({
          ...headerStyle(theme),
          borderRight: `1px solid ${isDark ? theme.colors.slate[7] : theme.colors.slate[2]}`,
        })}
      >
        {desktopCollapsed && !isMobile ? (
          <Box p="xs" style={{ textAlign: 'center' }}>
            <ThemeIcon size="lg" radius="md" variant="light" color="violet">
              <IconSchool size={20} />
            </ThemeIcon>
          </Box>
        ) : (
          <ScrollArea style={{ flex: 1 }} p="md">
            <Stack gap="md">
              <Title order={5}>{t('courses.curriculum')}</Title>
              {isLoadingCourse ? (
                <Stack gap="xs">
                  <Skeleton height={40} />
                  <Skeleton height={40} />
                  <Skeleton height={40} />
                </Stack>
              ) : currentCourse ? (
                <LessonList
                  lessons={allLessons}
                  modules={currentCourse.modules}
                  courseSlug={currentCourse.slug}
                  isEnrolled={!!enrollment}
                  progress={enrollment?.lessonsProgress || []}
                  onLessonClick={(lesson) => lesson.slug && handleLessonNavigate(lesson.slug)}
                />
              ) : null}
            </Stack>
          </ScrollArea>
        )}
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet context={{ currentCourse, enrollment, setEnrollment, isLoadingCourse }} />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
