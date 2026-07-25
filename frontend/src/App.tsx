import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from '@/components/layout';
import { LoginPage } from '@/pages/login';
import { AuthCallbackPage } from '@/pages/auth-callback';
import { DashboardPage } from '@/pages/dashboard';
import { RepositoriesPage } from '@/pages/repositories';
import { ReviewsPage } from '@/pages/reviews';
import { ReviewDetailPage } from '@/pages/review-detail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                </Route>

                {/* Auth callback (accessible without auth) */}
                <Route
                  path="/auth/callback"
                  element={<AuthCallbackPage />}
                />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route
                      path="/repositories"
                      element={<RepositoriesPage />}
                    />
                    <Route path="/reviews" element={<ReviewsPage />} />
                    <Route
                      path="/reviews/:id"
                      element={<ReviewDetailPage />}
                    />
                  </Route>
                </Route>

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
