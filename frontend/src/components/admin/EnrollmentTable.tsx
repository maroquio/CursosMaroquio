import { memo, useMemo } from 'react';
import { ActionIcon, Badge, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  UserAvatarInfo,
  CourseProgressBar,
  type Column,
} from '../common';
import { formatDate } from '../../utils/formatters';
import { ENROLLMENT_STATUS_COLORS } from '../../constants/colors';
import type { EnrollmentDetails } from '../../types/course.types';

export interface EnrollmentTableProps {
  enrollments: EnrollmentDetails[];
  isLoading?: boolean;
  onRemove?: (enrollment: EnrollmentDetails) => void;
}

export const EnrollmentTable = memo(function EnrollmentTable({
  enrollments,
  isLoading = false,
  onRemove,
}: EnrollmentTableProps) {
  const { t } = useTranslation();

  const columns: Column<EnrollmentDetails>[] = useMemo(
    () => [
      {
        key: 'student',
        header: t('admin.enrollments.student'),
        render: (enrollment) => (
          <UserAvatarInfo
            name={enrollment.user?.name}
            email={enrollment.user?.email}
            fallbackText={t('admin.enrollments.unknownUser')}
          />
        ),
      },
      {
        key: 'status',
        header: t('admin.enrollments.status'),
        align: 'center',
        render: (enrollment) => (
          <Badge variant="light" color={ENROLLMENT_STATUS_COLORS[enrollment.status]}>
            {t(`admin.enrollments.statuses.${enrollment.status}`)}
          </Badge>
        ),
      },
      {
        key: 'progress',
        header: t('admin.enrollments.progress'),
        align: 'center',
        render: (enrollment) => (
          <CourseProgressBar progress={enrollment.progress} />
        ),
      },
      {
        key: 'enrolledAt',
        header: t('admin.enrollments.enrolledAt'),
        align: 'center',
        render: (enrollment) => (
          <Text size="sm" c="dimmed">
            {formatDate(enrollment.enrolledAt)}
          </Text>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        align: 'center',
        render: (enrollment) => (
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => onRemove?.(enrollment)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        ),
      },
    ],
    [t, onRemove]
  );

  return (
    <DataTable
      data={enrollments}
      columns={columns}
      isLoading={isLoading}
      emptyMessage={t('admin.enrollments.noEnrollments')}
      getRowKey={(enrollment) => enrollment.id}
    />
  );
});

export default EnrollmentTable;
