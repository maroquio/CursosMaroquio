import { useEffect, useMemo } from 'react';
import { useBreadcrumbsStore, type BreadcrumbItem } from '../stores/breadcrumbs.store';

export function useBreadcrumbs(items: BreadcrumbItem[]) {
  const { setBreadcrumbs, clearBreadcrumbs } = useBreadcrumbsStore();

  const serializedItems = useMemo(() => JSON.stringify(items), [items]);

  useEffect(() => {
    setBreadcrumbs(JSON.parse(serializedItems));

    return () => {
      clearBreadcrumbs();
    };
  }, [serializedItems, setBreadcrumbs, clearBreadcrumbs]);
}
