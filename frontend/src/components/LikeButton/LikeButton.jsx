import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { likesAPI } from '../../services/api';
import { auth } from '../../services/firebaseClient';
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

  const handleClick = async () => {
    if (!currentUser || isGuest) {
      alert('Sign in (not as guest) to like posts');
      return;
    }

    // Refresh token if using Firebase auth; demo/token-only users can skip
    const refreshTokenIfFirebase = async () => {
      const fbUser = auth.currentUser;
      if (!fbUser) return;
      const token = await fbUser.getIdToken(true);
      if (token) localStorage.setItem('authToken', token);
    };

    const tryMutate = async () => {
      if (initialIsLiked) {
        await unlikeMutation.mutateAsync();
      } else {
        await likeMutation.mutateAsync();
      }
    };

    try {
      await refreshTokenIfFirebase();
      await tryMutate();
    } catch (err) {
      // If we got a 401, try refreshing (Firebase) once more; otherwise surface quietly
      if (err?.response?.status === 401) {
        try {
          await refreshTokenIfFirebase();
          await tryMutate();
        } catch (err2) {
          console.error('Like failed after retry', err2);
          alert('Session issue: please sign out and sign back in, then try again.');
        }
      } else {
        console.error('Like failed', err);
        alert('Unable to like right now. Please try again.');
      }
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
