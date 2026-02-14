import { Breadcrumbs, Anchor, Text } from '@mantine/core';
import { useNavigate } from 'react-router';
import { useBreadcrumbsStore } from '../../stores/breadcrumbs.store';

export function HeaderBreadcrumbs() {
  const { items } = useBreadcrumbsStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return null;
  }

  return (
    <Breadcrumbs
      styles={{
        root: {
          flexWrap: 'nowrap',
        },
        separator: {
          marginLeft: 4,
          marginRight: 4,
        },
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.path) {
          return (
            <Text key={index} size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              {item.label}
            </Text>
          );
        }

        return (
          <Anchor
            key={index}
            size="sm"
            onClick={() => navigate(item.path!)}
            style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            {item.label}
          </Anchor>
        );
      })}
    </Breadcrumbs>
  );
}
