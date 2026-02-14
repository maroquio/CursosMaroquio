import { Button, type ButtonProps } from '@mantine/core';
import { PRIMARY_GRADIENT, ACCENT_GRADIENT } from '../../constants';
import type { ReactNode, ElementType, ComponentPropsWithoutRef } from 'react';

type ButtonComponentProps = ButtonProps & ComponentPropsWithoutRef<'button'>;

export interface PrimaryButtonProps extends Omit<ButtonComponentProps, 'variant' | 'gradient'> {
  children?: ReactNode;
  accent?: boolean;
  component?: ElementType;
  to?: string;
}

export function PrimaryButton({
  children,
  accent = false,
  ...props
}: PrimaryButtonProps) {
  const gradient = accent ? ACCENT_GRADIENT : PRIMARY_GRADIENT;

  return (
    <Button
      variant="gradient"
      gradient={gradient}
      {...(props as ButtonProps)}
    >
      {children}
    </Button>
  );
}
