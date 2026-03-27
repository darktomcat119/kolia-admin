import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AuthConfirm } from './pages/AuthConfirm';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Restaurants } from './pages/Restaurants';
import { RestaurantEdit } from './pages/RestaurantEdit';
import { MenuEditor } from './pages/MenuEditor';
import { Reviews } from './pages/Reviews';
import { LandingContent } from './pages/LandingContent';
import type { ReactNode } from 'react';

function AuthGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF7] px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF7] px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }
  if (session) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <GuestGuard>
                <Login />
              </GuestGuard>
            }
          />
          <Route path="/auth/confirm" element={<AuthConfirm />} />

          {/* Protected */}
          <Route
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurants/:id" element={<RestaurantEdit />} />
            <Route path="/restaurants/:id/menu" element={<MenuEditor />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/landing" element={<LandingContent />} />
          </Route>

          {/* Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
