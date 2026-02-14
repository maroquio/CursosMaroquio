import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Box, SimpleGrid, Stack, Skeleton } from '@mantine/core';
import { IconMoodEmpty } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PageHeader, PrimaryButton, EmptyState } from '../../components/common';
import { EnrollmentCard } from '../../components/courses';
import { useCoursesStore } from '../../stores/courses.store';

export function Courses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enrollments, isLoadingEnrollments, fetchMyEnrollments } = useCoursesStore();

  useEffect(() => {
    fetchMyEnrollments();
  }, [fetchMyEnrollments]);

  if (isLoadingEnrollments) {
    return (
      <Box p="xl">
        <Stack gap="xl">
          <PageHeader title={t('nav.courses')} subtitle={t('courses.myCoursesSubtitle')} />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={200} radius="lg" />
            ))}
          </SimpleGrid>
        </Stack>
      </Box>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Box p="xl">
        <Stack gap="xl">
          <PageHeader title={t('nav.courses')} subtitle={t('courses.myCoursesSubtitle')} />
          <EmptyState
            icon={IconMoodEmpty}
            message={t('courses.noEnrollments')}
            action={
              <PrimaryButton onClick={() => navigate('/courses')}>
                {t('courses.browseCatalog')}
              </PrimaryButton>
            }
          />
        </Stack>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Stack gap="xl">
        <PageHeader title={t('nav.courses')} subtitle={t('courses.myCoursesSubtitle')} />

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {enrollments.map((enrollment) => (
            <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
