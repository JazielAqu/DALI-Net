import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { membersAPI, authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import FollowButton from '../components/FollowButton/FollowButton';
import './HomePage.css';
import { getSafeImageUrl } from '../utils/imageUtils';

const HomePage = () => {
  const { currentUser, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  // Track failed URLs (not ids) so changing an image re-attempts load.
  const [failedAvatars, setFailedAvatars] = useState({});

  const { data: membersData, isLoading, error } = useQuery({
    queryKey: ['members'],
    queryFn: () => membersAPI.getAll({ limit: 250 }),
    staleTime: 5 * 60 * 1000,
  });

  const allMembers = membersData?.data?.data || [];
  const searchLower = searchTerm.trim().toLowerCase();
  const members = searchLower
    ? allMembers.filter((m) =>
        m.name?.toLowerCase().includes(searchLower) ||
        m.bio?.toLowerCase().includes(searchLower)
      )
    : allMembers;

  const getAvatarSrc = (member) =>
    getSafeImageUrl(
      [member.profileImage, member.picture, member.image],
      failedAvatars,
      '/default-avatar.jpg'
    );

  const handleSelectUser = (member) => {
    // Legacy demo personas: allow quick persona selection only for unlocked (seeded) members
    const isLocked = member.locked === true;
    const safeImage = getSafeImageUrl(
      [member.profileImage, member.picture, member.image],
      {},
      '/default-avatar.jpg'
    );

    const activateDemoUser = async () => {
      try {
        const res = await authAPI.demoLogin(member.id);
        const token = res?.data?.data?.token;
        const user = res?.data?.data?.user || member;
        if (token) {
          localStorage.setItem('authToken', token);
        }
        setUser({
          ...user,
          profileImage: safeImage,
          image: safeImage,
          picture: safeImage,
        });
      } catch (err) {
        console.warn('Demo login failed, falling back to local persona only', err);
        setUser({
          ...member,
          profileImage: safeImage,
          image: safeImage,
          picture: safeImage,
        });
      } finally {
        navigate(`/profile/${member.id}`);
      }
    };

    if (!currentUser && !isLocked) {
      activateDemoUser();
    } else {
      navigate(`/profile/${member.id}`);
    }
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

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>Welcome to DALI Net</h1>
        <p>Connect with DALI lab members and share your projects!</p>
      </div>

      <div className="user-selection card">
        <h2>Select a User to Get Started</h2>
        <p className="user-selection-hint">
          Choose a member to view their profile and interact with the platform
        </p>

        <div className="search-box">
          <input
            type="text"
            className="input"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="spinner"></div>
        ) : error ? (
          <div className="error-message">
            <p>Error loading members: {error.message}</p>
            <p>Make sure the backend server is running on http://localhost:3001</p>
          </div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <p>No members found.</p>
            <p>Make sure you've run the seeder: <code>cd backend && npm run seed</code></p>
          </div>
        ) : (
          <div className="members-grid">
            {members.map((member) => (
              <div
                key={member.id}
                className="member-card"
                onClick={() => handleSelectUser(member)}
              >
                <img
                  src={getAvatarSrc(member)}
                  alt={member.name}
                  className="member-card-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    const failedSrc = e.target.src;
                    setFailedAvatars((prev) => ({ ...prev, [failedSrc]: true }));
                    e.target.src = '/default-avatar.jpg';
                  }}
                />
                <div className="member-card-header">
                  <h3 className="member-card-name">{member.name}</h3>
                  {member.role && (
                    <p className="member-card-role">{member.role}</p>
                  )}
                </div>
                {getBadges(member).length > 0 && (
                  <div className="member-badges">
                    {getBadges(member).map((badge) => (
                      <span key={badge} className="badge">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
                {currentUser && currentUser.id !== member.id && (
                  <div
                    className="member-card-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FollowButton
                      followerId={currentUser.id}
                      followingId={member.id}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {currentUser && (
        <div className="welcome-back card">
          <h2>Welcome back, {currentUser.name}!</h2>
          <div className="welcome-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/feed')}
            >
              Go to Feed
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/profile/${currentUser.id}`)}
            >
              View Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
