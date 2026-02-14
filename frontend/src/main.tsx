import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import App from './App';
import { theme } from './theme';
import { LoadingFallback } from './components/common/LoadingFallback';

// Inicializar i18n antes do render
import './i18n';

// Estilos Mantine
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Suspense fallback={<LoadingFallback />}>
        <ModalsProvider>
          <Notifications position="top-right" />
          <App />
        </ModalsProvider>
      </Suspense>
    </MantineProvider>
  </StrictMode>
);
