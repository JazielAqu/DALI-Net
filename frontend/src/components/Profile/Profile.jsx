import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { membersAPI } from '../../services/api';
import FollowButton from '../FollowButton/FollowButton';
import PostCard from '../Posts/PostCard';
import { getSafeImageUrl } from '../../utils/imageUtils';
import './Profile.css';

const Profile = ({ memberId }) => {
  const { currentUser, setUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageData, setNewImageData] = useState('');
  const [newImageFileName, setNewImageFileName] = useState('');
  const [imageError, setImageError] = useState('');
  const [showImageForm, setShowImageForm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  // Respect Vite base path in dev/prod
  const defaultAvatar = `${import.meta.env.BASE_URL || '/'}default-avatar.jpg`;
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

  const updateImageMutation = useMutation({
    mutationFn: (data) => membersAPI.update(memberId, data),
    onSuccess: (res) => {
      const updated = res?.data?.data;
      // Update cache eagerly for instant UI feedback
      if (updated) {
        queryClient.setQueryData(['member', memberId], (old) => {
          if (!old?.data?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              data: { ...old.data.data, ...updated },
            },
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      if (updated && currentUser && currentUser.id === memberId) {
        const safeImg = updated.profileImage || updated.image || updated.picture;
        setUser({ ...currentUser, profileImage: safeImg, image: safeImg, picture: safeImg });
      }
      setNewImageUrl('');
      setNewImageData('');
      setNewImageFileName('');
      setImageError('');
      setShowImageForm(false);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Could not update profile photo. Please try again.';
      setImageError(msg);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => membersAPI.deleteSelf(),
    onSuccess: () => {
      logout();
      navigate('/login');
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Could not delete account. Please try again.';
      setDeleteError(msg);
    },
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
  const deletable = member.locked === true;

  const handleAvatarError = (e) => {
    e.target.onerror = null;
    setFailedSrcs((prev) => ({ ...prev, [e.target.src]: true }));
    e.target.src = defaultAvatar;
  };

  const getBadges = (member) => {
    const badges = [];
    if (member.dev) badges.push('Dev');
    if (member.des) badges.push('Design');
    if (member.pm) badges.push('PM');
    if (member.core) badges.push('Core');
    if (member.mentor) badges.push('Mentor');
    return badges;
  };

  const handleImageSubmit = (e) => {
    e.preventDefault();
    const payload = (newImageData || newImageUrl).trim();
    if (!payload) {
      setImageError('Please select a file or enter an image URL');
      return;
    }
    updateImageMutation.mutate({
      profileImage: payload,
      image: payload,
      picture: payload,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setNewImageData('');
      setNewImageFileName('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setImageError('Image must be under 3MB');
      return;
    }
    setImageError('');
    setNewImageFileName(file.name);
    setNewImageUrl('');
    const reader = new FileReader();
    reader.onload = () => {
      setNewImageData(reader.result?.toString() || '');
    };
    reader.readAsDataURL(file);
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
            {isOwnProfile && (
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/profile/edit')}
                style={{ marginLeft: 'auto' }}
              >
                Edit profile
              </button>
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

          {getBadges(member).length > 0 && (
            <div className="profile-badges">
              {getBadges(member).map((badge) => (
                <span key={badge} className="badge">
                  {badge}
                </span>
              ))}
            </div>
          )}

          {isOwnProfile && (
            <div className="profile-image-card card">
              <div className="profile-image-card-header">
                <div>
                  <h3>Profile photo</h3>
                  <p className="muted">Upload a new image or paste a URL.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowImageForm((prev) => !prev)}
                >
                  {showImageForm ? 'Close' : 'Change photo'}
                </button>
              </div>
              {showImageForm && (
                <form className="profile-image-form" onSubmit={handleImageSubmit}>
                  <label className="file-input-label">
                    <span>Select image (optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="file-input"
                    />
                  </label>
                  {newImageFileName && (
                    <div className="selected-file">Selected: {newImageFileName}</div>
                  )}
                  <input
                    type="url"
                    className="input"
                    placeholder="Image URL (optional)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    style={{ margin: '0.75rem 0' }}
                  />
                  {imageError && <div className="error-message">{imageError}</div>}
                  {updateImageMutation.isSuccess && !imageError && (
                    <div className="success-message">Photo updated</div>
                  )}
                  <div className="profile-image-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={updateImageMutation.isPending}
                    >
                      {updateImageMutation.isPending ? 'Saving...' : 'Save photo'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setNewImageData('');
                        setNewImageUrl('');
                        setNewImageFileName('');
                        setImageError('');
                        setShowImageForm(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
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

          {isOwnProfile && deletable && (
            <div className="card danger-card" style={{ marginTop: '1rem' }}>
              <h3 style={{ color: '#b00020' }}>Delete my account (danger)</h3>
              <p className="muted" style={{ marginBottom: '1rem' }}>
                This permanently removes your profile, posts, likes, and follows. You’ll need to create a new account to use the app again.
              </p>
              {deleteError && <div className="error-message">{deleteError}</div>}
              <button
                className="btn btn-danger"
                style={{
                  backgroundColor: '#b00020',
                  borderColor: '#b00020',
                  color: '#fff',
                  fontWeight: 600,
                  transition: 'transform 0.1s ease',
                }}
                disabled={deleteAccountMutation.isPending}
                onClick={() => {
                  const confirmDelete = window.confirm('Delete your account? This cannot be undone.');
                  if (confirmDelete) deleteAccountMutation.mutate();
                }}
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete my account'}
              </button>
            </div>
          )}

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
