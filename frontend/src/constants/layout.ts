export const LAYOUT = {
  HEADER_HEIGHT: 60,
  NAVBAR_WIDTH: 260,
  NAVBAR_COLLAPSED_WIDTH: 80,
  SIDEBAR_BREAKPOINT: 'sm',
  MAIN_PADDING: 'lg',
} as const;

export const BREAKPOINTS = {
  mobile: '(max-width: 48em)', // 768px
  tablet: '(max-width: 64em)', // 1024px
  desktop: '(min-width: 64em)', // 1024px
  largeDesktop: '(min-width: 80em)', // 1280px
} as const;

export const Z_INDEX = {
  base: 1,
  dropdown: 100,
  header: 200,
  fab: 250,
  modal: 300,
  notification: 400,
  tooltip: 500,
} as const;
