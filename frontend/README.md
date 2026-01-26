# DALI Net Frontend

React.js frontend for the DALI Net social media application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```env
VITE_API_URL=http://localhost:3001/api
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── Navigation/
│   │   ├── Profile/
│   │   ├── Posts/
│   │   ├── Feed/
│   │   ├── FollowButton/
│   │   ├── LikeButton/
│   │   ├── CommentSection/
│   │   └── NotificationPanel/
│   ├── pages/           # Page components
│   ├── services/        # API service layer
│   ├── context/         # React Context
│   ├── styles/          # CSS files
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: http://localhost:3001/api)

## Technologies

- React 18
- React Router DOM
- TanStack Query (React Query)
- Axios
- Vite
