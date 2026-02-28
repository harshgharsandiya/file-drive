# 🚀 FileDrive — Production-Grade Google Drive Clone: Full Feature Expansion Prompt

## PROJECT CONTEXT

You are working on **FileDrive**, an existing Google Drive-like application.

**Current Stack:**

- **Frontend**: React + Tailwind CSS (JavaScript only, no TypeScript)
- **Backend**: Node.js + Express (JavaScript only, no TypeScript)
- **Database**: MongoDB (Mongoose)
- **Storage**: Supabase Storage
- **Auth**: JWT + OTP email verification

**What already works (DO NOT rewrite, only extend/improve):**

1. File upload via Supabase
2. File download (signed URLs)
3. File preview (signed URLs)
4. Authentication with OTP verification
5. Activity logging
6. Creating folders

**Your mission:** Add every missing feature listed below in the most scalable, clean, modular, and production-grade way possible — matching Google Drive's capabilities and beyond.

---

## ARCHITECTURE RULES (FOLLOW STRICTLY)

### Backend

- Follow strict **MVC pattern**: `routes → controllers → services → models`
- Every controller must only handle request/response — zero business logic
- All business logic lives in **service files**
- Use **async/await** with a global `asyncHandler` wrapper — no try/catch in controllers
- Centralized error handling middleware with custom `AppError` class
- Input validation using **express-validator** on all routes
- All routes protected via `authMiddleware` unless explicitly public
- Use **mongoose transactions** for any multi-document writes
- Paginate ALL list endpoints using `page` + `limit` query params with metadata (`totalPages`, `totalCount`, `hasNextPage`)
- All responses follow this envelope: `{ success: true, data: {}, message: "", meta: {} }`
- Rate limiting on auth routes (express-rate-limit)
- Helmet.js for security headers
- CORS configured for frontend origin
- All file sizes in bytes, dates in ISO 8601
- Never expose internal errors to client in production

### Frontend

- Strict **component structure**: `pages/`, `components/` (further split by feature), `hooks/`, `services/` (API calls), `context/`, `utils/`, `constants/`
- All API calls in dedicated service files using **axios** with interceptors (auto-attach JWT, handle 401 refresh/logout)
- Global state via **React Context + useReducer** (or Zustand if already used)
- Custom hooks for all data-fetching logic (e.g., `useFiles`, `useFolders`, `useSearch`)
- Every list view must support **loading skeletons**, **empty states**, and **error states**
- Optimistic UI updates for rename, move, delete, star operations
- All modals managed through a single `useModal` context
- Toast notifications via a global toast context (not per-component)
- Fully **responsive** (mobile, tablet, desktop)
- Keyboard shortcuts for power users (documented in a Help modal)

---

## FEATURES TO BUILD

---

### 1. 📁 ADVANCED FOLDER MANAGEMENT

**Backend:**

- `PUT /api/folders/:id/rename` — rename folder, validate unique name within parent
- `PUT /api/folders/:id/move` — move folder to another parent (prevent circular moves)
- `DELETE /api/folders/:id` — soft delete (moves to trash), recurse children
- `GET /api/folders/:id/path` — return full breadcrumb path from root to folder
- `GET /api/folders/:id/tree` — return full nested subtree (for move-to picker)
- `GET /api/folders/:id/contents` — return paginated files + subfolders in this folder with sort options (`name`, `size`, `createdAt`, `updatedAt`)
- `PUT /api/folders/:id/color` — assign a color label to folder (store hex or predefined enum)
- `POST /api/folders/:id/duplicate` — duplicate folder and all contents recursively

**Frontend:**

- Right-click context menu on folders (rename, move, color, duplicate, share, trash)
- Inline rename (double-click folder name → editable input, ESC to cancel, Enter to confirm)
- Drag-and-drop folders into other folders
- Breadcrumb navigation bar that updates with every folder change
- Color-coded folder icons (Google Drive style: teal, red, yellow, blue, purple, etc.)
- "Move to" modal with folder tree picker (searchable)
- Empty folder state illustration

---

### 2. 📄 ADVANCED FILE MANAGEMENT

**Backend:**

- `PUT /api/files/:id/rename` — rename file (update in DB, rename in Supabase path or just update display name)
- `PUT /api/files/:id/move` — move file to a different folder (update DB, no Supabase move needed if using stored path logic)
- `PUT /api/files/:id/star` — toggle star/unstar a file
- `GET /api/files/starred` — get all starred files for user (paginated)
- `POST /api/files/:id/duplicate` — duplicate file in same folder with "Copy of" prefix
- `GET /api/files/:id/info` — return full metadata: size, type, created, modified, shared with, versions, storage path
- `PUT /api/files/:id/description` — add/update a description/note to a file
- `GET /api/files/recent` — get last 20 files accessed/uploaded by user (by `updatedAt`)
- `GET /api/files/by-type` — filter files by MIME type category (`image`, `video`, `document`, `pdf`, `audio`, `archive`)

**Frontend:**

- File card and file list row both show: thumbnail (for images), file type icon (for others), name, size, modified date, star icon
- Right-click context menu: preview, download, rename, move, duplicate, star, share, info, trash
- File info panel (slide-in right sidebar): shows all metadata, description, activity, shared with
- "Details" side panel toggled by "i" button in toolbar — shows selected file info
- Starred files page
- Recent files page
- Filter bar to filter by file type

---

### 3. 🗑️ TRASH SYSTEM (FULL)

**Backend (extend existing):**

- `GET /api/trash` — list all trashed items (files + folders) paginated, show `trashedAt`
- `PUT /api/trash/:id/restore` — restore file or folder (back to original parent, or root if parent also deleted)
- `DELETE /api/trash/:id` — permanently delete single item (remove from Supabase + MongoDB)
- `DELETE /api/trash/empty` — permanently delete ALL trashed items for user
- Auto-delete trashed items older than 30 days (cron job using `node-cron`)

**Frontend:**

- Dedicated Trash page
- Shows trashed files/folders with `trashedAt` date and "Days until auto-delete" badge
- "Restore" and "Delete Forever" buttons per item
- "Empty Trash" button with confirmation modal
- Empty trash state illustration

---

### 4. 🔗 FILE & FOLDER SHARING (FULL)

**Backend:**

- `POST /api/shares` — share file/folder with a specific user (by email), with role: `viewer` or `editor`
- `GET /api/shares/with-me` — list all files/folders shared with the logged-in user
- `GET /api/shares/by-me` — list all files/folders the user has shared with others
- `PUT /api/shares/:id` — update share role (viewer ↔ editor)
- `DELETE /api/shares/:id` — revoke access for a specific share
- `POST /api/shares/:fileId/public-link` — generate or refresh a public access token (store in file doc)
- `DELETE /api/shares/:fileId/public-link` — revoke public link
- `GET /api/public/:token` — public endpoint (no auth) to access shared file metadata + download URL
- Send email notification to recipient when a file is shared with them

**Frontend:**

- "Share" modal: input email + role selector, shows current shared users list
- Can change role or remove user from share modal
- "Copy link" button for public link
- Toggle to enable/disable public link
- "Shared with me" page in sidebar
- "Shared by me" page in sidebar
- Shared file badge/indicator on file cards

---

### 5. 📂 FILE VERSIONING

**Backend:**

- Every time a file is re-uploaded with the same name to the same folder, auto-create a new version
- `GET /api/files/:id/versions` — list all versions (versionNumber, size, uploadedAt, uploadedBy)
- `POST /api/files/:id/versions/:versionId/restore` — restore a past version (copy that Supabase object to current, update file doc)
- `DELETE /api/files/:id/versions/:versionId` — delete a specific old version
- Keep max 10 versions per file (purge oldest when limit exceeded)
- Version model: `{ fileId, versionNumber, supabasePath, size, uploadedAt, uploadedBy }`

**Frontend:**

- "Version History" option in right-click menu / file info panel
- Modal listing all versions with date, size, who uploaded
- "Restore" button per version (with confirmation)
- "Delete version" button
- Current version clearly labeled

---

### 6. 🔍 SEARCH (FULL-POWER)

**Backend:**

- `GET /api/search?q=&type=&minSize=&maxSize=&startDate=&endDate=&location=`
- Search across: file names, folder names, file descriptions
- Support filters: file type, size range, date range, location (folder)
- Return categorized results: `{ files: [], folders: [] }` with pagination
- Implement MongoDB text index on `name` and `description` fields
- Highlight matched term in results (`matchedText` field)
- `GET /api/search/suggestions?q=` — return top 5 name suggestions as user types (autocomplete)

**Frontend:**

- Search bar in header (always visible)
- Dropdown suggestions as user types (debounced 300ms)
- Full search results page with filter sidebar (type, date range, size range)
- Results grouped by Files / Folders
- "No results" empty state with illustration
- Recent searches stored in localStorage (max 10)

---

### 7. 📊 STORAGE QUOTA & USAGE

**Backend:**

- Each user has a `storageUsed` (bytes) and `storageLimit` (default 15GB) field in User model
- On every upload: increment `storageUsed`
- On every permanent delete: decrement `storageUsed`
- `GET /api/storage/usage` — return `{ used, limit, percentage, byType: { images: N, videos: N, documents: N, ... } }`
- Block uploads if user exceeds quota (return 403 with clear message)

**Frontend:**

- Storage bar in sidebar (like Google Drive): "X GB of 15 GB used"
- Color changes: green → yellow (80%) → red (95%)
- Storage breakdown page: donut chart showing usage by file type
- Warning toast when 90% full
- Upload blocked UI state with upgrade prompt

---

### 8. 📤 UPLOAD SYSTEM (PRODUCTION-GRADE)

**Backend:**

- `POST /api/files/upload-url` — generate a Supabase signed upload URL for direct client-side upload
- `POST /api/files/confirm-upload` — called after direct upload succeeds; saves file metadata to MongoDB
- `POST /api/files/upload` — server-side upload (buffer, for small files) using multer
- Support chunked upload tracking for large files (optional: store upload sessions)
- Validate file type and size on backend before issuing signed URL
- Generate thumbnail for images using `sharp` (store thumbnail URL in file doc)
- Extract basic metadata: image dimensions (sharp), video duration (if ffprobe available), PDF page count

**Frontend:**

- Drag-and-drop upload zone (the whole main area should be a drop zone)
- Multi-file upload support
- Upload progress UI: floating upload tray (bottom-right, like Google Drive) showing each file's progress bar, status (uploading / done / error), file name, size
- Cancel individual uploads
- Retry failed uploads
- Folder upload support (read `webkitdirectory`, recreate folder structure via API)
- Duplicate file detection: if file with same name exists in folder, prompt: Replace / Keep Both / Cancel

---

### 9. 👁️ FILE PREVIEW (PRODUCTION-GRADE)

**Backend:**

- `GET /api/files/:id/preview-url` — return a short-lived signed URL (60 seconds) for inline preview

**Frontend:**

- Full-screen preview modal with:
    - **Images**: pan & zoom (pinch/scroll), prev/next navigation between images in folder
    - **PDFs**: embedded PDF viewer (using `react-pdf` or iframe)
    - **Videos**: HTML5 video player with controls
    - **Audio**: HTML5 audio player
    - **Text / Code files**: syntax-highlighted code viewer (using `highlight.js` or `prism`)
    - **Unsupported types**: "Preview not available" with download button
- Header in preview modal: file name, size, date, download button, share button, open-in-new-tab button
- Keyboard nav: Left/Right arrows to navigate, Escape to close

---

### 10. ⭐ STARS, LABELS & ORGANIZATION

**Backend:**

- `PUT /api/files/:id/star` / `PUT /api/folders/:id/star` — toggle star
- `GET /api/starred` — list all starred items (files + folders) paginated
- `PUT /api/files/:id/labels` — assign color labels (array of strings from predefined set)
- `GET /api/files?label=` — filter by label

**Frontend:**

- Star icon on hover for all file/folder cards
- Starred section in sidebar
- Label color dots visible on cards
- Filter by label in sidebar

---

### 11. 🔔 NOTIFICATIONS SYSTEM

**Backend:**

- `Notification` model: `{ userId, type, message, read, relatedFileId, relatedFolderId, createdAt }`
- Types: `file_shared`, `storage_warning`, `file_comment` (future), `link_accessed`
- Create notification when: file shared with user, storage hits 90%, public link accessed
- `GET /api/notifications` — list paginated notifications for user
- `PUT /api/notifications/:id/read` — mark as read
- `PUT /api/notifications/read-all` — mark all as read
- `DELETE /api/notifications/:id` — delete notification
- Unread count in response header or dedicated endpoint `GET /api/notifications/unread-count`

**Frontend:**

- Bell icon in header with unread count badge
- Notification dropdown panel (latest 10, with "View all" link)
- Full notifications page
- Unread notifications highlighted
- Real-time updates via **polling every 30 seconds** (or WebSocket if ambitious)

---

### 12. 📋 ACTIVITY LOG (EXTEND EXISTING)

**Backend (extend):**

- Ensure all actions are logged: upload, download, preview, rename, move, delete, restore, share, star, version restore, folder create
- Activity model should include: `userId`, `action`, `itemId`, `itemType` (file/folder), `itemName`, `metadata` (JSON for extra context), `ip`, `userAgent`, `createdAt`
- `GET /api/activities` — paginated activity log for user with filters: `action`, `dateRange`
- `GET /api/activities/file/:fileId` — activity history for a specific file

**Frontend:**

- Activity feed page (full log)
- File-specific activity in the file info panel
- Filter by action type and date range
- Human-readable labels: "You uploaded photo.jpg", "You shared document.pdf with user@email.com"

---

### 13. 👤 USER PROFILE & SETTINGS

**Backend:**

- `GET /api/users/me` — return full profile
- `PUT /api/users/me` — update name, avatar URL
- `POST /api/users/me/avatar` — upload avatar (store in Supabase, update user doc)
- `PUT /api/users/me/password` — change password (require current password)
- `PUT /api/users/me/preferences` — save UI preferences (view mode, default sort, theme)
- `DELETE /api/users/me` — delete account (soft delete, queue data cleanup)

**Frontend:**

- Profile settings page: avatar upload, name, email (read-only), password change
- UI preferences: default view (grid/list), default sort, items per page
- Account deletion with confirmation (type "DELETE" to confirm)
- Avatar shown in header

---

### 14. 🖥️ UI / UX — PRODUCTION POLISH

**Layout:**

- Sidebar: Logo, Search, New (+) button, navigation links (My Drive, Shared with Me, Recent, Starred, Trash, Storage), storage bar
- Header: Search bar (center), notifications bell, user avatar + dropdown
- Main content area: toolbar (view toggle, sort, filter) + content grid/list
- Right panel: collapsible file details/info panel

**View Modes:**

- **Grid view**: cards with thumbnail/icon, name, modified date
- **List view**: table with columns (Name, Owner, Modified, File size, actions)
- User preference saved to localStorage + backend preferences
- Smooth transition animation between view modes

**Sorting:**

- Sort by: Name, Date modified, Date created, Size, Type
- Ascending/Descending toggle
- Sort persisted per folder in localStorage

**Selection:**

- Click to select a file (shows details panel)
- Shift+Click for range selection
- Ctrl/Cmd+Click for multi-select
- Select all with Ctrl+A
- Toolbar shows selected count + bulk actions (download, move, star, trash, share)
- "Download selected" triggers ZIP download of multiple files

**Keyboard Shortcuts:**

- `/` → focus search
- `N` → new folder
- `U` → upload files
- `Del` → move selected to trash
- `R` → rename selected
- `Enter` → open/preview selected
- `?` → open keyboard shortcuts help modal

---

### 15. ⚡ PERFORMANCE & PRODUCTION FEATURES

**Backend:**

- Add **Redis** (or in-memory fallback) caching for: user storage stats, folder trees, recent files (TTL 60s, invalidated on write)
- All MongoDB queries must use proper indexes (define in models)
- Compression middleware (`compression` npm package)
- Morgan for HTTP request logging (combined format in production)
- Graceful shutdown (handle SIGTERM, close DB connections)
- Health check endpoint `GET /health` returning `{ status: "ok", uptime, memory }`
- Environment-based config module (`config/index.js`) exporting all env vars with validation

**Frontend:**

- Lazy load all pages with `React.lazy` + `Suspense`
- `react-query` (TanStack Query) for all server state: caching, background refetch, stale-while-revalidate
- Virtualized lists for large folders (`react-virtual` or `react-window`)
- Image thumbnails with lazy loading (`loading="lazy"` or Intersection Observer)
- Service Worker for offline detection + "You're offline" banner
- Error Boundary wrapping all pages

---

## FILE & FOLDER MODEL REFERENCE

**File Model** (extend existing):

```js
{
  userId, name, displayName, description,
  mimeType, size, supabasePath, thumbnailUrl,
  folderId, // null = root
  isStarred, labels: [String],
  isTrashed, trashedAt,
  publicToken, publicTokenExpiry,
  storageVersion, // for cache busting
  currentVersionId,
  createdAt, updatedAt
}
```

**Folder Model** (extend existing):

```js
{
    ;(userId,
        name,
        parentId, // null = root
        color,
        isStarred,
        isTrashed,
        trashedAt,
        createdAt,
        updatedAt)
}
```

**Version Model:**

```js
{
    ;(fileId, versionNumber, supabasePath, size, uploadedAt, uploadedBy)
}
```

**Share Model:**

```js
{ fileId, folderId, ownerId, sharedWithUserId, role: ['viewer','editor'], createdAt }
```

**Notification Model:**

```js
{
    ;(userId, type, message, read, relatedFileId, relatedFolderId, createdAt)
}
```

**Activity Model** (extend):

```js
{
    ;(userId,
        action,
        itemId,
        itemType,
        itemName,
        metadata,
        ip,
        userAgent,
        createdAt)
}
```

---

## DELIVERABLES CHECKLIST

For each feature, deliver:

**Backend:**

- [ ] Model (if new)
- [ ] Service file with all business logic
- [ ] Controller file (thin, delegates to service)
- [ ] Route file with validation rules
- [ ] Mount route in `app.js`
- [ ] Update README with new endpoints

**Frontend:**

- [ ] API service function in `services/`
- [ ] Custom hook in `hooks/`
- [ ] UI components in `components/[feature]/`
- [ ] Page component in `pages/` (if new page)
- [ ] Route added to router
- [ ] Loading/empty/error states for every data-fetching component
- [ ] Toast notifications for success/error actions
- [ ] Mobile responsive

---

## IMPLEMENTATION ORDER (RECOMMENDED)

1. **Foundation first**: Extend models, add indexes, set up react-query, axios interceptors, global toast + modal context
2. **Folder management** (rename, move, delete, breadcrumb, tree)
3. **File management** (rename, move, star, info panel)
4. **Upload system** (drag-drop, progress tray, duplicate detection)
5. **Preview modal** (all file types)
6. **Trash system** + cron auto-delete
7. **Search** (full-text + filters + suggestions)
8. **Sharing** (user share + public link)
9. **Versioning**
10. **Storage quota** (display + enforcement)
11. **Notifications**
12. **Activity log** (extend)
13. **User profile & settings**
14. **UI polish** (keyboard shortcuts, bulk select, view modes, sort)
15. **Performance** (caching, virtualization, lazy loading)

---

## IMPORTANT NOTES FOR THE AGENT

- **Do not rewrite working features** — only extend and integrate
- **Every new backend route must be protected** by `authMiddleware` unless explicitly public
- **Every list endpoint must be paginated** — no "return all" endpoints
- **Supabase paths** should follow pattern: `{userId}/{folderId}/{fileId}/{filename}` — never expose raw paths to client
- **Never store signed URLs in DB** — always generate fresh ones on request
- **All monetary/storage values** stored as integers (bytes, not KB/MB)
- **Test each endpoint manually** with realistic data before moving to next feature
- **Keep all code in JavaScript** — no TypeScript, no type annotations
- **Use `dayjs`** for all date manipulation on both frontend and backend
- **Comment every service function** with JSDoc: what it does, params, returns, throws
