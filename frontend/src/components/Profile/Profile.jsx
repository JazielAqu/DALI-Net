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
  const { currentUser, setUser, logout, linkPassword } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageData, setNewImageData] = useState('');
  const [newImageFileName, setNewImageFileName] = useState('');
  const [imageError, setImageError] = useState('');
  const [showImageForm, setShowImageForm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [newPwMsg, setNewPwMsg] = useState('');
  const [newPwErr, setNewPwErr] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
  const canLinkPassword =
    isOwnProfile &&
    currentUser?.email &&
    !currentUser?.hasPassword &&
    currentUser?.role !== 'guest';
  const canChangePassword =
    isOwnProfile &&
    currentUser?.hasPassword &&
    currentUser?.role !== 'guest';

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

  const handleRemovePhoto = () => {
    const resetAvatar = defaultAvatar;
    updateImageMutation.mutate({
      profileImage: resetAvatar,
      image: resetAvatar,
      picture: resetAvatar,
    });
    setFailedSrcs({});
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
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/profile/edit')}
                >
                  Edit profile
                </button>
                <button
                  className="btn btn-secondary settings-toggle"
                  onClick={() => setShowSettings(true)}
                  aria-label="Open settings"
                >
                  <img
                    src={`${import.meta.env.BASE_URL || '/'}settings.svg`}
                    alt=""
                    className="settings-icon"
                  />
                </button>
              </div>
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
                    <div className="file-input-row">
                      <input
                        id="profile-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input-hidden"
                      />
                      <label htmlFor="profile-file" className="btn btn-secondary file-trigger">
                        Choose file
                      </label>
                      {newImageFileName && (
                        <span className="selected-file subtle">{newImageFileName}</span>
                      )}
                    </div>
                  </label>
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
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ backgroundColor: '#b00020', borderColor: '#b00020', color: '#fff' }}
                      onClick={handleRemovePhoto}
                      disabled={updateImageMutation.isPending}
                    >
                      Remove photo
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

      {isOwnProfile && showSettings && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Settings</h3>
              <button className="icon-btn" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="settings-modal-body">
              {canLinkPassword && (
                <button className="btn btn-primary" onClick={() => { setShowChangePw(true); setShowSettings(false); }}>
                  Add password
                </button>
              )}
              {canChangePassword && (
                <button className="btn btn-primary" onClick={() => { setShowChangePw(true); setShowSettings(false); }}>
                  Change password
                </button>
              )}
              {deletable && (
                <button className="btn btn-danger" onClick={() => { setShowDeleteModal(true); setShowSettings(false); }}>
                  Delete my account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change/Add Password Modal */}
      {showChangePw && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{canChangePassword ? 'Change password' : 'Add password'}</h3>
              <button className="icon-btn" onClick={() => setShowChangePw(false)}>✕</button>
            </div>
            <p className="muted" style={{ marginBottom: '0.5rem' }}>
              {canChangePassword
                ? 'Update the password for your account.'
                : 'Set a password so you can also sign in with email.'}
            </p>
            {canLinkPassword && (
              <label className="muted" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Email
                <input
                  className="input"
                  type="email"
                  value={currentUser.email}
                  disabled
                  style={{ marginTop: '0.25rem' }}
                />
              </label>
            )}
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              New password
              <input
                className="input"
                type="password"
                value={canChangePassword ? newPw : pw}
                onChange={(e) => (canChangePassword ? setNewPw(e.target.value) : setPw(e.target.value))}
                style={{ marginTop: '0.25rem' }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              Confirm password
              <input
                className="input"
                type="password"
                value={canChangePassword ? newPw2 : pw2}
                onChange={(e) => (canChangePassword ? setNewPw2(e.target.value) : setPw2(e.target.value))}
                style={{ marginTop: '0.25rem' }}
              />
            </label>
            {(pwErr || newPwErr) && (
              <div className="error-message">{pwErr || newPwErr}</div>
            )}
            {(pwMsg || newPwMsg) && (
              <div className="success-message">{pwMsg || newPwMsg}</div>
            )}
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowChangePw(false);
                  setShowSettings(true);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  canChangePassword ? (setNewPwErr(''), setNewPwMsg('')) : (setPwErr(''), setPwMsg(''));
                  const valPw = canChangePassword ? newPw : pw;
                  const valPw2 = canChangePassword ? newPw2 : pw2;
                  if (!valPw || valPw.length < 6) {
                    (canChangePassword ? setNewPwErr : setPwErr)('Password must be at least 6 characters');
                    return;
                  }
                  if (valPw !== valPw2) {
                    (canChangePassword ? setNewPwErr : setPwErr)('Passwords do not match');
                    return;
                  }
                  try {
                    if (canChangePassword) {
                      await changePassword(valPw);
                      setNewPwMsg('Password updated.');
                      setNewPw('');
                      setNewPw2('');
                      setTimeout(() => setNewPwMsg(''), 1500);
                    } else {
                      await linkPassword(currentUser.email, valPw);
                      setPwMsg('Password added. You can now sign in with email + password.');
                      setPw('');
                      setPw2('');
                      setTimeout(() => setPwMsg(''), 1500);
                      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
                    }
                    setShowChangePw(false);
                  } catch (err) {
                    const msg =
                      err?.message === 'Firebase: Error (auth/requires-recent-login).'
                        ? 'Please log out and sign in again, then retry.'
                        : err?.message || 'Could not update password. Try again.';
                    (canChangePassword ? setNewPwErr : setPwErr)(msg);
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletable && showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-card danger">
            <div className="modal-header">
              <h3 style={{ color: '#b00020' }}>Delete my account</h3>
              <button className="icon-btn" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <p className="muted" style={{ marginBottom: '1rem' }}>
              This permanently removes your profile, posts, likes, and follows. You’ll need to create a new account to use the app again.
            </p>
            {deleteError && <div className="error-message">{deleteError}</div>}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button
                className="btn btn-danger"
                style={{
                  backgroundColor: '#b00020',
                  borderColor: '#b00020',
                  color: '#fff',
                  fontWeight: 600,
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
          </div>
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
