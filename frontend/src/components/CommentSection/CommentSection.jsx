import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { commentsAPI } from '../../services/api';
import { getSafeImageUrl } from '../../utils/imageUtils';
import './CommentSection.css';

const CommentSection = ({ postId }) => {
  const { currentUser } = useAuth();
  const isGuest = currentUser?.role === 'guest';
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [now, setNow] = useState(new Date());
  const [fallbackAvatars, setFallbackAvatars] = useState({});

  const handleAvatarError = (commentId) => (e) => {
    e.target.onerror = null;
    setFallbackAvatars((prev) => ({ ...prev, [e.target.src]: true }));
    e.target.src = '/default-avatar.jpg';
  };

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const { data: comments = [], isLoading, isError } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await commentsAPI.getByPost(postId);
      return res.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => commentsAPI.create(data),
    onSuccess: (res) => {
      const newComment = res.data?.data;
      setCommentText('');
      if (newComment) {
        queryClient.setQueryData(['comments', postId], (old = []) => [...old, newComment]);
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => commentsAPI.delete(id, { userId: currentUser?.id }),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['comments', postId], (old = []) => old.filter(comment => comment.id !== id));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser || isGuest) return;

    createMutation.mutate({
      userId: currentUser.id,
      postId,
      content: commentText.trim(),
    });
  };

  const normalizeDate = (value) => {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    if (typeof value === 'number' || typeof value === 'string') return new Date(value);
    if (value._seconds || value.seconds) {
      const seconds = value._seconds ?? value.seconds;
      const millis = seconds * 1000 + Math.floor((value._nanoseconds ?? value.nanoseconds ?? 0) / 1e6);
      return new Date(millis);
    }
    return new Date(value);
  };

  const formatDate = (date) => {
    const d = normalizeDate(date);
    if (!d || Number.isNaN(d.getTime())) return 'just now';
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="comment-section">
      {currentUser && !isGuest && (
        <form className="comment-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="comment-input"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={createMutation.isPending}
          />
          <button
            type="submit"
            className="comment-submit-btn"
            disabled={!commentText.trim() || createMutation.isPending}
          >
            Post
          </button>
        </form>
      )}

      <div className="comments-list">
        {isError ? (
          <div className="loading-comments">Failed to load comments</div>
        ) : isLoading ? (
          <div className="loading-comments">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="no-comments">No comments yet</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <img
                src={
                  fallbackAvatars[comment.userImage]
                    ? '/default-avatar.jpg'
                    : getSafeImageUrl([comment.userImage], fallbackAvatars, '/default-avatar.jpg')
                }
                alt={comment.userName}
                className="comment-avatar"
                onError={handleAvatarError(comment.id)}
              />
              <div className="comment-content">
                <div className="comment-header">
                  <strong className="comment-author">{comment.userName}</strong>
                  <span className="comment-time">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
              {currentUser && currentUser.id === comment.userId && (
                <button
                  className="comment-delete-btn"
                  onClick={() => deleteMutation.mutate(comment.id)}
                  disabled={deleteMutation.isPending}
                >
                  ×
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
