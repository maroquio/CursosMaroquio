import { createTheme, virtualColor, type MantineColorsTuple } from '@mantine/core';

// Paleta de cores customizada - Neo-Futuristic
const indigo: MantineColorsTuple = [
  '#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8',
  '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81',
];

const violet: MantineColorsTuple = [
  '#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa',
  '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',
];

const pink: MantineColorsTuple = [
  '#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6',
  '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843',
];

const slate: MantineColorsTuple = [
  '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8',
  '#64748b', '#475569', '#334155', '#1e293b', '#0f172a',
];

const emerald: MantineColorsTuple = [
  '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399',
  '#10b981', '#059669', '#047857', '#065f46', '#064e3b',
];

const amber: MantineColorsTuple = [
  '#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24',
  '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
];

const rose: MantineColorsTuple = [
  '#fff1f2', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185',
  '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337',
];

export const theme = createTheme({
  primaryColor: 'primary',
  primaryShade: 5,

  colors: {
    indigo,
    violet,
    pink,
    slate,
    emerald,
    amber,
    rose,
    // Virtual colors que adaptam ao modo claro/escuro
    primary: virtualColor({ name: 'primary', dark: 'indigo', light: 'indigo' }),
    accent: virtualColor({ name: 'accent', dark: 'pink', light: 'pink' }),
  },

  // Tipografia
  fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", "Fira Code", monospace',
  headings: {
    fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2.5rem', lineHeight: '1.2' },
      h2: { fontSize: '2rem', lineHeight: '1.25' },
      h3: { fontSize: '1.5rem', lineHeight: '1.3' },
      h4: { fontSize: '1.25rem', lineHeight: '1.35' },
    },
  },

  // Raios de borda
  radius: {
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },

  // Espaçamentos
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  // Sombras
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  defaultRadius: 'md',
  cursorType: 'pointer',

  // Estilos padrão de componentes
  components: {
    Button: {
      defaultProps: { radius: 'md' },
      styles: {
        root: { fontWeight: 600, transition: 'all 0.2s ease' },
      },
    },
    Card: { defaultProps: { radius: 'lg', shadow: 'sm' } },
    Input: { defaultProps: { radius: 'md' } },
    TextInput: { defaultProps: { radius: 'md' } },
    PasswordInput: { defaultProps: { radius: 'md' } },
    Select: { defaultProps: { radius: 'md' } },
    Badge: { defaultProps: { radius: 'sm' } },
    Paper: { defaultProps: { radius: 'lg' } },
    Modal: { defaultProps: { radius: 'lg' } },
    Notification: { defaultProps: { radius: 'md' } },
    NavLink: { defaultProps: { radius: 'md' } },
  },

  // Valores customizados
  other: {
    gradients: {
      primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      accent: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
      hero: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
    },
  },
});
