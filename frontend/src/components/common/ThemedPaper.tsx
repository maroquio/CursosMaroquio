import { Paper } from '@mantine/core';
import type { PaperProps, MantineTheme } from '@mantine/core';
import { useThemedStyles } from '../../hooks';
import type { ReactNode, CSSProperties } from 'react';

export interface ThemedPaperProps extends Omit<PaperProps, 'style'> {
  children: ReactNode;
  hoverable?: boolean;
  onClick?: () => void;
  style?: ((theme: MantineTheme) => CSSProperties) | CSSProperties;
}

export function ThemedPaper({
  children,
  hoverable = false,
  onClick,
  style,
  ...props
}: ThemedPaperProps) {
  const { paperStyle, paperHoverStyle } = useThemedStyles();

  const combinedStyle = (theme: MantineTheme): CSSProperties => {
    const baseStyles = hoverable || onClick ? paperHoverStyle(theme) : paperStyle(theme);

    if (style) {
      const customStyles = typeof style === 'function' ? style(theme) : style;
      return { ...baseStyles, ...customStyles };
    }
    return baseStyles;
  };

  return (
    <Paper
      withBorder
      radius="lg"
      style={combinedStyle as PaperProps['style']}
      onClick={onClick}
      {...props}
    >
      {children}
    </Paper>
  );
}
