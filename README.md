# FileDrive

A full-stack cloud file storage and management application built with the MERN stack (MongoDB, Express, React, Node.js) and Supabase Storage. FileDrive lets users upload, organise, share, and manage files and folders — all from a clean, responsive UI.

---

## Table of Contents

- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
    - [Environment Variables](#environment-variables)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [API Overview](#api-overview)
- [RBAC Permission System](#rbac-permission-system)
- [Storage System](#storage-system)
- [Authentication Flow](#authentication-flow)
- [File Upload Flow](#file-upload-flow)
- [Sharing System](#sharing-system)
- [Scripts](#scripts)
- [Screenshots](#screenshots)

---

## Features

### Core File Management

- **Upload files** — single or multiple files at once with real-time progress bars
- **Upload folders** — entire local folders are uploaded and recreated in the cloud
- **Create folders** — nested folder hierarchy with unlimited depth
- **Rename** — inline rename (click rename → type directly, no dialog popup)
- **Move** — drag files/folders to a different location with a modal picker
- **Duplicate** — copy any file or folder in one click
- **Delete** — move to trash (soft-delete, restorable)
- **Trash** — view, restore, or permanently delete trashed items
- **Download** — generate a signed download URL for any file
- **Preview** — in-app preview for images, videos, audio, PDFs, and text files

### Organisation

- **Star / Unstar** — mark important files and folders; browse them in the Starred view
- **Recent files** — dedicated Recent view sorted by last modified date
- **Search** — full-text search across file and folder names with optional MIME type filter
- **Breadcrumb navigation** — always know where you are in the folder tree

### Sharing

- **Share with user** — share any file or folder with another registered user, choosing permission level (view / comment / edit)
- **Public link sharing** — generate a shareable token-based link with optional expiry
- **Shared with me** — view all items others have shared with you; files open in preview, folders navigate inside
- **Shared by me** — manage and revoke all outgoing shares at a glance
- **Permission badges** — colour-coded (blue = view, yellow = comment, green = edit)

### Multi-select & Bulk Actions

- **Checkbox selection** — click the checkbox on any file or folder card/row
- **Shift-click range** — hold Shift and click to select a range
- **Drag-to-select** — hold the mouse button and drag across rows/cards
- **Bulk delete** — delete all selected items at once with a single button
- **Select-all** — header checkbox selects or deselects all files in the list

### Optimistic UI

All mutations (delete, star, rename, duplicate, create folder, upload) update the UI immediately without waiting for the server. If the server returns an error, the change is rolled back automatically.

### Keyboard Shortcuts

| Key                    | Action                                      |
| ---------------------- | ------------------------------------------- |
| `/` or `Ctrl+K`        | Focus the search bar                        |
| `Esc` (in search)      | Clear search and blur                       |
| `Ctrl+A`               | Select all files and folders                |
| `Delete` / `Backspace` | Delete all selected items                   |
| `Esc`                  | Deselect all → then close modals one by one |
| `N`                    | Open New Folder dialog                      |
| `U`                    | Open file upload picker                     |

### Notifications

- Real-time notification bell in the top bar with unread count badge
- Notifications auto-marked as read when you open the Notifications page
- Manual mark-as-read and delete per notification

### Profile & Settings

- Update display name and avatar image
- Change password (with current password verification)
- View storage breakdown by category (images, videos, documents, audio, archives)
- **Delete Entire Drive** — 2-step confirmation (warning → type "DELETE") wipes all files/folders

### Sidebar

- **Collapse / Expand** toggle on desktop — narrows to icon-only mode
- Mobile hamburger menu with overlay
- Live storage usage bar with colour coding (blue → yellow at 70% → red at 90%)

### Activity Log

- Every file/folder action (upload, rename, delete, share, etc.) is logged
- Browse your full activity history in the Activity page

---

## Tech Stack

### Backend

| Package                  | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| **Node.js + Express 5**  | HTTP server and routing                     |
| **MongoDB + Mongoose 9** | Database and ODM                            |
| **Supabase Storage**     | File storage (S3-compatible, signed URLs)   |
| **JWT (jsonwebtoken)**   | Stateless authentication tokens             |
| **bcrypt**               | Password hashing                            |
| **multer**               | Multipart file upload handling              |
| **nodemailer**           | OTP verification emails                     |
| **sharp**                | Server-side image resizing for avatars      |
| **express-validator**    | Request validation middleware               |
| **helmet + cors**        | Security headers and CORS                   |
| **express-rate-limit**   | API rate limiting                           |
| **node-cron**            | Scheduled jobs (e.g. purging expired trash) |
| **morgan**               | HTTP request logging                        |

### Frontend

| Package                     | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| **React 19 + Vite 7**       | UI framework and dev server                      |
| **React Router DOM 7**      | Client-side routing                              |
| **Tailwind CSS 4**          | Utility-first styling                            |
| **Axios**                   | HTTP client with upload progress                 |
| **react-hot-toast**         | Toast notifications                              |
| **react-icons (HeroIcons)** | Icon set                                         |
| **date-fns**                | Date formatting                                  |
| **React Portals**           | Dropdown menus rendered at `document.body` level |

---

## Project Structure

```
09fileDrive/
├── backend/
│   ├── scripts/
│   │   └── migrate-storage-limit.js   # One-off DB migration script
│   └── src/
│       ├── app.js                     # Express app setup
│       ├── server.js                  # HTTP server entry point
│       ├── config/
│       │   ├── constants.js           # App-level constants
│       │   ├── db.js                  # MongoDB connection
│       │   ├── email.js               # Nodemailer config
│       │   ├── index.js               # Central env config with validation
│       │   ├── permissions.js         # RBAC permission hierarchy
│       │   └── supabase.js            # Supabase client
│       ├── controllers/               # Route handler functions
│       │   ├── activity.controller.js
│       │   ├── auth.controller.js
│       │   ├── file.controller.js
│       │   ├── folder.controller.js
│       │   ├── notification.controller.js
│       │   ├── search.controller.js
│       │   ├── share.controller.js
│       │   ├── trash.controller.js
│       │   └── user.controller.js
│       ├── middlewares/
│       │   ├── auth.middleware.js     # JWT verification
│       │   ├── error.middleware.js    # Global error handler
│       │   ├── rbac.middleware.js     # Role-based access control
│       │   ├── upload.middleware.js   # Multer configuration
│       │   └── validate.middleware.js # express-validator runner
│       ├── models/                    # Mongoose schemas
│       │   ├── activity.model.js
│       │   ├── file.model.js
│       │   ├── folder.model.js
│       │   ├── notification.model.js
│       │   ├── share.model.js
│       │   ├── trash.model.js
│       │   ├── user.model.js
│       │   └── version.model.js
│       ├── routes/                    # Express routers
│       │   ├── activity.routes.js
│       │   ├── auth.routes.js
│       │   ├── file.routes.js
│       │   ├── folder.routes.js
│       │   ├── notification.routes.js
│       │   ├── search.routes.js
│       │   ├── share.routes.js
│       │   ├── trash.routes.js
│       │   └── user.routes.js
│       ├── services/                  # Business logic layer
│       │   ├── activity.service.js
│       │   ├── email.service.js
│       │   ├── file.service.js
│       │   ├── folder.service.js
│       │   ├── notification.service.js
│       │   ├── otp.service.js
│       │   ├── search.service.js
│       │   ├── share.service.js
│       │   ├── storage.service.js     # Supabase upload/download wrappers
│       │   ├── trash.service.js
│       │   └── user.service.js
│       └── utils/
│           ├── AppError.js            # Custom operational error class
│           ├── asyncHandler.js        # Async route wrapper
│           └── response.js            # Standardised API response helpers
└── frontend/
    └── src/
        ├── App.jsx                    # Route definitions
        ├── main.jsx                   # React entry point
        ├── index.css                  # Tailwind base styles
        ├── assets/                    # Static assets
        ├── components/
        │   ├── PermissionGate.jsx     # Declarative RBAC component
        │   └── drive/
        │       ├── ContextMenu.jsx    # Right-click context menu (portal)
        │       ├── FileList.jsx       # Folder grid + file table + inline rename
        │       ├── MoveModal.jsx      # Folder picker for moving items
        │       ├── NewFolderModal.jsx # Create folder dialog
        │       ├── PreviewModal.jsx   # In-app file preview
        │       ├── RenameModal.jsx    # (legacy, replaced by inline rename)
        │       ├── ShareModal.jsx     # Share with user / public link
        │       └── UploadProgress.jsx # Upload progress list
        ├── constants/
        │   └── permissions.js         # Frontend RBAC mirror
        ├── contexts/
        │   └── AuthContext.jsx        # Global auth state (user, login, logout)
        ├── hooks/
        │   └── usePermission.js       # Permission checking hook
        ├── layouts/
        │   └── DashboardLayout.jsx    # Sidebar + topbar shell
        ├── pages/
        │   ├── activity/Activity.jsx
        │   ├── auth/Login.jsx
        │   ├── auth/Register.jsx
        │   ├── auth/VerifyOtp.jsx
        │   ├── drive/Drive.jsx        # Main file manager page
        │   ├── notifications/Notifications.jsx
        │   ├── profile/Profile.jsx
        │   ├── recent/Recent.jsx
        │   ├── search/Search.jsx
        │   ├── shared/SharedByMe.jsx
        │   ├── shared/SharedLink.jsx  # Public link access page
        │   ├── shared/SharedWithMe.jsx
        │   ├── starred/Starred.jsx
        │   └── trash/                 # Trash management
        └── services/
            ├── api.js                 # Axios instance with auth interceptor
            ├── auth.service.js        # Login, register, OTP API calls
            └── drive.service.js       # All drive-related API calls
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB** — local instance or [MongoDB Atlas](https://cloud.mongodb.com/) free tier
- **Supabase** account — [supabase.com](https://supabase.com) (free tier works fine)
    - Create a project and a storage bucket named `filedrive`
    - Set bucket to **private** (the API uses signed URLs)

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Then fill in the values (see Environment Variables section below)

# 4. Start development server (auto-restarts on file changes)
npm run dev

# OR start production server
npm start
```

The API will be available at `http://localhost:5000` by default.

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite dev server
npm run dev
```

The app will open at `http://localhost:5173` by default.

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

---

### Environment Variables

Create `backend/.env` with the following keys:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/filedrive
# OR for Atlas: mongodb+srv://<user>:<password>@cluster.mongodb.net/filedrive

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_ACCESS_EXPIRY=7d

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET_NAME=filedrive

# Email (for OTP verification)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Optional
OTP_EXPIRY_MINUTES=5
CORS_ORIGIN=http://localhost:5173
```

> **Tip:** For `EMAIL_PASS`, use a Gmail App Password (not your account password).  
> Go to Google Account → Security → 2-Step Verification → App passwords.

---

## Keyboard Shortcuts

| Location                    | Key                     | Action                                              |
| --------------------------- | ----------------------- | --------------------------------------------------- |
| Anywhere                    | `/`                     | Focus search bar                                    |
| Anywhere                    | `Ctrl+K` / `⌘K`         | Focus search bar                                    |
| Search bar focused          | `Esc`                   | Clear and close search                              |
| Drive page                  | `Ctrl+A` / `⌘A`         | Select all files and folders                        |
| Drive page (items selected) | `Delete` or `Backspace` | Bulk delete selected items                          |
| Drive page                  | `Esc`                   | Deselect all items (first press), then close modals |
| Drive page (no modal open)  | `N`                     | Open New Folder dialog                              |
| Drive page (no modal open)  | `U`                     | Open upload file picker                             |

---

## API Overview

All API routes are prefixed with `/api`. Authentication requires a `Bearer` token in the `Authorization` header.

### Auth — `/api/auth`

| Method | Route         | Description                |
| ------ | ------------- | -------------------------- |
| POST   | `/register`   | Register a new account     |
| POST   | `/login`      | Login and receive JWT      |
| POST   | `/verify-otp` | Verify email with OTP code |
| POST   | `/resend-otp` | Resend OTP to email        |

### Folders — `/api/folders`

| Method | Route                  | Auth | Permission |
| ------ | ---------------------- | ---- | ---------- |
| GET    | `/root`                | ✓    | owner      |
| GET    | `/tree`                | ✓    | owner      |
| POST   | `/`                    | ✓    | owner      |
| GET    | `/:folderId/children`  | ✓    | view+      |
| GET    | `/:folderId/path`      | ✓    | view+      |
| PATCH  | `/:folderId/rename`    | ✓    | edit+      |
| PATCH  | `/:folderId/move`      | ✓    | owner      |
| PATCH  | `/:folderId/color`     | ✓    | edit+      |
| PATCH  | `/:folderId/star`      | ✓    | edit+      |
| POST   | `/:folderId/duplicate` | ✓    | edit+      |
| DELETE | `/:folderId`           | ✓    | owner      |

### Files — `/api/files`

| Method | Route                            | Auth | Permission |
| ------ | -------------------------------- | ---- | ---------- |
| POST   | `/upload`                        | ✓    | owner      |
| GET    | `/recent`                        | ✓    | owner      |
| GET    | `/starred`                       | ✓    | owner      |
| GET    | `/type/:category`                | ✓    | owner      |
| GET    | `/:fileId`                       | ✓    | view+      |
| DELETE | `/:fileId`                       | ✓    | owner      |
| PATCH  | `/:fileId/rename`                | ✓    | edit+      |
| PATCH  | `/:fileId/move`                  | ✓    | owner      |
| PATCH  | `/:fileId/star`                  | ✓    | edit+      |
| POST   | `/:fileId/duplicate`             | ✓    | edit+      |
| GET    | `/:fileId/download`              | ✓    | view+      |
| GET    | `/:fileId/preview`               | ✓    | view+      |
| GET    | `/:fileId/versions`              | ✓    | view+      |
| POST   | `/:fileId/upload-version`        | ✓    | edit+      |
| POST   | `/:fileId/versions/:vId/restore` | ✓    | owner      |
| DELETE | `/:fileId/versions/:vId`         | ✓    | owner      |

### Shares — `/api/shares`

| Method | Route           | Description                        |
| ------ | --------------- | ---------------------------------- |
| POST   | `/user`         | Share with a specific user         |
| POST   | `/link`         | Create a public shareable link     |
| GET    | `/with-me`      | Items shared with the current user |
| GET    | `/by-me`        | Items the current user has shared  |
| GET    | `/item/:itemId` | All shares for an item             |
| PATCH  | `/:shareId`     | Update share permission            |
| DELETE | `/:shareId`     | Revoke a share                     |
| GET    | `/link/:token`  | Access item by public token        |

### User — `/api/user`

| Method | Route              | Description                  |
| ------ | ------------------ | ---------------------------- |
| GET    | `/profile`         | Get current user profile     |
| PATCH  | `/profile`         | Update name                  |
| POST   | `/avatar`          | Upload avatar image          |
| POST   | `/change-password` | Change password              |
| PATCH  | `/preferences`     | Update UI preferences        |
| GET    | `/storage`         | Get storage usage breakdown  |
| POST   | `/delete-account`  | Soft-delete account          |
| DELETE | `/drive`           | Delete all files and folders |

### Other Routes

- **Search** — `GET /api/search?q=<query>&type=<mime>`
- **Trash** — `GET /api/trash`, `POST /api/trash/:id/restore`, `DELETE /api/trash/:id`
- **Activity** — `GET /api/activity`
- **Notifications** — `GET /api/notifications`, `PATCH /api/notifications/:id/read`, etc.

---

## RBAC Permission System

FileDrive uses a Role-Based Access Control system for shared items.

### Permission Hierarchy

```
owner  >  edit  >  comment  >  view
  4         3         2           1
```

Each level includes all capabilities of the levels below it.

### What Each Level Can Do

| Action               | view | comment | edit | owner |
| -------------------- | :--: | :-----: | :--: | :---: |
| Preview / Download   |  ✓   |    ✓    |  ✓   |   ✓   |
| Rename               |      |         |  ✓   |   ✓   |
| Star / Duplicate     |      |         |  ✓   |   ✓   |
| Upload new version   |      |         |  ✓   |   ✓   |
| Move                 |      |         |      |   ✓   |
| Delete               |      |         |      |   ✓   |
| Share / Revoke share |      |         |      |   ✓   |

### How It Works

1. When a file/folder route is called, the `requirePermission(level)` middleware runs.
2. It checks if the requesting user is the **owner** (always allowed).
3. If not the owner, it looks up a `Share` document for that user + item combination.
4. The share's `permission` field is compared against the minimum required level.
5. If insufficient, a `403 Forbidden` is returned.
6. If sufficient, `req.isOwner` and `req.sharePermission` are set for the controller to use.

The frontend mirrors this system in `src/constants/permissions.js` and `src/hooks/usePermission.js` so UI elements (buttons, menus) can be conditionally rendered without an extra API call.

---

## Storage System

- Each user has a `storageUsed` (bytes) and `storageLimit` (default **20 MB**) field on their document.
- Every file upload increments `storageUsed`; every delete decrements it.
- Before uploading, the frontend calls `GET /api/user/storage` to check available space and shows an error if the upload would exceed the limit.
- The sidebar storage bar changes colour: **blue** (<70%) → **yellow** (70–90%) → **red** (>90%).
- The Profile page shows a breakdown by category (images, videos, documents, audio, etc.).

---

## Authentication Flow

```
1. Register  →  POST /api/auth/register
               └─ Creates unverified user, sends OTP email

2. Verify    →  POST /api/auth/verify-otp
               └─ Marks user as verified, returns JWT

3. Login     →  POST /api/auth/login
               └─ Verifies password, returns JWT

4. Requests  →  Authorization: Bearer <token>
               └─ auth.middleware.js validates JWT on every protected route

5. Frontend  →  AuthContext stores user + token in localStorage
               └─ Axios interceptor attaches token to every request
               └─ On 401 response, user is redirected to /login
```

---

## File Upload Flow

```
1. User selects file(s) in the browser

2. Frontend checks storage:
   GET /api/user/storage  →  compare totalBytes against remaining

3. For each file:
   POST /api/files/upload  (multipart/form-data)
   └─ upload.middleware.js  →  multer reads file into memory buffer
   └─ file.controller.js   →  calls fileService.uploadFile()
   └─ storage.service.js   →  uploads buffer to Supabase bucket
                              returns storagePath + public metadata
   └─ File document saved to MongoDB
   └─ user.storageUsed incremented

4. Frontend receives the new File object and prepends it to the list
   (optimistic update already showed progress — no refetch needed)

5. Progress bar driven by Axios onUploadProgress callback
```

---

## Sharing System

### Share with User

1. Owner opens Share Modal on a file or folder.
2. Enters recipient's email and selects permission level (view / comment / edit).
3. `POST /api/shares/user` creates a `Share` document linking `itemId`, `sharedWith` (user ID), and `permission`.
4. A notification is sent to the recipient.
5. The recipient sees the item in **Shared with me**.

### Public Link

1. Owner generates a token via `POST /api/shares/link` (optionally with expiry date).
2. A shareable URL is shown: `/shared/link/<token>`.
3. Anyone with the link can access `GET /api/shares/link/:token` to view/download the item.
4. Expired or revoked links return 403/404.

---

## Scripts

```bash
# Run DB migration: set all users' storageLimit to 20 MB
node backend/scripts/migrate-storage-limit.js
```

Run this once after cloning if your database has existing users with the old 15 GB default.

---

## Screenshots

> Add screenshots here after first deployment.

| Page                | Description                                         |
| ------------------- | --------------------------------------------------- |
| My Drive            | Main file/folder grid with checkboxes, action menus |
| Preview Modal       | In-app image/video/PDF preview                      |
| Share Modal         | Share with user or generate public link             |
| Profile             | Storage breakdown + danger zone                     |
| Notifications       | Unread badge + auto-mark-as-read                    |
| Sidebar (collapsed) | Icon-only mode with tooltip labels                  |

---

## License

MIT — free to use, modify, and distribute.
