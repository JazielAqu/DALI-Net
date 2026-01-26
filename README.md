# DALI Net - Social Media App

A full-stack social media application built for the DALI Lab, allowing members to connect, share posts, follow each other, and interact through likes, comments, and notifications.

![DALI Net](https://img.shields.io/badge/DALI-Net-6366f1?style=for-the-badge)

## 🚀 Features

- **User Profiles**: View member profiles with bio, interests, role, and year
- **Posts**: Create, view, edit, and delete posts with text and images
- **Following System**: Follow and unfollow other members
- **Likes**: Like and unlike posts
- **Comments**: Comment on posts and manage your comments
- **Notifications**: Real-time notifications for follows, likes, comments, and new posts
- **Personalized Feed**: View posts from members you follow
- **Search**: Search for members by name or bio

## 🏗️ Architecture

### Backend
- **Framework**: Express.js Node.js
- **Database**: Firebase Firestore
- **API**: RESTful API with comprehensive endpoints

### Frontend
- **Framework**: React.js with Vite
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router DOM
- **Styling**: CSS with CSS Variables for theming

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Firestore enabled
- Firebase service account credentials

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd DALI-Net
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=3001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FRONTEND_URL=http://localhost:5173
```

To get Firebase credentials:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the values to your `.env` file

### 3. Seed Data

Download the `dali_social_media.json` file from the provided URL and place it in the `data/` directory, then run:

```bash
npm run seed
```

### 4. Start Backend Server

```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### 5. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory (optional):

```env
VITE_API_URL=http://localhost:3001/api
```

### 6. Start Frontend Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📱 Usage

1. Open `http://localhost:5173` in your browser
2. On the home page, select a user from the member list
3. Navigate to different sections:
   - **Feed**: View personalized feed of posts
   - **Profile**: View member profiles
   - **Notifications**: View and manage notifications

## Deployment

### Backend Deployment (Render/Railway)

1. Push your code to GitHub
2. Connect your repository to Render or Railway
3. Set environment variables in the platform
4. Deploy

### Frontend Deployment (Netlify/Vercel)

1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to Netlify or Vercel
3. Set environment variables:
   - `VITE_API_URL`: Your backend API URL

## API Documentation

### Members
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get member by ID
- `GET /api/members/:id/posts` - Get member's posts
- `GET /api/members/:id/followers` - Get member's followers
- `GET /api/members/:id/following` - Get members that user follows

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/feed/:userId` - Get personalized feed
- `POST /api/posts` - Create post
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Following
- `POST /api/following` - Follow a user
- `DELETE /api/following/:followerId/:followingId` - Unfollow a user
- `GET /api/following/:userId/followers` - Get followers
- `GET /api/following/:userId/following` - Get following list

### Likes
- `POST /api/likes` - Like a post
- `DELETE /api/likes/:userId/:postId` - Unlike a post
- `GET /api/likes/post/:postId` - Get likes for a post
- `GET /api/likes/user/:userId` - Get posts liked by user

### Comments
- `GET /api/comments/post/:postId` - Get comments for a post
- `POST /api/comments` - Create comment
- `DELETE /api/comments/:id` - Delete comment

### Notifications
- `GET /api/notifications/:userId` - Get user notifications
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/:userId/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Screenshots

### Home Page
The home page displays all DALI lab members in a grid layout. Users can search for members and select one to start using the platform.

### Profile Page
Each member has a detailed profile showing their information, stats (posts, followers, following), and all their posts.

### Feed Page
The personalized feed shows posts from members you follow, with the ability to create new posts, like, and comment.

### Notifications
Real-time notifications for follows, likes, comments, and new posts from members you follow.

*Note: Add actual screenshots or demo GIFs when deploying the application*

## Learning Journey

### What Inspired This Project

The goal was to build something that would help lab members connect, share their work, and stay updated with each other's projects and activities. The challenge provided an great opportunity to touch up on my full-stack skills and thoroughly build a full-stack application from scratch, utilizing modern tools to create a cohesive social media experience.

### Potential Impact

DALI Net could have a significant impact on the DALI Lab community by:

1. Making it easier for lab members to discover and connect with each other
2. Providing a platform for members to showcase their work and get feedback
3. Fostering a sense of community through interactions and engagement
4. Enabling members to share insights, resources, and experiences
5. Helping new members integrate into the lab community more easily

### New Technologies Learned

1. **Firebase Firestore**: Learned to work with NoSQL database, understanding document-based data modeling and querying patterns
2. **TanStack Query (React Query)**: Mastered server state management, caching strategies, and optimistic updates
3. **Vite**: Experienced the speed and efficiency of modern build tools compared to Create React App
4. **Express.js with ES Modules**: Explored modern JavaScript module system in Node.js

### Why These Technologies Were Chosen

- **Firebase**: Chosen for familiarity using it in past DALI projects, quick setup, real-time capabilities, and scalability without managing infrastructure
- **React Query**: Selected for its powerful caching and synchronization features, reducing boilerplate code
- **Vite**: Chosen for its fast development experience and modern build output
- **Express.js**: Selected for its simplicity, flexibility, and extensive middleware ecosystem

## Technical Rationale

### Backend Structure

The backend is organized into clear layers:
- **Routes**: Handle HTTP requests and responses
- **Services**: Business logic and external service integrations
- **Models**: Data structure definitions and helper functions
- **Middleware**: Error handling and request processing

This separation of concerns makes the codebase maintainable and testable.

### Frontend Architecture

The frontend follows a component-based architecture:
- **Pages**: Top-level route components
- **Components**: Reusable UI components
- **Services**: API communication layer
- **Context**: Global state management (authentication)
- **Hooks**: Custom React hooks for data fetching

### Key Technical Tradeoffs

1. **Firebase vs. Traditional Database**: 
   - **Chose Firebase** for rapid development and real-time capabilities
   - **Tradeoff**: Less control over query optimization, but faster to implement

2. **React Query vs. Redux**:
   - **Chose React Query** for server state management
   - **Tradeoff**: Less suitable for complex client-side state, but perfect for API data

3. **CSS Variables vs. CSS-in-JS**:
   - **Chose CSS Variables** for simplicity and performance
   - **Tradeoff**: Less dynamic styling capabilities, but better performance

4. **REST vs. GraphQL**:
   - **Chose REST** for simplicity and ease of implementation
   - **Tradeoff**: More endpoints to manage, but easier to understand and debug

### Most Difficult Technical Bug

**Issue**: The feed service was not properly handling Firestore's `in` query limitation (max 10 items per query).

**Debugging Process**:
1. Initially, the feed would only show posts from the first 10 followed users
2. Investigated Firestore query limitations
3. Found that `in` queries are limited to 10 items
4. Implemented batching logic to query in chunks of 10

**Solution**: Created a batching mechanism that splits the followed users list into chunks of 10 and queries each batch separately, then merges and sorts the results.

```javascript
// Solution implemented in feedService.js
const batchSize = 10;
for (let i = 0; i < followingIds.length; i += batchSize) {
  const batch = followingIds.slice(i, i + batchSize);
  // Query each batch...
}
```

## 🤖 AI Usage

I used ChatGPT during development to assist with:

1. **Code Generation**: Generating boilerplate code for API routes and React components
2. **Debugging**: Getting suggestions for fixing errors and understanding error messages
3. **Code Review**: Getting feedback on code structure and potential improvements
4. **README Organization**: Writing down and documenting my entire process, then making it more concise and thorough


### Specific Example

**Prompt Used**: "How do I implement a personalized feed that shows posts from users I follow in Firebase Firestore?"

**AI Response**: The AI suggested using Firestore's `in` operator to query posts from multiple users at once.

**Adaptation Required**: 
- The AI's initial suggestion didn't account for Firestore's 10-item limit on `in` queries
- I had to implement batching logic to handle cases where a user follows more than 10 people
- Added client-side sorting to merge results from multiple batches
- Implemented a fallback to show all posts if the user doesn't follow anyone yet

**NOTE** I Always verify AI suggestions against documentation, especially regarding limitations and what my goal is in what I am trying to develop
