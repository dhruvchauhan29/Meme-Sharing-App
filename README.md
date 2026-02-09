# Meme Sharing App - Day 2 Enhanced Version

A full-stack Angular application for sharing memes with authentication, routing, and role-based authorization.

## Features

### Authentication & Authorization
- JWT-based authentication using `json-server-auth`
- User roles: `user` and `admin`
- Protected routes with guards
- Login/Register with form validation

### Posts
- Create, edit, and delete posts (text-only)
- Like and bookmark posts
- Flag/report posts
- Soft delete (admin feature)
- Spoiler support using `||spoiler||` syntax

### Feed
- Search posts by title and body
- Filter by team, mood, and tags
- Filter by saved/liked posts
- Sort by newest/oldest
- Query parameter support for shareable URLs

### User Features
- View own profile
- View liked posts
- View saved posts
- Edit own posts
- Delete own posts

### Admin Features
- View flagged posts
- Manage moderation
- Soft delete/restore any post
- Full access to all posts

## Tech Stack

- **Frontend**: Angular 19 with standalone components
- **Backend**: json-server 0.17 + json-server-auth
- **Routing**: Angular Router with lazy loading
- **Forms**: Reactive Forms with validation
- **State**: RxJS Observables
- **Styling**: Custom CSS with modern design

## Prerequisites

- Node.js 18+ 
- npm 9+

## Installation

1. Clone the repository:
```bash
git clone https://github.com/dhruvchauhan29/Meme-Sharing-App.git
cd Meme-Sharing-App
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### 1. Start the Backend Server

In one terminal:
```bash
npm run server
```

This starts the json-server on `http://localhost:3000`

### 2. Start the Angular Development Server

In another terminal:
```bash
npm start
```

This starts the Angular app on `http://localhost:4200`

### 3. Access the Application

Open your browser and navigate to: `http://localhost:4200`

## Test Credentials

### Regular Users:
- Email: `alice@hashedin.com` / Password: `password123`
- Email: `bob@hashedin.com` / Password: `password123`

### Admin User:
- Email: `admin@hashedin.com` / Password: `admin123`

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Route guards (auth, role, can-deactivate)
│   │   ├── interceptors/    # HTTP interceptors (auth, error)
│   │   ├── models/          # TypeScript interfaces
│   │   └── services/        # Business logic services
│   ├── features/
│   │   ├── auth/            # Login and register (lazy loaded)
│   │   ├── feed/            # Feed page (lazy loaded)
│   │   ├── post-detail/     # Post detail page
│   │   ├── post-composer/   # Create and edit posts
│   │   ├── profile/         # User profile pages (lazy loaded)
│   │   └── admin/           # Admin moderation (lazy loaded)
│   └── shared/
│       ├── navbar/          # Navigation bar component
│       └── ui-*/            # Reusable UI components
├── db.json                  # Backend database
└── server.js               # Custom json-server setup
```

## Routes

### Public Routes:
- `/` - Redirects to feed
- `/feed` - Browse all posts
- `/post/:id` - View post details
- `/auth/login` - Login page
- `/auth/register` - Register page

### Protected Routes (requires authentication):
- `/compose` - Create new post
- `/edit/:id` - Edit post (owner or admin only)
- `/me/profile` - User profile
- `/me/liked` - Liked posts
- `/me/saved` - Saved/bookmarked posts

### Admin Routes (requires admin role):
- `/admin/moderation` - Moderation dashboard

## Key Features Implementation

### Draft Support
- Drafts are saved automatically to localStorage
- Draft key format: `draft:<userId>:new` for new posts
- Draft key format: `draft:<userId>:post:<postId>` for edits
- CanDeactivate guard warns about unsaved changes

### Spoiler Support
- Use `||spoiler text||` syntax in post body
- Feed shows `[spoiler]` in previews
- Post detail page has show/hide buttons for spoilers

### Like & Bookmark
- Real-time updates
- Toggle on/off with single click
- Like count displayed
- Bookmark icon changes when saved

### Search & Filters
- Real-time search as you type
- Multiple filters work together
- Query params in URL for shareable links
- Example: `/feed?q=coding&team=Engineering&sort=newest`

## Development

### Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Linting
The project uses strict TypeScript configuration with:
- Strict mode enabled
- No implicit any
- Strict templates
- No property access from index signature

## API Endpoints

### Authentication:
- `POST /register` - Register new user
- `POST /login` - Login user

### Posts:
- `GET /posts` - Get all posts
- `GET /posts/:id` - Get single post
- `POST /posts` - Create post (auth required)
- `PATCH /posts/:id` - Update post (owner/admin only)
- `DELETE /posts/:id` - Delete post (owner/admin only)

### Likes:
- `GET /likes` - Get all likes
- `POST /likes` - Like a post (auth required)
- `DELETE /likes/:id` - Unlike a post (auth required)

### Bookmarks:
- `GET /bookmarks` - Get all bookmarks
- `POST /bookmarks` - Bookmark a post (auth required)
- `DELETE /bookmarks/:id` - Remove bookmark (auth required)

### Flags:
- `GET /flags` - Get all flags (admin only)
- `POST /flags` - Flag a post (auth required)
- `PATCH /flags/:id` - Update flag status (admin only)

## Security

- JWT tokens for authentication
- HTTP interceptor for token injection
- Route guards for authorization
- Owner-based access control
- Admin role for privileged operations
- XSS protection via Angular sanitization

## License

This project was created as part of an assignment for HashedIn by Deloitte.

## Assignment Details

This is the **Day 2 assignment** which upgrades the text-only meme sharing app with:
- Full-stack architecture (Angular + json-server)
- Authentication and authorization
- Multi-route navigation
- HTTP CRUD operations
- Guards and interceptors
- Lazy loading modules
- Draft protection
- Role-based features

Previous Day 1 features (localStorage-based) have been migrated to use HTTP APIs while maintaining draft functionality in localStorage as specified.
