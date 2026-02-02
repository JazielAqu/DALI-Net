import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { postsAPI } from '../../services/api';
import './CreatePost.css';

const CreatePost = () => {
  const { currentUser } = useAuth();
  const isGuest = currentUser?.role === 'guest';
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageData, setImageData] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [fileError, setFileError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => postsAPI.create(data),
    onSuccess: () => {
      setContent('');
      setImageUrl('');
      setImageData('');
      setImageFileName('');
      setFileError('');
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || isGuest) return;

    const imagePayload = (imageData || imageUrl).trim();

    mutation.mutate({
      authorId: currentUser.id,
      content: content.trim(),
      imageUrl: imagePayload,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFileName('');
      setImageUrl('');
      setImageData('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setFileError('Please select an image file');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setFileError('Image must be under 3MB');
      return;
    }
    setFileError('');
    setImageFileName(file.name);
    setImageUrl(''); // Keep the URL field clean when a file is chosen
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result?.toString() || '');
    };
    reader.readAsDataURL(file);
  };

  if (isGuest) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="create-post-trigger">
        <button
          className="btn btn-primary"
          onClick={() => setIsOpen(true)}
        >
          + Create Post
        </button>
      </div>
    );
  }

  return (
    <div className="create-post card">
      <form onSubmit={handleSubmit}>
        <div className="create-post-header">
          <h3>Create Post</h3>
          <button
            type="button"
            className="close-btn"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>

        <textarea
          className="create-post-input"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
        />

        <label className="file-input-label">
          <span>Select image (optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
        </label>
        {imageFileName && (
          <div className="selected-file">Selected: {imageFileName}</div>
        )}
        <input
          type="url"
          className="input"
          placeholder="Image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />
        {fileError && <div className="error-message">{fileError}</div>}

        {imageData && (
          <div className="selected-file">Image selected and ready to upload.</div>
        )}

        <div className="create-post-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mutation.isPending || !content.trim()}
          >
            {mutation.isPending ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
