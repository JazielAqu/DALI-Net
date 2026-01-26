// Notification model structure for Firebase
export const NotificationSchema = {
  userId: String,
  type: String, // 'like', 'comment', 'follow', 'post'
  content: String,
  postId: String, // optional
  relatedUserId: String, // optional
  read: Boolean,
  createdAt: Date,
};

// Helper function to create a notification document
export const createNotification = (data) => {
  return {
    userId: data.userId,
    type: data.type,
    content: data.content || '',
    postId: data.postId || null,
    relatedUserId: data.relatedUserId || null,
    read: false,
    createdAt: new Date(),
  };
};
