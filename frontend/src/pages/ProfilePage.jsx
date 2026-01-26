import { useParams } from 'react-router-dom';
import Profile from '../components/Profile/Profile';
import './ProfilePage.css';

const ProfilePage = () => {
  const { memberId } = useParams();

  return (
    <div className="profile-page">
      <Profile memberId={memberId} />
    </div>
  );
};

export default ProfilePage;
