import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { postsAPI } from '../../services/api';
import './CreatePost.css';

const CreatePost = () => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => postsAPI.create(data),
    onSuccess: () => {
      setContent('');
      setImageUrl('');
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    mutation.mutate({
      authorId: currentUser.id,
      content: content.trim(),
      imageUrl: imageUrl.trim(),
    });
  };

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

        <input
          type="url"
          className="input"
          placeholder="Image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />

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
