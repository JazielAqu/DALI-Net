import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => notificationsAPI.getByUser(currentUser?.id, { limit: 100 }),
    enabled: !!currentUser?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(currentUser?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
    },
  });

  const notifications = notificationsData?.data?.data || [];
  const unreadCount = notificationsData?.data?.unreadCount || 0;

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
      return '/feed';
    }
    if (notification.relatedUserId) {
      return `/profile/${notification.relatedUserId}`;
    }
    return null;
  };

  if (!currentUser) {
    return (
      <div className="notifications-page">
        <div className="card">
          <p>Please select a user from the home page to view notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1 className="page-title">Notifications</h1>
        {unreadCount > 0 && (
          <button
            className="btn btn-secondary"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="spinner"></div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <div className="no-notifications">
            <p>No notifications yet</p>
          </div>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => {
            const link = getNotificationLink(notification);
            const content = (
              <div
                className={`notification-card ${!notification.read ? 'unread' : ''}`}
                onClick={() => {
                  if (!notification.read) {
                    markAsReadMutation.mutate(notification.id);
                  }
                }}
              >
                <div className="notification-content">
                  <p className="notification-text">{notification.content}</p>
                  <span className="notification-time">{formatDate(notification.createdAt)}</span>
                </div>
                {!notification.read && <div className="unread-indicator"></div>}
              </div>
            );

            return link ? (
              <Link key={notification.id} to={link}>
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
