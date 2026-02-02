import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './FollowButton.css';

const FollowButton = ({ followerId, followingId }) => {
  const { currentUser } = useAuth();
  const isGuest = currentUser?.role === 'guest';
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);

  // Check if already following
  const { data: followingData } = useQuery({
    queryKey: ['following', followerId],
    queryFn: () => followingAPI.getFollowing(followerId),
    enabled: !!followerId,
  });

  // Determine if following
  const checkFollowing = () => {
    const following = followingData?.data?.data || [];
    return following.some(user => user.id === followingId);
  };

  const currentlyFollowing = checkFollowing();

  const followMutation = useMutation({
    mutationFn: () => followingAPI.follow({ followerId, followingId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', followerId] });
      queryClient.invalidateQueries({ queryKey: ['member-followers', followingId] });
      queryClient.invalidateQueries({ queryKey: ['member-following', followerId] });
      setIsFollowing(true);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => followingAPI.unfollow(followerId, followingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', followerId] });
      queryClient.invalidateQueries({ queryKey: ['member-followers', followingId] });
      queryClient.invalidateQueries({ queryKey: ['member-following', followerId] });
      setIsFollowing(false);
    },
  });

  const handleClick = () => {
    if (!currentUser || isGuest) {
      return;
    }
    if (currentlyFollowing || isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;
  const following = currentlyFollowing || isFollowing;

  return (
    <button
      className={`follow-btn ${following ? 'following' : ''}`}
      onClick={handleClick}
      disabled={isLoading || !currentUser || isGuest}
    >
      {isLoading ? '...' : following ? 'Following' : 'Follow'}
    </button>
  );
};

export default FollowButton;
