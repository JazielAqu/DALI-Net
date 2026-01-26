import { useAuth } from '../context/AuthContext';
import Feed from '../components/Feed/Feed';
import './FeedPage.css';

const FollowingFeedPage = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="feed-page">
        <div className="card">
          <p>Please select a user from the home page to view your following feed.</p>
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
