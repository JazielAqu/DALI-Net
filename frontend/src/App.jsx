import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation/Navigation';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import FollowingFeedPage from './pages/FollowingFeedPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import ProfileFormPage from './pages/ProfileFormPage';

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
  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <OnboardingGuard>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/following" element={<FollowingFeedPage />} />
            <Route path="/profile/:memberId" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileFormPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
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
