import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation/Navigation';

const HomePage = lazy(() => import('./pages/HomePage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const FollowingFeedPage = lazy(() => import('./pages/FollowingFeedPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfileFormPage = lazy(() => import('./pages/ProfileFormPage'));

const PageLoader = () => (
  <div className="main-content">
    <div className="spinner"></div>
  </div>
);

const OnboardingGuard = ({ children }) => {
  const { currentUser, needsProfile } = useAuth();
  const location = useLocation();
  const isGuest = currentUser?.role === 'guest';
  const onProfileForm = location.pathname === '/profile/edit';

  if (currentUser && !isGuest && needsProfile && !onProfileForm) {
    return <Navigate to="/profile/edit" replace />;
  }
  return children;
};

function AppShell() {
  useEffect(() => {
    // Warm backend early; helps reduce first API delay on cold starts.
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const origin = apiBase.replace(/\/api$/, '');
    fetch(`${origin}/health`, { method: 'GET', mode: 'cors' }).catch(() => {});
  }, []);

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <OnboardingGuard>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/following" element={<FollowingFeedPage />} />
              <Route path="/profile/:memberId" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<ProfileFormPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </Suspense>
        </OnboardingGuard>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
