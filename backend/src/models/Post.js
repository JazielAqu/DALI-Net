// Post model structure for Firebase
export const PostSchema = {
  authorId: String,
  authorName: String,
  authorImage: String,
  content: String,
  imageUrl: String,
  createdAt: Date,
  updatedAt: Date,
};

// Helper function to create a post document
export const createPost = (data) => {
  return {
    authorId: data.authorId,
    authorName: data.authorName || '',
    authorImage: data.authorImage || '',
    content: data.content || '',
    imageUrl: data.imageUrl || '',
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };
};
