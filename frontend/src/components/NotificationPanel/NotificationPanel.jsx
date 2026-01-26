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

  const notifications = notificationsData?.data?.data || [];

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'just now';
    if (date.toDate) return date.toDate().toLocaleString();
    if (typeof date === 'number' || typeof date === 'string') {
      const dNum = new Date(date);
      return Number.isNaN(dNum.getTime()) ? 'just now' : dNum.toLocaleString();
    }
    if (date._seconds || date.seconds) {
      const seconds = date._seconds ?? date.seconds;
      const millis = seconds * 1000 + Math.floor((date._nanoseconds ?? date.nanoseconds ?? 0) / 1e6);
      return new Date(millis).toLocaleString();
    }
    const dFallback = new Date(date);
    return Number.isNaN(dFallback.getTime()) ? 'just now' : dFallback.toLocaleString();
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
