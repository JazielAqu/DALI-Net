import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation/Navigation';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import FollowingFeedPage from './pages/FollowingFeedPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';

function AppShell() {
  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/following" element={<FollowingFeedPage />} />
          <Route path="/profile/:memberId" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
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
