import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ColorScheme = 'light' | 'dark';

interface ThemeState {
  colorScheme: ColorScheme;
}

interface ThemeActions {
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      colorScheme: 'light',

      setColorScheme: (scheme: ColorScheme) => {
        set({ colorScheme: scheme });
      },

      toggleColorScheme: () => {
        const current = get().colorScheme;
        set({ colorScheme: current === 'light' ? 'dark' : 'light' });
      },
    }),
    {
      name: 'mantine-color-scheme-value',
    }
  )
);
