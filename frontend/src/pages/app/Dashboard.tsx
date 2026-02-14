import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Box, SimpleGrid, Stack, Badge, Group, Text, Skeleton, Button } from '@mantine/core';
import { IconBook, IconCertificate, IconChartBar, IconTrendingUp, IconMoodEmpty } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth.store';
import { useCoursesStore } from '../../stores/courses.store';
import { PageHeader, StatCard, EmptyState } from '../../components/common';
import { EnrollmentCard } from '../../components/courses';

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { enrollments, isLoadingEnrollments, fetchMyEnrollments } = useCoursesStore();

  useEffect(() => {
    fetchMyEnrollments();
  }, [fetchMyEnrollments]);

  const userName = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  const dashboardStats = useMemo(() => {
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter((e) => e.progress === 100).length;
    const inProgressCourses = enrollments.filter((e) => e.progress > 0 && e.progress < 100).length;

    const totalProgress =
      totalCourses > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / totalCourses)
        : 0;

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalProgress,
    };
  }, [enrollments]);

  const recentCourses = useMemo(() => {
    return [...enrollments]
      .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
      .slice(0, 3);
  }, [enrollments]);

  const stats = [
    {
      label: t('dashboard.myCourses'),
      value: dashboardStats.totalCourses,
      icon: IconBook,
      color: 'indigo',
      onClick: () => navigate('/app/courses'),
    },
    {
      label: t('dashboard.progress'),
      value: `${dashboardStats.totalProgress}%`,
      icon: IconChartBar,
      color: 'emerald',
    },
    {
      label: t('dashboard.certificates'),
      value: dashboardStats.completedCourses,
      icon: IconCertificate,
      color: 'amber',
      onClick: () => navigate('/app/certificates'),
    },
    {
      label: t('dashboard.inProgress'),
      value: dashboardStats.inProgressCourses,
      icon: IconTrendingUp,
      color: 'violet',
      onClick: () => navigate('/app/courses'),
    },
  ];

  if (isLoadingEnrollments) {
    return (
      <Box p="xl">
        <Stack gap="xl">
          <PageHeader
            title={t('dashboard.greeting')}
            greeting={userName}
            subtitle={
              <Group gap="xs" mt="xs">
                {user?.roles?.map((role) => (
                  <Badge key={role} variant="light" color="indigo">
                    {role}
                  </Badge>
                ))}
              </Group>
            }
          />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={100} radius="lg" />
            ))}
          </SimpleGrid>
        </Stack>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Stack gap="xl">
        <PageHeader
          title={t('dashboard.greeting')}
          greeting={userName}
          subtitle={
            <Group gap="xs" mt="xs">
              {user?.roles?.map((role) => (
                <Badge key={role} variant="light" color="indigo">
                  {role}
                </Badge>
              ))}
            </Group>
          }
        />

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              onClick={stat.onClick}
            />
          ))}
        </SimpleGrid>

        {recentCourses.length > 0 && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} size="lg">
                {t('dashboard.recentCourses')}
              </Text>
              <Button size="xs" variant="light" onClick={() => navigate('/app/courses')}>
                {t('dashboard.viewAll')}
              </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {recentCourses.map((enrollment) => (
                <EnrollmentCard key={enrollment.id} enrollment={enrollment} variant="compact" />
              ))}
            </SimpleGrid>
          </Stack>
        )}

        {enrollments.length === 0 && (
          <EmptyState
            icon={IconMoodEmpty}
            message={t('dashboard.noCoursesYet')}
            action={
              <Button onClick={() => navigate('/courses')}>
                {t('dashboard.exploreCourses')}
              </Button>
            }
          />
        )}
      </Stack>
    </Box>
  );
}
