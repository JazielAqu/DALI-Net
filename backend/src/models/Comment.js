// Comment model structure for Firebase
export const CommentSchema = {
  userId: String,
  userName: String,
  userImage: String,
  postId: String,
  content: String,
  createdAt: Date,
};

// Helper function to create a comment document
export const createComment = (data) => {
  return {
    userId: data.userId,
    userName: data.userName || '',
    userImage: data.userImage || '',
    postId: data.postId,
    content: data.content || '',
    createdAt: new Date(),
  };
};
