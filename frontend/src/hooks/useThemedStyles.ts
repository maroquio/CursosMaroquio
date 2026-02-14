import { useCallback, useMemo } from 'react';
import { useMantineColorScheme, useMantineTheme } from '@mantine/core';
import type { MantineTheme, DefaultMantineColor } from '@mantine/core';
import type { CSSProperties } from 'react';

type StyleFunction = (theme: MantineTheme) => CSSProperties;

export function useThemedStyles() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';

  // Helpers de cor
  const getBgColor = useCallback(
    (lightColor = 'white', darkShade = 8): string => {
      return isDark ? theme.colors.slate[darkShade] : lightColor;
    },
    [isDark, theme.colors.slate]
  );

  const getBorderColor = useCallback(
    (lightShade = 2, darkShade = 7): string => {
      return isDark ? theme.colors.slate[darkShade] : theme.colors.slate[lightShade];
    },
    [isDark, theme.colors.slate]
  );

  // Estilos de Paper/Card
  const paperStyle = useCallback(
    (t: MantineTheme): CSSProperties => ({
      backgroundColor: isDark ? t.colors.slate[8] : 'white',
      borderColor: isDark ? t.colors.slate[7] : t.colors.slate[2],
    }),
    [isDark]
  );

  const paperHoverStyle = useCallback(
    (t: MantineTheme): CSSProperties => ({
      ...paperStyle(t),
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
    [paperStyle]
  );

  // Estilos para itens selecionados
  const getSelectedItemStyle = useCallback(
    (selected: boolean, color: DefaultMantineColor = 'primary'): StyleFunction => {
      return (t: MantineTheme): CSSProperties => ({
        backgroundColor: selected
          ? isDark
            ? `rgba(99, 102, 241, 0.2)`
            : t.colors[color][0]
          : 'transparent',
        borderColor: selected
          ? isDark
            ? t.colors[color][8]
            : t.colors[color][2]
          : isDark
            ? t.colors.slate[7]
            : t.colors.slate[2],
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      });
    },
    [isDark]
  );

  // Estilos especializados
  const dangerZoneStyle = useCallback(
    (t: MantineTheme): CSSProperties => ({
      backgroundColor: isDark ? `rgba(244, 63, 94, 0.1)` : t.colors.rose[0],
      borderColor: isDark ? t.colors.rose[8] : t.colors.rose[2],
    }),
    [isDark]
  );

  const successFeedbackStyle = useCallback(
    (t: MantineTheme): CSSProperties => ({
      backgroundColor: isDark ? `rgba(16, 185, 129, 0.2)` : t.colors.emerald[0],
      border: `1px solid ${isDark ? t.colors.emerald[8] : t.colors.emerald[2]}`,
    }),
    [isDark]
  );

  // Estilo do main background
  const mainBgStyle = useCallback(
    (t: MantineTheme): CSSProperties => ({
      backgroundColor: isDark ? t.colors.slate[9] : t.colors.slate[0],
    }),
    [isDark]
  );

  // Estilo de header/navbar
  const headerStyle = useCallback(
    (t: MantineTheme): CSSProperties => ({
      backgroundColor: isDark ? t.colors.slate[9] : 'white',
      borderColor: isDark ? t.colors.slate[7] : t.colors.slate[2],
    }),
    [isDark]
  );

  return useMemo(
    () => ({
      colorScheme,
      setColorScheme,
      toggleColorScheme,
      theme,
      isDark,
      paperStyle,
      paperHoverStyle,
      getBgColor,
      getBorderColor,
      getSelectedItemStyle,
      dangerZoneStyle,
      successFeedbackStyle,
      mainBgStyle,
      headerStyle,
    }),
    [
      colorScheme,
      setColorScheme,
      toggleColorScheme,
      theme,
      isDark,
      paperStyle,
      paperHoverStyle,
      getBgColor,
      getBorderColor,
      getSelectedItemStyle,
      dangerZoneStyle,
      successFeedbackStyle,
      mainBgStyle,
      headerStyle,
    ]
  );
}
