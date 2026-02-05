import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { membersAPI } from '../services/api';
import { uploadProfileImage } from '../services/firebaseClient';
import './ProfileFormPage.css';

const blankProfile = {
  name: '',
  year: '',
  major: '',
  minor: '',
  birthday: '',
  home: '',
  quote: '',
  favoriteThing1: '',
  favoriteThing2: '',
  favoriteThing3: '',
  favoriteDartmouthTradition: '',
  funFact: '',
  profileImage: '',
  dev: false,
  des: false,
  pm: false,
  core: false,
  mentor: false,
};

const ProfileFormPage = () => {
  const { currentUser, needsProfile, setNeedsProfile, setUser } = useAuth();
  const navigate = useNavigate();

  // Redirect guests or signed-out users
  useEffect(() => {
    if (!currentUser) navigate('/login');
    if (currentUser?.role === 'guest') navigate('/');
  }, [currentUser, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['member', currentUser?.id],
    queryFn: () => membersAPI.getById(currentUser.id),
    enabled: !!currentUser?.id,
    retry: false,
  });

  const initialValues = useMemo(() => {
    const existing = data?.data?.data || {};
    return { ...blankProfile, ...existing };
  }, [data]);

  const [form, setForm] = useState(initialValues);
  const [error, setError] = useState('');
  const [photoName, setPhotoName] = useState('');

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const updateMutation = useMutation({
    mutationFn: (payload) => membersAPI.update(currentUser.id, payload),
    onSuccess: () => {
      // keep nav name/avatar in sync with profile
      setUser((prev) => ({
        ...(prev || {}),
        name: form.name || prev?.name,
        profileImage: form.profileImage || prev?.profileImage,
        image: form.profileImage || prev?.image,
        picture: form.profileImage || prev?.picture,
      }));
      setNeedsProfile(false);
      localStorage.setItem('needsProfile', 'false');
      navigate(`/profile/${currentUser.id}`);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Could not save your profile. Please try again.';
      setError(msg);
    },
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleBool = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.checked }));
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoName('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    try {
      setError('');
      setPhotoName('Uploading...');
      const url = await uploadProfileImage(file, currentUser.id);
      setForm((prev) => ({ ...prev, profileImage: url }));
      setPhotoName(file.name);
    } catch (err) {
      setError(err?.message || 'Could not upload image');
      setPhotoName('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    updateMutation.mutate({ ...form, completedProfile: true });
  };

  const mode = needsProfile ? 'Create your DALI profile' : 'Update your profile';

  if (!currentUser || currentUser.role === 'guest') {
    return null;
  }

  return (
    <div className="profile-form-page">
      <div className="card profile-form-card">
        <h1>{mode}</h1>
        <p className="muted">Tell us about yourself. You can edit this later.</p>

        {isLoading ? (
          <div className="spinner" />
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="grid two-col">
              <label>
                Name
                <input value={form.name} onChange={handleChange('name')} required />
              </label>
              <label>
                Year
                <input value={form.year} onChange={handleChange('year')} placeholder="2025" />
              </label>
              <label>
                Major
                <input value={form.major} onChange={handleChange('major')} />
              </label>
              <label>
                Minor
                <input value={form.minor} onChange={handleChange('minor')} />
              </label>
              <label>
                Birthday (MM-DD)
                <input value={form.birthday} onChange={handleChange('birthday')} placeholder="05-30" />
              </label>
              <label>
                Home
                <input value={form.home} onChange={handleChange('home')} placeholder="City, State" />
              </label>
            </div>

            <label>
              Favorite quote
              <input value={form.quote} onChange={handleChange('quote')} />
            </label>

            <div className="grid two-col">
              <label>
                Favorite thing 1
                <input value={form.favoriteThing1} onChange={handleChange('favoriteThing1')} />
              </label>
              <label>
                Favorite thing 2
                <input value={form.favoriteThing2} onChange={handleChange('favoriteThing2')} />
              </label>
              <label>
                Favorite thing 3
                <input value={form.favoriteThing3} onChange={handleChange('favoriteThing3')} />
              </label>
              <label>
                Favorite Dartmouth tradition
                <input
                  value={form.favoriteDartmouthTradition}
                  onChange={handleChange('favoriteDartmouthTradition')}
                />
              </label>
            </div>

            <label>
              Fun fact
              <input value={form.funFact} onChange={handleChange('funFact')} />
            </label>

            <div className="grid two-col roles-grid">
              <label className="checkbox-field">
                <input type="checkbox" checked={form.dev} onChange={handleBool('dev')} /> Dev
              </label>
              <label className="checkbox-field">
                <input type="checkbox" checked={form.des} onChange={handleBool('des')} /> Design
              </label>
              <label className="checkbox-field">
                <input type="checkbox" checked={form.pm} onChange={handleBool('pm')} /> PM
              </label>
              <label className="checkbox-field">
                <input type="checkbox" checked={form.core} onChange={handleBool('core')} /> Core
              </label>
              <label className="checkbox-field">
                <input type="checkbox" checked={form.mentor} onChange={handleBool('mentor')} /> Mentor
              </label>
            </div>

            <label>
              Bio / about you
              <textarea value={form.bio} onChange={handleChange('bio')} rows={3} />
            </label>

            <label>
              Profile photo (upload)
              <div className="file-input-row">
                <input
                  id="profile-form-file"
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto}
                  className="file-input-hidden"
                />
                <label htmlFor="profile-form-file" className="btn btn-secondary file-trigger">
                  Choose file
                </label>
                {photoName && <span className="muted">{photoName}</span>}
              </div>
            </label>

            {error && <div className="error-message">{error}</div>}

            <div className="actions">
              <button className="btn btn-primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : needsProfile ? 'Create profile' : 'Update profile'}
              </button>
              {!needsProfile && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate(`/profile/${currentUser.id}`)}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileFormPage;
