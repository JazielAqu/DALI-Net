import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { likesAPI, commentsAPI } from '../../services/api';
import LikeButton from '../LikeButton/LikeButton';
import CommentSection from '../CommentSection/CommentSection';
import './PostCard.css';

const PostCard = ({ post }) => {
  const { currentUser } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [now, setNow] = useState(new Date());

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
          <img
            src={post.authorImage || '/default-avatar.png'}
            alt={post.authorName}
            className="post-avatar"
          />
          <div className="post-author-info">
            <strong className="post-author-name">{post.authorName}</strong>
            <span className="post-time">{formatDate(post.createdAt)}</span>
          </div>
        </div>
        {currentUser && currentUser.id === post.authorId && (
          <button className="post-menu-btn">⋯</button>
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
