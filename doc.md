# Requirements
- Upload / download files
- Folder structure
- Share with others
- Preview documents/images
- Manage permissions
- Sync changes
- Offline upload (sync when online)

# Architecture

1. Frontend - React

2. Backend - Node + Express

3. Storage - Cloudflare R2
- File data

4. Database - MongoDB 

5. Cache - Redis
- File listing
- Session
- Rate limiting

6. Message Queue - RabbitMQ
- Background file processing
    - Virus scan, Thumnail


# Functional Requirements (FR)

1. User Authentication
- Signup/Signin
- JWT or OAuth2

2. File Upload
- Single/Multiple file upload
- Show progress
- Resume failed uploads
- Store metadata in DB

3. File Download
- Secure endpoint

4. Folder Management
- Create/Rename/Move/Delete Folder
- Store metadata in DB

5. File Management
- Rename/Move Files
- Delete(soft delete) 
- Restore from trash

6. Sharing & Permissions
- Share with email
- Permission levels: View/Edit/Comment
- Generate public shareable links (with expiry)

7. Search
- Search by file/folder name
- Search by document type(image/video etc.)

8. Preview System
- Preview document(image/pdf/text)
- Video streaming

9. Trash System
- Deleted file store in trash
- Auto delete after X days

10. Versioning
- Keep multiple version of file
- Restore old version

11. Activity Log
- File uploaded/shared/renamed/moved/deleted
- Folder created/shared/renamed/moved/deleted

# Database Design

1. Users

id
name
email
password
isVerified
lastLoginAt
createdAt

2. Files
id
clientId // offline
ownerId
folderId 
name
type
size
storagePath // R2 Object key
checksum 
syncVersion: Number
lastModifiedBy: userId  
isDeleted
deletedAt
createdAt
updatedAt

3. Versions
id
fileId
versionNumber
type
size
storagePath
createdAt

4. Folders
id
clientId // offline
ownerId
parentId // null = root
name
storagePath
syncVersion: Number
lastModifiedBy: userId
createdAt
updatedAt

5. Shares
id
itemId
itemType // file/folder
sharedWith // userId (null if public link)
permission // view/comment/edit
linkToken // for public link
expiresAt
createdAt

6. Trash
id
itemId
itemType
ownerId
deletedBy
deletedAt
restoreParentId 
expiresAt 

7. Activity_logs
id
userId
itemId
itemType
action //upload file or create folder/rename/share/move
       //delete/restore/version/preview
createdAt



# API

1. Auth : JWT
```
Authorization: Bearer <access_token>
```
POST:/users/register
POST:/users/login
POST:/users/logout

2. Folders

POST:/folder - create folder
GET:/folder/:folderId - folder metadata
GET:/folder/:folderId/children - folder content(files + subfolder)
PATCH:/folder/:folderId - rename or move folder
DELETE:/folder/:folderId - soft delete

3. File Upload

POST:/files/upload/init - init upload
PUT:PUT <signed_url> - Direct to R2 (Upload chunk)
POST:/files/upload/complete - Complete Upload
GET:/files/upload/status/:uploadId - Resume Upload

4. File management

GET:/files/:fileId - file metadata
PATCH:/files/:fileId - rename or move file
DELETE:/files/:fileId - soft delete
POST:/files/:fileId/restore - restore file

5. File download | preview

GET:/files/:fileId/download - file download
GET:/files/:fileId/preview - preview file


6. Versioning

GET:/files/:fileId/versions - file version
POST:/files/:fileId/versions/:versionId/restore - restore version


7. Sharing & Permissions

POST:/shares - share file/folder
GET:/shares/:token
DELETE:/shares/:shareId

8. Search

GET:/search?q=invoice&type=pdf

9. Trash

GET:/trash - get trash items
POST:/trash/:itemId/restore - restore 
DELETE:/trash/:itemId/permanent - permanent delete

10. Activity Log

GET:/activities

11. Sync offline support

POST:/sync/push - push offline changes
PULL:/sync/pull?since=timestamp - pull server changes


## Todo

---


### 🔹 PHASE 1 - MVP

```
[ ] Project Setup
[ ] Authentication
[ ] Folder Management
[ ] File Upload
[ ] File Management
[ ] Preview System
```

---

### 🔹 PHASE 2 – COLLABORATION

```
[ ] Sharing
[ ] Permission Middleware
```

---

### 🔹 PHASE 3 – OFFLINE SUPPORT

```
[ ] Offline Sync (push / pull)
[ ] Client Offline Queue (retry on reconnect)
```

---

### 🔹 PHASE 4 – Redis & RabbitMQ

```
[ ] Redis (Cache folder listing & rate limit)
[ ] RabbitMQ Workers (Virus scan & thumbnail generation)
```

---

### 🔹 PHASE 5 – Logs

```
[ ] Activity Logs
[ ] Cleanup (trash auto-delete)
```

---

### 🔹 PHASE 6 – FINAL 

```
[ ] Basic Tests (API sanity tests)
[ ] README (architecture + API explanation)
```



