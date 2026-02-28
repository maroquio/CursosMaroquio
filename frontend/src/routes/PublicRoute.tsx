import { Navigate, useLocation } from 'react-router';
import { Center, Loader } from '@mantine/core';
import { useAuthStore } from '../stores/auth.store';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectAuthenticated?: boolean;
}

export function PublicRoute({ children, redirectAuthenticated = false }: PublicRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useAuthStore();
  const from = (location.state as { from?: Location })?.from?.pathname || '/app/dashboard';

  if (isInitializing) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (redirectAuthenticated && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
