import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../../services/api';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import { getSafeImageUrl } from '../../utils/imageUtils';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, setUser } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const defaultAvatar = '/default-avatar.jpg';
  const [failedSrcs, setFailedSrcs] = useState({});
  const avatarSrc = getSafeImageUrl(
    [currentUser?.profileImage, currentUser?.image],
    failedSrcs,
    defaultAvatar
  );

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => notificationsAPI.getByUser(currentUser?.id, { unreadOnly: true }),
    enabled: !!currentUser?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false,
  });

  const unreadCount = notificationsData?.data?.unreadCount || 0;
  const handleLogout = () => {
    setUser(null);
    setShowNotifications(false);
    navigate('/');
  };

  const handleAvatarError = (e) => {
    e.target.onerror = null;
    setFailedSrcs((prev) => ({ ...prev, [avatarSrc]: true }));
    e.target.src = defaultAvatar;
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🌐</span>
          <span className="logo-text">DALI Net</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          {currentUser && (
            <>
              <Link to="/feed" className="nav-link">Feed</Link>
              <Link to={`/profile/${currentUser.id}`} className="nav-link">Profile</Link>
              <button
                className="nav-link nav-notifications"
                onClick={() => setShowNotifications(true)}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
            </>
          )}
        </div>

        {!currentUser && (
          <div className="nav-user-select">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  // In a real app, this would be handled by authentication
                  // For demo, we'll just show a message
                  alert('Please select a user from the home page');
                }
              }}
              className="user-select"
            >
              <option value="">Select User</option>
            </select>
          </div>
        )}

        {currentUser && (
          <div className="nav-user">
            <img
              src={avatarSrc}
              alt={currentUser.name}
              className="nav-avatar"
              onError={handleAvatarError}
            />
            <span className="nav-username">{currentUser.name}</span>
            <button className="nav-link nav-logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </nav>
  );
};

export default Navigation;
