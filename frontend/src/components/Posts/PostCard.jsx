import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { likesAPI, commentsAPI, postsAPI } from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import LikeButton from '../LikeButton/LikeButton';
import CommentSection from '../CommentSection/CommentSection';
import { getSafeImageUrl } from '../../utils/imageUtils';
import './PostCard.css';

const PostCard = ({ post }) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [now, setNow] = useState(new Date());
  const defaultAvatar = '/default-avatar.jpg';
  const [failedSrcs, setFailedSrcs] = useState({});

  const authorSources =
    currentUser && currentUser.id === post.authorId
      ? [
          currentUser.profileImage,
          currentUser.image,
          currentUser.picture,
          post.authorImage,
          post.authorImageFallback,
        ]
      : [post.authorImage, post.authorImageFallback];

  const authorAvatar = getSafeImageUrl(authorSources, failedSrcs, defaultAvatar);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const { data: likes = [] } = useQuery({
    queryKey: ['likes', post.id],
    queryFn: async () => {
      const res = await likesAPI.getByPost(post.id);
      return res.data?.data || [];
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: async () => {
      const res = await commentsAPI.getByPost(post.id);
      return res.data?.data || [];
    },
  });

  const isLiked = currentUser && likes.some(like => like.userId === currentUser.id);

  const deleteMutation = useMutation({
    mutationFn: () => postsAPI.delete(post.id, { userId: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['member-posts', post.authorId] });
    },
  });

  const handleDelete = () => {
    if (!currentUser || currentUser.id !== post.authorId) return;
    const ok = window.confirm('Delete this post? This cannot be undone.');
    if (!ok) return;
    deleteMutation.mutate();
  };

  const handleAvatarError = (e) => {
    e.target.onerror = null;
    setFailedSrcs((prev) => ({ ...prev, [e.target.src]: true }));
    e.target.src = defaultAvatar;
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
    <div className="post-card">
      <div className="post-header">
        <div className="post-author">
          <Link to={`/profile/${post.authorId}`} className="post-author-link">
            <img
              src={authorAvatar}
              alt={post.authorName}
              className="post-avatar"
              onError={handleAvatarError}
            />
            <div className="post-author-info">
              <strong className="post-author-name">{post.authorName}</strong>
              <span className="post-time">{formatDate(post.createdAt)}</span>
            </div>
          </Link>
        </div>
        {currentUser && currentUser.id === post.authorId && (
          <div className="post-owner-actions">
            <button
              className="post-delete-btn"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {post.content && (
        <div className="post-content">
          <p>{post.content}</p>
        </div>
      )}

      {post.imageUrl && (
        <div className="post-image">
          <img src={post.imageUrl} alt="Post" />
        </div>
      )}

      <div className="post-actions">
        <LikeButton postId={post.id} isLiked={isLiked} likeCount={likes.length} />
        <button
          className="post-action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {comments.length > 0 && <span>{comments.length}</span>}
        </button>
      </div>

      {showComments && (
        <CommentSection postId={post.id} />
      )}
    </div>
  );
};

export default PostCard;
