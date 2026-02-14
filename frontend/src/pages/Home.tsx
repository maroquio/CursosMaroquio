import { useCallback, useEffect, useState } from 'react';
import { Container, Title, Text, Stack, Center, ThemeIcon, Box, SimpleGrid, Skeleton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import { IconSchool } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth.store';
import { PrimaryButton } from '../components/common';
import { HomeCourseCard } from '../components/courses/HomeCourseCard';
import { useThemedStyles } from '../hooks';
import { coursesApi } from '../api/courses.api';
import { enrollmentsApi } from '../api/enrollments.api';
import type { Course } from '../types/course.types';

export function Home() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { isDark, theme } = useThemedStyles();
  const isMobile = useMediaQuery('(max-width: 480px)');
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const coursesRes = await coursesApi.list({ status: 'published' });
        if (coursesRes.data) {
          setCourses(coursesRes.data.courses);
        }

        if (isAuthenticated) {
          try {
            const enrollmentsRes = await enrollmentsApi.getMyEnrollments();
            if (enrollmentsRes.data) {
              setEnrolledCourseIds(new Set(enrollmentsRes.data.map((e) => e.courseId)));
            }
          } catch {
            // silently fail - enrollments are supplementary
          }
        }
      } catch {
        // courses failed to load
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const handleEnroll = useCallback(async (courseId: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/' } });
      return;
    }
    try {
      await enrollmentsApi.enroll(courseId);
      setEnrolledCourseIds((prev) => new Set(prev).add(courseId));
      notifications.show({
        title: t('common.success'),
        message: t('home.enrollSuccess'),
        color: 'green',
      });
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('home.enrollError'),
        color: 'red',
      });
    }
  }, [isAuthenticated, navigate, t]);

  return (
    <Box
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${theme.colors.slate[9]} 0%, ${theme.colors.indigo[9]} 100%)`
          : `linear-gradient(135deg, ${theme.colors.slate[0]} 0%, ${theme.colors.indigo[0]} 100%)`,
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <Container size="xl" py="xl" px={isMobile ? 'md' : 'xl'}>
        <Center mih={isMobile ? '50vh' : '45vh'}>
          <Stack align="center" gap={isMobile ? 'lg' : 'xl'}>
            <ThemeIcon
              size={isMobile ? 60 : 80}
              radius="xl"
              variant="gradient"
              gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
            >
              <IconSchool size={isMobile ? 30 : 40} />
            </ThemeIcon>

            <Stack gap={isMobile ? 'xs' : 'sm'} align="center">
              <Title
                order={1}
                ta="center"
                style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: isMobile ? '1.4rem' : '2.2rem',
                  lineHeight: 1.3,
                }}
              >
                {t('home.welcome')}
              </Title>
              <Text
                ta="center"
                fw={700}
                style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: isMobile ? '1.6rem' : '2.8rem',
                  background: 'linear-gradient(135deg, var(--mantine-color-indigo-4) 0%, var(--mantine-color-violet-4) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t('home.author')}
              </Text>
            </Stack>

            <Text
              size={isMobile ? 'md' : 'xl'}
              c="dimmed"
              ta="center"
              px={isMobile ? 'xs' : 0}
            >
              {t('home.subtitle')}
            </Text>

            <PrimaryButton
              component={Link}
              to={isAuthenticated ? '/app/dashboard' : '/register'}
              size={isMobile ? 'md' : 'lg'}
              mt="md"
            >
              {t('home.cta')}
            </PrimaryButton>
          </Stack>
        </Center>

        <Stack gap="md" mt="xl">
          <Title order={2} ta="center">
            {t('home.availableCourses')}
          </Title>
          <Text c="dimmed" ta="center" mb="md">
            {t('home.availableCoursesSubtitle')}
          </Text>

          {loading ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={400} radius="md" />
              ))}
            </SimpleGrid>
          ) : courses.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">
              {t('home.noCoursesAvailable')}
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {courses.map((course) => (
                <HomeCourseCard
                  key={course.id}
                  course={course}
                  isAuthenticated={isAuthenticated}
                  isEnrolled={enrolledCourseIds.has(course.id)}
                  onEnroll={handleEnroll}
                />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
