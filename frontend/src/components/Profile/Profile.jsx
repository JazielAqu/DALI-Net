import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { membersAPI } from '../../services/api';
import FollowButton from '../FollowButton/FollowButton';
import PostCard from '../Posts/PostCard';
import { getSafeImageUrl } from '../../utils/imageUtils';
import './Profile.css';

const Profile = ({ memberId }) => {
  const { currentUser } = useAuth();

  const defaultAvatar = '/default-avatar.jpg';
  // Track failed URLs so if the image changes we retry.
  const [failedSrcs, setFailedSrcs] = useState({});

  const { data: memberData, isLoading, isError: memberError, error: memberErrObj } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => membersAPI.getById(memberId),
    enabled: !!memberId,
    retry: false,
  });

  const { data: postsData, isError: postsError, error: postsErrObj } = useQuery({
    queryKey: ['member-posts', memberId],
    queryFn: () => membersAPI.getPosts(memberId),
    enabled: !!memberId,
    retry: false,
  });

  const { data: followersData, isError: followersError, error: followersErrObj } = useQuery({
    queryKey: ['member-followers', memberId],
    queryFn: () => membersAPI.getFollowers(memberId),
    enabled: !!memberId,
    retry: false,
  });

  const { data: followingData, isError: followingError, error: followingErrObj } = useQuery({
    queryKey: ['member-following', memberId],
    queryFn: () => membersAPI.getFollowing(memberId),
    enabled: !!memberId,
    retry: false,
  });

  const avatarSrc = memberData?.data?.data
    ? getSafeImageUrl(
        [
          memberData.data.data.profileImage,
          memberData.data.data.picture,
          memberData.data.data.image,
        ],
        failedSrcs,
        defaultAvatar
      )
    : defaultAvatar;

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (memberError) {
    return (
      <div className="profile-container">
        <div className="error-message">
          {memberErrObj?.message ? `Error loading member: ${memberErrObj.message}` : 'Error loading member'}
        </div>
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

  const handleAvatarError = (e) => {
    e.target.onerror = null;
    setFailedSrcs((prev) => ({ ...prev, [e.target.src]: true }));
    e.target.src = defaultAvatar;
  };

  return (
    <div className="profile-container">
      <div className="profile-header card">
        <div className="profile-avatar-section">
          <img
            src={avatarSrc}
            alt={member.name}
            className="profile-avatar"
            onError={handleAvatarError}
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
        {postsError ? (
          <div className="error-message">Error loading posts: {postsErrObj?.message || 'Unknown error'}</div>
        ) : posts.length === 0 ? (
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
