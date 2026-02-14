import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import { AuthenticatedShell } from '../components/layout/AuthenticatedShell';
import { CourseShell } from '../components/layout/CourseShell';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { OAuthCallback } from '../pages/OAuthCallback';
import { NotFound } from '../pages/NotFound';
import {
  Dashboard,
  Courses,
  Progress,
  Certificates,
  Calendar,
  Profile,
} from '../pages/app';
import { CoursesCatalog, CourseDetail, LessonPlayer } from '../pages/courses';
import {
  AdminDashboard,
  AdminCourses,
  AdminCourseForm,
  AdminLessons,
  AdminEnrollments,
  AdminCategories,
  AdminCalendarEvents,
  AdminLlmManufacturers,
  AdminLlmModels,
} from '../pages/admin';

export const router = createBrowserRouter([
  // Rotas Públicas - Layout com container centralizado
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'login',
        element: (
          <PublicRoute redirectAuthenticated>
            <Login />
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicRoute redirectAuthenticated>
            <Register />
          </PublicRoute>
        ),
      },
      {
        path: 'oauth/callback/:provider',
        element: <OAuthCallback />,
      },
      // Public course catalog
      {
        path: 'courses',
        element: <CoursesCatalog />,
      },
      // Course detail/presentation page (same layout as Home)
      {
        path: 'courses/:slug',
        element: <CourseDetail />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
  // Course lessons - Full-width layout with sidebar
  {
    path: '/courses/:slug',
    element: <CourseShell />,
    children: [
      {
        path: 'lessons',
        element: <LessonPlayer />,
      },
      {
        path: 'lessons/:lessonSlug',
        element: <LessonPlayer />,
      },
    ],
  },
  // Redirect antigo /dashboard para novo /app/dashboard
  {
    path: '/dashboard',
    element: <Navigate to="/app/dashboard" replace />,
  },
  // Rotas Protegidas - Layout full-width com sidebar
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AuthenticatedShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'courses',
        element: <Courses />,
      },
      {
        path: 'progress',
        element: <Progress />,
      },
      {
        path: 'certificates',
        element: <Certificates />,
      },
      {
        path: 'calendar',
        element: <Calendar />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
  // Rotas Admin - Layout full-width com sidebar (requer role admin)
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRoles={['admin']}>
        <AuthenticatedShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: 'courses',
        element: <AdminCourses />,
      },
      {
        path: 'courses/new',
        element: <AdminCourseForm />,
      },
      {
        path: 'courses/:id/edit',
        element: <AdminCourseForm />,
      },
      {
        path: 'courses/:id/lessons',
        element: <AdminLessons />,
      },
      {
        path: 'courses/:id/enrollments',
        element: <AdminEnrollments />,
      },
      {
        path: 'categories',
        element: <AdminCategories />,
      },
      {
        path: 'calendar-events',
        element: <AdminCalendarEvents />,
      },
      {
        path: 'llm-manufacturers',
        element: <AdminLlmManufacturers />,
      },
      {
        path: 'llm-models',
        element: <AdminLlmModels />,
      },
    ],
  },
]);
