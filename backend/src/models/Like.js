// Like model structure for Firebase
export const LikeSchema = {
  userId: String,
  postId: String,
  createdAt: Date,
};

// Helper function to create a like document
export const createLike = (userId, postId) => {
  return {
    userId,
    postId,
    createdAt: new Date(),
  };
};
