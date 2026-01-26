import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { postsAPI } from '../../services/api';
import PostCard from '../Posts/PostCard';
import CreatePost from '../Posts/CreatePost';
import './Feed.css';

const Feed = ({ userId }) => {
  const { currentUser } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['feed', userId],
    queryFn: () => {
      if (userId) {
        return postsAPI.getFeed(userId);
      }
      return postsAPI.getAll();
    },
    enabled: !!userId || !userId, // Always enabled
  });

  if (isLoading) {
    return (
      <div className="feed-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-container">
        <div className="error-message">
          Error loading feed: {error.message}
        </div>
      </div>
    );
  }

  const posts = data?.data?.data || [];

  return (
    <div className="feed-container">
      {currentUser && currentUser.id === userId && (
        <CreatePost />
      )}
      
      {posts.length === 0 ? (
        <div className="empty-feed">
          <p>No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="feed-posts">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
