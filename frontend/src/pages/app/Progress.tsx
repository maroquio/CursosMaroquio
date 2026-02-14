import { useEffect, useState } from 'react';
import { Box, Title, Text, Stack, Group, Progress as MantineProgress, RingProgress, Skeleton } from '@mantine/core';
import { IconTrophy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PageHeader, ThemedPaper, StatCard } from '../../components/common';
import { enrollmentsApi } from '../../api/enrollments.api';
import type { Enrollment } from '../../types/course.types';

export function Progress() {
  const { t } = useTranslation();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentsApi
      .getMyEnrollments()
      .then((res) => {
        if (res.success && res.data) {
          setEnrollments(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const totalCourses = enrollments.length;
  const coursesCompleted = enrollments.filter((e) => e.status === 'completed').length;
  const totalProgress =
    totalCourses > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / totalCourses)
      : 0;

  if (loading) {
    return (
      <Box p="xl">
        <Stack gap="xl">
          <PageHeader title={t('nav.progress')} subtitle="Acompanhe seu progresso de estudos" />
          <Group grow align="stretch">
            <Skeleton height={160} radius="md" />
            <Skeleton height={160} radius="md" />
          </Group>
          <Skeleton height={200} radius="md" />
        </Stack>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Stack gap="xl">
        <PageHeader title={t('nav.progress')} subtitle="Acompanhe seu progresso de estudos" />

        {totalCourses === 0 ? (
          <ThemedPaper p="xl">
            <Stack align="center" gap="md" py="xl">
              <Text c="dimmed" ta="center">
                Você ainda não está matriculado em nenhum curso.
              </Text>
            </Stack>
          </ThemedPaper>
        ) : (
          <>
            <Group grow align="stretch">
              <ThemedPaper p="lg">
                <Stack align="center" gap="md">
                  <RingProgress
                    size={120}
                    thickness={12}
                    roundCaps
                    sections={[{ value: totalProgress, color: 'indigo' }]}
                    label={
                      <Text ta="center" fw={700} size="xl" style={{ fontFamily: '"Outfit", sans-serif' }}>
                        {totalProgress}%
                      </Text>
                    }
                  />
                  <Text ta="center" c="dimmed" size="sm">
                    Progresso Geral
                  </Text>
                </Stack>
              </ThemedPaper>

              <StatCard
                label="Cursos Concluídos"
                value={`${coursesCompleted}/${totalCourses}`}
                icon={IconTrophy}
                color="amber"
              />
            </Group>

            <ThemedPaper p="lg">
              <Stack gap="md">
                <Title order={4} style={{ fontFamily: '"Outfit", sans-serif' }}>
                  Progresso por Curso
                </Title>
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id}>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">{enrollment.courseTitle || 'Curso'}</Text>
                      <Text size="sm" c="dimmed">
                        {enrollment.progress}%
                      </Text>
                    </Group>
                    <MantineProgress
                      value={enrollment.progress}
                      size="sm"
                      radius="xl"
                      color={enrollment.progress === 100 ? 'emerald' : 'indigo'}
                    />
                  </div>
                ))}
              </Stack>
            </ThemedPaper>
          </>
        )}
      </Stack>
    </Box>
  );
}
