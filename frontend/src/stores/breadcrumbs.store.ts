import { create } from 'zustand';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsState {
  items: BreadcrumbItem[];
}

interface BreadcrumbsActions {
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  clearBreadcrumbs: () => void;
}

type BreadcrumbsStore = BreadcrumbsState & BreadcrumbsActions;

export const useBreadcrumbsStore = create<BreadcrumbsStore>()((set) => ({
  items: [],

  setBreadcrumbs: (items: BreadcrumbItem[]) => {
    set({ items });
  },

  clearBreadcrumbs: () => {
    set({ items: [] });
  },
}));
