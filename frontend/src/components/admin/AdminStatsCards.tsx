import { memo } from 'react';
import { SimpleGrid, Skeleton } from '@mantine/core';
import { IconBook, IconUsers, IconCurrencyDollar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { StatCard } from '../common/StatCard';
import type { CourseStats } from '../../types/course.types';

export interface AdminStatsCardsProps {
  stats?: CourseStats;
  isLoading?: boolean;
}

export const AdminStatsCards = memo(function AdminStatsCards({
  stats,
  isLoading = false,
}: AdminStatsCardsProps) {
  const { t } = useTranslation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={100} radius="lg" />
        ))}
      </SimpleGrid>
    );
  }

  const statItems = [
    {
      label: t('admin.dashboard.totalCourses'),
      value: stats?.totalCourses || 0,
      icon: IconBook,
      color: 'indigo',
    },
    {
      label: t('admin.dashboard.publishedCourses'),
      value: stats?.publishedCourses || 0,
      icon: IconBook,
      color: 'green',
    },
    {
      label: t('admin.dashboard.totalEnrollments'),
      value: stats?.totalEnrollments || 0,
      icon: IconUsers,
      color: 'violet',
    },
    {
      label: t('admin.dashboard.totalRevenue'),
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: IconCurrencyDollar,
      color: 'emerald',
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      {statItems.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </SimpleGrid>
  );
});

export default AdminStatsCards;
