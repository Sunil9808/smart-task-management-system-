import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './hooks/useApp';
import { Loading, ErrorState } from './components/Common';
import { AppLayout } from './layouts/AppLayout';
import { AuthPage } from './pages/AuthPage';
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })),
);
import { TasksPage } from './pages/TasksPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFound } from './pages/NotFound';
function Protected() {
  const { user, loading, error, refresh } = useAuth(),
    location = useLocation();
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/login" element={<AuthPage key="login" />} />
              <Route path="/register" element={<AuthPage key="register" register />} />
              <Route element={<Protected />}>
                <Route element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="tasks" element={<TasksPage key="all" />} />
                  <Route path="today" element={<TasksPage key="today" view="today" />} />
                  <Route path="upcoming" element={<TasksPage key="upcoming" view="upcoming" />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
