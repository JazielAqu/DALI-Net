import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import Feed from '../components/Feed/Feed';
import { followingAPI } from '../services/api';
import './FeedPage.css';

const FollowingFeedPage = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="feed-page">
        <div className="card">
          <p>Please sign in to view your following feed.</p>
        </div>
      </div>
    );
  }

  if (currentUser.role === 'guest') {
    return (
      <div className="feed-page">
        <div className="card">
          <h1 className="page-title">Following</h1>
          <p>Guests can’t follow yet. Sign in with Google or email to follow members and see their posts here.</p>
        </div>
      </div>
    );
  }

  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: ['following', currentUser.id],
    queryFn: () => followingAPI.getFollowing(currentUser.id),
    staleTime: 60 * 1000,
  });

  const following = followingData?.data?.data || [];

  if (followingLoading) {
    return (
      <div className="feed-page">
        <div className="spinner"></div>
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className="feed-page">
        <div className="card">
          <h1 className="page-title">Following</h1>
          <p>You’re not following anyone yet. Follow members from the Home or Profile pages to see their posts here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <h1 className="page-title">Following</h1>
      <Feed userId={currentUser.id} mode="following" />
    </div>
  );
};

export default FollowingFeedPage;
