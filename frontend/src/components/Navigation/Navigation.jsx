import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../../services/api';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import { getSafeImageUrl } from '../../utils/imageUtils';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, logout, personaProfile } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [badgeCleared, setBadgeCleared] = useState(false);
  const defaultAvatar = '/default-avatar.jpg';
  const [failedSrcs, setFailedSrcs] = useState({});
  const avatarSrc = getSafeImageUrl(
    [personaProfile?.image, currentUser?.profileImage, currentUser?.image],
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
  const displayUnread = badgeCleared ? 0 : unreadCount;
  const handleLogout = () => {
    logout();
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
          <img
            src="/dali-logo.png"
            alt="DALI logo"
            className="logo-image"
          />
          <span className="logo-text">Net</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          {currentUser ? (
            <>
              <Link to="/feed" className="nav-link">Lab Feed</Link>
              <Link to="/following" className="nav-link">Following</Link>
              {currentUser.role !== 'guest' && (
                <Link to={`/profile/${currentUser.id}`} className="nav-link">Profile</Link>
              )}
              <button
                className="nav-link nav-notifications"
                onClick={() => {
                  setShowNotifications(true);
                  setBadgeCleared(true);
                }}
              >
                🔔
                {displayUnread > 0 && (
                  <span className="notification-badge">{displayUnread}</span>
                )}
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link">Login</Link>
          )}
        </div>

        {currentUser && (
          <div className="nav-user">
            <img
              src={avatarSrc}
              alt={personaProfile?.name || currentUser.name}
              className="nav-avatar"
              onError={handleAvatarError}
            />
            <span className="nav-username">{personaProfile?.name || currentUser.name}</span>
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
