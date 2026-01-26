import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { membersAPI } from '../../services/api';
import FollowButton from '../FollowButton/FollowButton';
import PostCard from '../Posts/PostCard';
import './Profile.css';

const Profile = ({ memberId }) => {
  const { currentUser } = useAuth();

  const { data: memberData, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => membersAPI.getById(memberId),
  });

  const { data: postsData } = useQuery({
    queryKey: ['member-posts', memberId],
    queryFn: () => membersAPI.getPosts(memberId),
  });

  const { data: followersData } = useQuery({
    queryKey: ['member-followers', memberId],
    queryFn: () => membersAPI.getFollowers(memberId),
  });

  const { data: followingData } = useQuery({
    queryKey: ['member-following', memberId],
    queryFn: () => membersAPI.getFollowing(memberId),
  });

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const member = memberData?.data?.data;
  if (!member) {
    return (
      <div className="profile-container">
        <div className="error-message">Member not found</div>
      </div>
    );
  }

  const posts = postsData?.data?.data || [];
  const followers = followersData?.data?.data || [];
  const following = followingData?.data?.data || [];

  const isOwnProfile = currentUser && currentUser.id === memberId;

  return (
    <div className="profile-container">
      <div className="profile-header card">
        <div className="profile-avatar-section">
          <img
            src={member.profileImage || member.image || '/default-avatar.png'}
            alt={member.name}
            className="profile-avatar"
          />
        </div>

        <div className="profile-info">
          <div className="profile-name-section">
            <h1 className="profile-name">{member.name}</h1>
            {!isOwnProfile && currentUser && (
              <FollowButton
                followerId={currentUser.id}
                followingId={memberId}
              />
            )}
          </div>

          <div className="profile-stats">
            <div className="stat">
              <strong>{posts.length}</strong>
              <span>posts</span>
            </div>
            <div className="stat">
              <strong>{followers.length}</strong>
              <span>followers</span>
            </div>
            <div className="stat">
              <strong>{following.length}</strong>
              <span>following</span>
            </div>
          </div>

          {member.bio && (
            <div className="profile-bio">
              <p>{member.bio}</p>
            </div>
          )}

          {member.interests && member.interests.length > 0 && (
            <div className="profile-interests">
              {member.interests.map((interest, idx) => (
                <span key={idx} className="interest-tag">
                  {interest}
                </span>
              ))}
            </div>
          )}

          {(member.role || member.year) && (
            <div className="profile-meta">
              {member.role && <span>{member.role}</span>}
              {member.year && <span>{member.year}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="profile-posts">
        <h2 className="profile-posts-title">Posts</h2>
        {posts.length === 0 ? (
          <div className="empty-posts">
            <p>No posts yet</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
