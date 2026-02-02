import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { likesAPI } from '../../services/api';
import './LikeButton.css';

const LikeButton = ({ postId, isLiked: initialIsLiked, likeCount: initialLikeCount }) => {
  const { currentUser } = useAuth();
  const isGuest = currentUser?.role === 'guest';
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => likesAPI.like({ postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: () => likesAPI.unlike(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const handleClick = () => {
    if (!currentUser || isGuest) {
      alert('Sign in (not as guest) to like posts');
      return;
    }

    if (initialIsLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const isLoading = likeMutation.isPending || unlikeMutation.isPending;

  return (
    <button
      className={`like-btn ${initialIsLiked ? 'liked' : ''}`}
      onClick={handleClick}
      disabled={isLoading || !currentUser || isGuest}
    >
      <span className="like-icon">{initialIsLiked ? '❤️' : '🤍'}</span>
      {initialLikeCount > 0 && <span className="like-count">{initialLikeCount}</span>}
    </button>
  );
};

export default LikeButton;
