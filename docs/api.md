# TaskForge - API Documentation

## 🌐 API Overview

TaskForge RESTful API kullanır. Tüm endpointler `/api` prefix'i ile başlar.

### Base URL
```
Development: http://localhost:3001/api
Production: https://api.taskforge.com/api
```

### Authentication
Tüm protected endpointlerde JWT token kullanılır:
```http
Authorization: Bearer <access_token>
```

### Response Format
**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "statusCode": 400
}
```

---

## 🔐 Authentication Endpoints

### POST /auth/register
Yeni kullanıcı kaydı oluşturur.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "clx123abc",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### POST /auth/login
Kullanıcı girişi.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clx123abc",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### POST /auth/refresh
Access token yenileme.

**Request:**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/logout
Oturumu kapatır (requires auth).

**Request:**
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### GET /auth/me
Mevcut kullanıcı bilgisi (requires auth).

**Request:**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 💼 Workspace Endpoints

### GET /workspaces
Kullanıcının workspaces'lerini listeler (requires auth).

**Request:**
```http
GET /api/workspaces
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx456def",
      "name": "My Workspace",
      "icon": "🏠",
      "description": "Personal workspace",
      "ownerId": "clx123abc",
      "members": [
        {
          "user": { "id": "...", "name": "...", "email": "..." },
          "role": "ADMIN"
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /workspaces
Yeni workspace oluşturur (requires auth).

**Request:**
```http
POST /api/workspaces
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Workspace",
  "icon": "🚀",
  "description": "My new workspace"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx789ghi",
    "name": "New Workspace",
    "icon": "🚀",
    "description": "My new workspace",
    "ownerId": "clx123abc",
    "members": [],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET /workspaces/:id
Workspace detaylarını getirir (requires auth, member only).

**Request:**
```http
GET /api/workspaces/clx789ghi
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx789ghi",
    "name": "New Workspace",
    "icon": "🚀",
    "description": "My new workspace",
    "ownerId": "clx123abc",
    "members": [
      {
        "user": { "id": "clx123abc", "name": "John", "email": "john@example.com" },
        "role": "OWNER"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### PATCH /workspaces/:id
Workspace günceller (requires auth, owner/admin only).

**Request:**
```http
PATCH /api/workspaces/clx789ghi
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Workspace",
  "icon": "💼"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx789ghi",
    "name": "Updated Workspace",
    "icon": "💼",
    ...
  }
}
```

### DELETE /workspaces/:id
Workspace siler (requires auth, owner only).

**Request:**
```http
DELETE /api/workspaces/clx789ghi
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workspace deleted successfully"
}
```

### POST /workspaces/:id/members
Workspace'e üye ekler (requires auth, owner/admin only).

**Request:**
```http
POST /api/workspaces/clx789ghi/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role": "MEMBER"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "newuser@example.com", "name": "New User" },
    "role": "MEMBER",
    "joinedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PATCH /workspaces/:id/members/:userId
Üye rolünü günceller (requires auth, owner/admin only).

**Request:**
```http
PATCH /api/workspaces/clx789ghi/members/clx999xyz
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "ADMIN"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "role": "ADMIN",
    "joinedAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /workspaces/:id/members/:userId
Üyeyi çıkarır (requires auth, owner/admin only).

**Request:**
```http
DELETE /api/workspaces/clx789ghi/members/clx999xyz
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

## 📄 Page Endpoints

### GET /pages
Sayfaları listeler (requires auth).

**Query Parameters:**
- `workspaceId` (optional) - Filter by workspace
- `authorId` (optional) - Filter by author
- `parentId` (optional) - Filter by parent page

**Request:**
```http
GET /api/pages?workspaceId=clx789ghi
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx111aaa",
      "title": "My Page",
      "icon": "📄",
      "cover": null,
      "isPublic": false,
      "workspaceId": "clx789ghi",
      "parentId": null,
      "authorId": "clx123abc",
      "lastEditedAt": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /pages
Yeni sayfa oluşturur (requires auth).

**Request:**
```http
POST /api/pages
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Page",
  "icon": "📝",
  "workspaceId": "clx789ghi",
  "parentId": null
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx222bbb",
    "title": "New Page",
    "icon": "📝",
    "workspaceId": "clx789ghi",
    "authorId": "clx123abc",
    ...
  }
}
```

### GET /pages/:id
Sayfa detaylarını getirir (requires auth, access control).

**Request:**
```http
GET /api/pages/clx222bbb
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx222bbb",
    "title": "New Page",
    "icon": "📝",
    "workspace": { "id": "...", "name": "..." },
    "author": { "id": "...", "name": "..." },
    "blocks": [],
    ...
  }
}
```

### PATCH /pages/:id
Sayfa günceller (requires auth, author only).

**Request:**
```http
PATCH /api/pages/clx222bbb
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Page",
  "icon": "✏️"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

### DELETE /pages/:id
Sayfayı siler (soft delete, requires auth, author only).

**Request:**
```http
DELETE /api/pages/clx222bbb
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Page deleted successfully"
}
```

---

## 🧱 Block Endpoints

### GET /pages/:pageId/blocks
Sayfadaki blockları listeler (requires auth, page access).

**Request:**
```http
GET /api/pages/clx222bbb/blocks
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx333ccc",
      "type": "PARAGRAPH",
      "content": "Hello world",
      "props": null,
      "pageId": "clx222bbb",
      "parentId": null,
      "position": 0,
      "children": []
    }
  ]
}
```

### POST /blocks
Yeni block oluşturur (requires auth, page access).

**Request:**
```http
POST /api/blocks
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "PARAGRAPH",
  "content": "New paragraph",
  "pageId": "clx222bbb",
  "parentId": null,
  "position": 0
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx444ddd",
    "type": "PARAGRAPH",
    "content": "New paragraph",
    "pageId": "clx222bbb",
    "position": 0,
    ...
  }
}
```

### PATCH /blocks/:id
Block günceller (requires auth, page access).

**Request:**
```http
PATCH /api/blocks/clx444ddd
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated paragraph",
  "props": { "bold": true }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

### POST /blocks/reorder
Blockları yeniden sıralar (requires auth, page access).

**Request:**
```http
POST /api/blocks/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "blockIds": ["clx444ddd", "clx333ccc"],
  "parentId": null
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "reordered": true }
}
```

### DELETE /blocks/:id
Block siler (requires auth, page access).

**Request:**
```http
DELETE /api/blocks/clx444ddd
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Block deleted successfully"
}
```

---

## 💬 Comment Endpoints

### GET /pages/:pageId/comments
Sayfadaki yorumları listeler (requires auth, page access).

**Request:**
```http
GET /api/pages/clx222bbb/comments
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx555eee",
      "content": "Great page!",
      "resolved": false,
      "pageId": "clx222bbb",
      "author": { "id": "...", "name": "..." },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /comments
Yeni yorum oluşturur (requires auth, page access).

**Request:**
```http
POST /api/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "This is a comment",
  "pageId": "clx222bbb"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx666fff",
    "content": "This is a comment",
    "resolved": false,
    "pageId": "clx222bbb",
    "authorId": "clx123abc",
    ...
  }
}
```

### PATCH /comments/:id
Yorum günceller (requires auth, author only).

**Request:**
```http
PATCH /api/comments/clx666fff
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated comment",
  "resolved": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 📅 Calendar Endpoints

### GET /calendar/notes
Kullanıcının calendar notlarını getirir (requires auth).

**Query Parameters:**
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)
- `siteId` (optional) - Filter by site

**Request:**
```http
GET /api/calendar/notes?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx777ggg",
      "date": "2024-01-15",
      "note": "Meeting with team",
      "color": "blue",
      "userId": "clx123abc",
      "siteId": null,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /calendar/notes
Yeni calendar note oluşturur (requires auth).

**Request:**
```http
POST /api/calendar/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-20",
  "note": "Project deadline",
  "color": "red",
  "siteId": null
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx888hhh",
    "date": "2024-01-20",
    "note": "Project deadline",
    "color": "red",
    "userId": "clx123abc",
    ...
  }
}
```

### PATCH /calendar/notes/:id
Calendar note günceller (requires auth, owner only).

**Request:**
```http
PATCH /api/calendar/notes/clx888hhh
Authorization: Bearer <token>
Content-Type: application/json

{
  "note": "Updated deadline",
  "color": "yellow"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

### DELETE /calendar/notes/:id
Calendar note siler (requires auth, owner only).

**Request:**
```http
DELETE /api/calendar/notes/clx888hhh
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Calendar note deleted successfully"
}
```

---

## 🌐 Sites Endpoints

### GET /sites
Kullanıcının sitelerini listeler (requires auth).

**Request:**
```http
GET /api/sites
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx999iii",
      "name": "Production",
      "url": "https://example.com",
      "color": "green",
      "isActive": true,
      "userId": "clx123abc",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /sites
Yeni site oluşturur (requires auth).

**Request:**
```http
POST /api/sites
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Staging",
  "url": "https://staging.example.com",
  "color": "yellow",
  "isActive": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx000jjj",
    "name": "Staging",
    "url": "https://staging.example.com",
    "color": "yellow",
    "isActive": true,
    "userId": "clx123abc",
    ...
  }
}
```

### PATCH /sites/:id
Site günceller (requires auth, owner only).

**Request:**
```http
PATCH /api/sites/clx999iii
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production Server",
  "isActive": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

### DELETE /sites/:id
Site siler (requires auth, owner only).

**Request:**
```http
DELETE /api/sites/clx999iii
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Site deleted successfully"
}
```

---

## 🔌 WebSocket Endpoints

WebSocket bağlantısı için gerçek zamanlı güncellemeler:

**Connection URL:**
```
ws://localhost:3001
```

**Connection Query:**
```
?token=<access_token>
```

**Events:**

### Client → Server
```typescript
// Join room
{
  "event": "joinRoom",
  "data": { "pageId": "clx222bbb" }
}

// Block update
{
  "event": "blockUpdate",
  "data": {
    "blockId": "clx444ddd",
    "pageId": "clx222bbb",
    "type": "PARAGRAPH",
    "content": "Updated content"
  }
}

// Leave room
{
  "event": "leaveRoom",
  "data": { "pageId": "clx222bbb" }
}
```

### Server → Client
```typescript
// Block updated
{
  "event": "blockUpdated",
  "data": {
    "blockId": "clx444ddd",
    "type": "PARAGRAPH",
    "content": "Updated content",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}

// User joined
{
  "event": "userJoined",
  "data": {
    "pageId": "clx222bbb",
    "user": { "id": "...", "name": "..." }
  }
}

// User left
{
  "event": "userLeft",
  "data": {
    "pageId": "clx222bbb",
    "userId": "clx123abc"
  }
}
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "error": ["email must be an email", "password is too short"],
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You don't have permission to perform this action",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "statusCode": 404
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Resource already exists",
  "statusCode": 409
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500
}
```

---

## 📋 Block Types Reference

Available block types for the `type` field:

### Text Blocks
- `PARAGRAPH` - Standard text paragraph
- `HEADING_1` - Level 1 heading
- `HEADING_2` - Level 2 heading
- `HEADING_3` - Level 3 heading
- `QUOTE` - Quoted text
- `CODE` - Code block
- `CALLOUT` - Callout box

### List Blocks
- `BULLETED_LIST` - Bulleted list item
- `NUMBERED_LIST` - Numbered list item
- `TO_DO` - Checkbox item

### Media Blocks
- `IMAGE` - Image embed
- `VIDEO` - Video embed
- `FILE` - File attachment
- `EMBED` - External URL embed

### Layout Blocks
- `DIVIDER` - Horizontal line
- `COLUMN` - Column within column list
- `COLUMN_LIST` - Container for columns

### Database/View Blocks
- `TABLE_VIEW` - Table view
- `BOARD_VIEW` - Kanban board view
- `CALENDAR_VIEW` - Calendar view
- `GALLERY_VIEW` - Gallery view
- `LIST_VIEW` - List view

### Interactive Blocks
- `TOGGLE` - Collapsible toggle
- `SYNCED_BLOCK` - Synced across pages
- `BOOKMARK` - URL bookmark

---

## 🎨 Color Options

Available colors for sites and calendar notes:
- `blue`
- `green`
- `yellow`
- `red`
- `purple`

---

## 👥 Member Roles

Available member roles:
- `OWNER` - Full permissions, can delete workspace
- `ADMIN` - Can manage members and pages
- `MEMBER` - Can create and edit pages
- `GUEST` - Read-only access

---

*For implementation details, see source code in `server/src/`*
