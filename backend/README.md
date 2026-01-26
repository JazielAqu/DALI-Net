# DALI Net Backend

Express.js REST API backend for the DALI Net social media application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (see `.env.example`):
```env
PORT=3001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FRONTEND_URL=http://localhost:5173
```

3. Seed data:
```bash
npm run seed
```

4. Start server:
```bash
npm run dev  # Development mode with nodemon
# or
npm start    # Production mode
```

## API Endpoints

### Members
- `GET /api/members` - Get all members (query params: `search`, `role`, `year`, `limit`, `offset`)
- `GET /api/members/:id` - Get member by ID
- `GET /api/members/:id/posts` - Get all posts by a member
- `GET /api/members/:id/followers` - Get followers list
- `GET /api/members/:id/following` - Get following list
- `POST /api/members` - Create new member (for testing)

### Posts
- `GET /api/posts` - Get all posts (query params: `limit`, `offset`)
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/feed/:userId` - Get personalized feed (query params: `limit`)
- `POST /api/posts` - Create new post (body: `{authorId, content, imageUrl?}`)
- `PATCH /api/posts/:id` - Update post (body: `{userId, content?, imageUrl?}`)
- `DELETE /api/posts/:id` - Delete post (body: `{userId}`)

### Following
- `POST /api/following` - Follow a user (body: `{followerId, followingId}`)
- `DELETE /api/following/:followerId/:followingId` - Unfollow a user
- `GET /api/following/:userId/followers` - Get user's followers
- `GET /api/following/:userId/following` - Get users that userId follows

### Likes
- `POST /api/likes` - Like a post (body: `{userId, postId}`)
- `DELETE /api/likes/:userId/:postId` - Unlike a post
- `GET /api/likes/post/:postId` - Get all likes for a post
- `GET /api/likes/user/:userId` - Get all posts liked by user

### Comments
- `GET /api/comments/post/:postId` - Get all comments for a post
- `POST /api/comments` - Create comment (body: `{userId, postId, content}`)
- `DELETE /api/comments/:id` - Delete comment (body: `{userId}`)

### Notifications
- `GET /api/notifications/:userId` - Get all notifications (query params: `limit`, `unreadOnly`)
- `POST /api/notifications` - Create notification (body: `{userId, type, content, postId?, relatedUserId?}`)
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/:userId/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

### Health Check
- `GET /health` - Server health check

## Project Structure

```
backend/
├── src/
│   ├── routes/          # API route handlers
│   │   ├── members.js
│   │   ├── posts.js
│   │   ├── following.js
│   │   ├── likes.js
│   │   ├── comments.js
│   │   └── notifications.js
│   ├── models/          # Data models
│   │   ├── Member.js
│   │   ├── Post.js
│   │   ├── Like.js
│   │   ├── Comment.js
│   │   └── Notification.js
│   ├── services/        # Business logic
│   │   ├── firebase.js
│   │   └── feedService.js
│   ├── middleware/      # Express middleware
│   │   └── errorHandler.js
│   ├── utils/           # Utility functions
│   │   └── dataSeeder.js
│   └── server.js        # Entry point
├── package.json
└── .env.example
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Firebase service account private key
- `FIREBASE_CLIENT_EMAIL`: Firebase service account email
- `FRONTEND_URL`: Frontend URL for CORS

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Start in production mode (or test mode for development)
   - Choose a location
4. Go to Project Settings → Service Accounts
5. Click "Generate New Private Key"
6. Copy the credentials to your `.env` file:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## Data Seeding

The seeder script (`src/utils/dataSeeder.js`) will:
1. Load data from `data/dali_social_media.json`
2. Create member documents in Firestore
3. Generate sample posts for members

To seed data:
```bash
npm run seed
```

Make sure the JSON file is in the `data/` directory at the project root.

## Error Handling

All errors are handled by the error middleware. Errors return a JSON response with:
```json
{
  "success": false,
  "error": {
    "message": "Error message"
  }
}
```

## CORS

CORS is configured to allow requests from the frontend URL specified in `FRONTEND_URL` environment variable.
