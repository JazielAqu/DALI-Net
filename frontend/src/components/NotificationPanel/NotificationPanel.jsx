import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import './NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => notificationsAPI.getByUser(currentUser?.id, { limit: 20 }),
    enabled: !!currentUser?.id && isOpen,
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
    },
  });

  const notifications = (notificationsData?.data?.data || []).slice().sort((a, b) => {
    const toDate = (val) => {
      if (!val) return 0;
      if (val.toDate) return val.toDate().getTime();
      if (val._seconds || val.seconds) {
        const seconds = val._seconds ?? val.seconds;
        const nanos = val._nanoseconds ?? val.nanoseconds ?? 0;
        return seconds * 1000 + Math.floor(nanos / 1e6);
      }
      return new Date(val).getTime();
    };
    return toDate(b.createdAt) - toDate(a.createdAt);
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'just now';

    const toDate = () => {
      if (date.toDate) return date.toDate();
      if (typeof date === 'number' || typeof date === 'string') return new Date(date);
      if (date._seconds || date.seconds) {
        const seconds = date._seconds ?? date.seconds;
        const millis = seconds * 1000 + Math.floor((date._nanoseconds ?? date.nanoseconds ?? 0) / 1e6);
        return new Date(millis);
      }
      return new Date(date);
    };

    const d = toDate();
    if (Number.isNaN(d.getTime())) return 'just now';

    const now = new Date();
    const msDiff = now - d;
    const days = Math.floor(msDiff / 86400000);

    const sameDay = now.toDateString() === d.toDateString();
    if (sameDay) return 'today';
    if (days >= 1 && days < 7) return days === 1 ? '1 day ago' : `${days} days ago`;

    return d.toLocaleDateString();
  };

  const getNotificationLink = (notification) => {
    if (notification.postId) {
      return `/feed`; // Could link to specific post if we had a post detail page
    }
    if (notification.relatedUserId) {
      return `/profile/${notification.relatedUserId}`;
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel-overlay" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-panel-header">
          <h3>Notifications</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="no-notifications">No notifications yet</div>
          ) : (
            notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const content = (
                <div
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <p>{notification.content}</p>
                    <span className="notification-time">{formatDate(notification.createdAt)}</span>
                  </div>
                </div>
              );

              return link ? (
                <Link key={notification.id} to={link} onClick={onClose}>
                  {content}
                </Link>
              ) : (
                <div key={notification.id}>{content}</div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
