import { useAuth } from '../context/AuthContext';
import Feed from '../components/Feed/Feed';
import './FeedPage.css';

const FeedPage = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="feed-page">
        <div className="card">
          <p>Please select a user from the home page to view your feed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <h1 className="page-title">Your Feed</h1>
      <Feed userId={currentUser.id} />
    </div>
  );
};

export default FeedPage;
