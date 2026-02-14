import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Stack, SimpleGrid, Text, Group, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { PageHeader, ThemedPaper } from '../../components/common';
import { AdminStatsCards, CourseTable } from '../../components/admin';
import { adminApi } from '../../api/admin.api';
import type { AdminDashboardStats, Course } from '../../types/course.types';

export function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsResponse, coursesResponse] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.listCourses({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        ]);

        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        }
        if (coursesResponse.success && coursesResponse.data) {
          setRecentCourses(coursesResponse.data.courses);
        }
      } catch {
        // Error handling
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEditCourse = (course: Course) => {
    navigate(`/admin/courses/${course.id}/edit`);
  };

  return (
    <Box p="xl">
      <Stack gap="xl">
        <PageHeader
          title={t('admin.dashboard.title')}
          subtitle={t('admin.dashboard.subtitle')}
        />

        <AdminStatsCards stats={stats || undefined} isLoading={isLoading} />

        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="lg">
              {t('admin.dashboard.recentCourses')}
            </Text>
            <Button size="xs" variant="light" onClick={() => navigate('/admin/courses')}>
              {t('admin.dashboard.viewAll')}
            </Button>
          </Group>

          <CourseTable
            courses={recentCourses}
            isLoading={isLoading}
            onEdit={handleEditCourse}
          />
        </Stack>

        {stats?.recentEnrollments && stats.recentEnrollments.length > 0 && (
          <ThemedPaper p="lg">
            <Stack gap="md">
              <Text fw={600} size="lg">
                {t('admin.dashboard.recentEnrollments')}
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {stats.recentEnrollments.slice(0, 6).map((enrollment) => (
                  <ThemedPaper key={enrollment.id} p="md">
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>
                        {enrollment.course?.title || t('courses.untitled')}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR')}
                      </Text>
                    </Stack>
                  </ThemedPaper>
                ))}
              </SimpleGrid>
            </Stack>
          </ThemedPaper>
        )}
      </Stack>
    </Box>
  );
}

export default AdminDashboard;
