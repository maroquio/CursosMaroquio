import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useAuthStore } from './stores/auth.store';

function App() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return <RouterProvider router={router} />;
}

export default App;
