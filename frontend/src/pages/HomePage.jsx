import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { membersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const { currentUser, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: membersData, isLoading, error } = useQuery({
    queryKey: ['members', searchTerm],
    queryFn: () => membersAPI.getAll({ search: searchTerm, limit: 50 }),
  });

  const members = membersData?.data?.data || [];

  // Debug logging
  if (error) {
    console.error('Error fetching members:', error);
  }
  if (membersData) {
    console.log('Members data:', membersData);
  }

  const handleSelectUser = (member) => {
    setUser(member);
    navigate(`/profile/${member.id}`);
  };

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>Welcome to DALI Net</h1>
        <p>Connect with DALI lab members and share your projects!</p>
      </div>

      {!currentUser && (
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
                    src={member.profileImage || member.picture || member.image || '/default-avatar.png'}
                    alt={member.name}
                    className="member-card-avatar"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <h3 className="member-card-name">{member.name}</h3>
                  {member.role && (
                    <p className="member-card-role">{member.role}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
