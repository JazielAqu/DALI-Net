import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../../services/api';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import { getSafeImageUrl } from '../../utils/imageUtils';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, logout, personaProfile, needsProfile } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [badgeCleared, setBadgeCleared] = useState(false);
  const [lastClearedUnread, setLastClearedUnread] = useState(0);
  const defaultAvatar = `${import.meta.env.BASE_URL || '/'}default-avatar.jpg`;
  const [failedSrcs, setFailedSrcs] = useState({});
  useEffect(() => {
    setFailedSrcs({});
  }, [currentUser?.profileImage, currentUser?.image, currentUser?.picture, personaProfile?.image]);
  const avatarSrc = getSafeImageUrl(
    [currentUser?.profileImage, currentUser?.image, currentUser?.picture, personaProfile?.image],
    failedSrcs,
    defaultAvatar
  );

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => notificationsAPI.getByUser(currentUser?.id, { unreadOnly: true }),
    enabled: !!currentUser?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false,
    onSuccess: () => {
      // Keep local badge state in sync if unread count decreased (e.g., read elsewhere)
      if (badgeCleared) {
        setLastClearedUnread((prev) => Math.min(prev, unreadCount));
      }
    },
  });

  const unreadCount = notificationsData?.data?.unreadCount || 0;
  const displayUnread = badgeCleared ? 0 : unreadCount;

  // Persist badge state per user so it stays cleared after logout/login until new notifications arrive
  useEffect(() => {
    if (currentUser?.id) {
      const stored = localStorage.getItem(`notifBadge:${currentUser.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setBadgeCleared(parsed.badgeCleared || false);
          setLastClearedUnread(parsed.lastClearedUnread || 0);
        } catch {
          setBadgeCleared(false);
          setLastClearedUnread(0);
        }
      } else {
        setBadgeCleared(false);
        setLastClearedUnread(0);
      }
    } else {
      setBadgeCleared(false);
      setLastClearedUnread(0);
    }
  }, [currentUser?.id]);

  // Show badge again if unread count grows beyond what was cleared
  useEffect(() => {
    if (!badgeCleared) return;
    if (unreadCount > lastClearedUnread) {
      setBadgeCleared(false);
    }
  }, [unreadCount, badgeCleared, lastClearedUnread]);

  const persistBadgeState = (cleared, clearedCount) => {
    if (!currentUser?.id) return;
    const payload = { badgeCleared: cleared, lastClearedUnread: clearedCount };
    localStorage.setItem(`notifBadge:${currentUser.id}`, JSON.stringify(payload));
  };

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
            needsProfile && currentUser.role !== 'guest' ? (
              <Link to="/profile/edit" className="nav-link highlight">Complete Profile</Link>
            ) : (
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
                  setLastClearedUnread(unreadCount);
                  persistBadgeState(true, unreadCount);
                }}
              >
                  🔔
                  {displayUnread > 0 && (
                    <span className="notification-badge">{displayUnread}</span>
                  )}
                </button>
              </>
            )
          ) : (
            <Link to="/login" className="nav-link">Login</Link>
          )}
        </div>

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
