# TaskForge - Notion Clone Architecture Plan

## 🎯 Project Vision
A modern Notion-like collaborative workspace with block-based content management, rich text editing, and powerful organization features.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Backend**: NestJS 11 + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: WebSockets (Socket.io/NestJS Gateway)
- **Storage**: Local/S3 for file uploads
- **Authentication**: JWT + Refresh Tokens

---

## 📊 Database Schema (Notion-like)

### Core Models

```prisma
// ============= Workspace & Organization =============
model Workspace {
  id          String    @id @default(cuid())
  name        String
  icon        String?
  ownerId     String
  owner       User      @relation(fields: [ownerId], references: [id])
  members     WorkspaceMember[]
  pages       Page[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  role        MemberRole @default(MEMBER)
  joinedAt    DateTime @default(now())

  @@unique([workspaceId, userId])
  @@index([workspaceId])
  @@index([userId])
}

// ============= User Management =============
model User {
  id          String      @id @default(cuid())
  email       String      @unique
  name        String?
  password    String      // Hashed password
  avatar      String?
  workspaces  WorkspaceMember[]
  ownedSpaces Workspace[]
  sessions    Session[]
  pages       Page[]
  blocks      Block[]
  comments    Comment[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([email])
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshToken String?  @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@index([userId])
}

// ============= Page System =============
model Page {
  id          String    @id @default(cuid())
  title       String    @default("Untitled")
  icon        String?
  cover       String?
  isPublic    Boolean   @default(false)
  isDeleted   Boolean   @default(false)
  deletedAt   DateTime?

  // Relations
  workspaceId String?
  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  parentId    String?
  parent      Page?     @relation("PageHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Page[]    @relation("PageHierarchy")
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])

  // Content
  blocks      Block[]
  comments    Comment[]

  // Metadata
  lastEditedAt DateTime  @default(now())
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([workspaceId])
  @@index([authorId])
  @@index([parentId])
  @@index([isDeleted])
}

// ============= Block System (Core!) =============
model Block {
  id        String   @id @default(cuid())
  type      BlockType
  content   String?  @db.Text  // JSON content for rich text
  props     Json?              // Block-specific properties

  // Relations
  pageId    String
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  parentId  String?
  parent    Block?   @relation("BlockHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children  Block[]  @relation("BlockHierarchy")
  authorId  String?
  author    User?    @relation(fields: [authorId], references: [id])

  // Position & Metadata
  position  Int      // Order within parent
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([pageId])
  @@index([parentId])
  @@index([position])
}

// ============= Comments & Collaboration =============
model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  resolved  Boolean  @default(false)

  // Relations
  pageId    String
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([pageId])
  @@index([resolved])
}

// ============= Enums =============
enum BlockType {
  // Text blocks
  PARAGRAPH
  HEADING_1
  HEADING_2
  HEADING_3
  QUOTE
  CODE
  CALLOUT

  // List blocks
  BULLETED_LIST
  NUMBERED_LIST
  TO_DO

  // Media blocks
  IMAGE
  VIDEO
  FILE
  EMBED

  // Layout blocks
  DIVIDER
  COLUMN
  COLUMN_LIST

  // Database blocks (Notion-style)
  TABLE_VIEW
  BOARD_VIEW
  CALENDAR_VIEW
  GALLERY_VIEW
  LIST_VIEW

  // Interactive
  TOGGLE
  SYNCED_BLOCK
  BOOKMARK
}

enum MemberRole {
  OWNER
  ADMIN
  MEMBER
  GUEST
}
```

---

## 🔌 API Architecture

### RESTful Endpoints

#### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

#### Workspaces
```
GET    /api/workspaces              # List user's workspaces
POST   /api/workspaces              # Create workspace
GET    /api/workspaces/:id          # Get workspace details
PATCH  /api/workspaces/:id          # Update workspace
DELETE /api/workspaces/:id          # Delete workspace
GET    /api/workspaces/:id/members  # List members
POST   /api/workspaces/:id/members  # Add member
DELETE /api/workspaces/:id/members/:userId # Remove member
```

#### Pages
```
GET    /api/pages                   # List user's pages
POST   /api/pages                   # Create page
GET    /api/pages/:id               # Get page with blocks
PATCH  /api/pages/:id               # Update page
DELETE /api/pages/:id               # Move to trash
POST   /api/pages/:id/restore       # Restore from trash
DELETE /api/pages/:id/permanent     # Permanent delete
```

#### Blocks (CRUD)
```
GET    /api/blocks?parentId=xxx     # Get child blocks
POST   /api/blocks                  # Create block
GET    /api/blocks/:id              # Get block
PATCH  /api/blocks/:id              # Update block
DELETE /api/blocks/:id              # Delete block
POST   /api/blocks/reorder          # Reorder blocks
POST   /api/blocks/move             # Move block to different parent
```

#### Search
```
GET    /api/search?q=query&type=pages,blocks
GET    /api/search/recent
```

#### Comments
```
GET    /api/pages/:pageId/comments
POST   /api/pages/:pageId/comments
PATCH  /api/comments/:id
DELETE /api/comments/:id
```

### WebSocket Events (Real-time)

```typescript
// Block collaboration
block.created
block.updated
block.deleted
block.moved

// Page events
page.updated
page.deleted

// Cursor presence
presence.joined
presence.left
presence.moved

// Comments
comment.added
comment.updated
```

---

## 🎨 Frontend Architecture

### Page Structure
```
client/app/
├── layout.tsx
├── page.tsx                     # Landing page
├── dashboard/
│   ├── layout.tsx              # Dashboard layout
│   ├── page.tsx                # Workspace overview
│   └── [workspaceId]/
│       ├── page.tsx            # Workspace view
│       └── [pageId]/
│           ├── page.tsx        # Page editor
│           └── edit/
│               └── page.tsx    # Edit mode
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
└── api/                        # API route handlers (if needed)
```

### Component Structure
```
client/components/
├── editor/
│   ├── BlockEditor.tsx         # Main editor component
│   ├── blocks/
│   │   ├── ParagraphBlock.tsx
│   │   ├── HeadingBlock.tsx
│   │   ├── TodoBlock.tsx
│   │   ├── TableBlock.tsx
│   │   └── ...
│   ├── BlockToolbar.tsx
│   └── BlockMenu.tsx
├── workspace/
│   ├── Sidebar.tsx
│   ├── PageTree.tsx
│   └── WorkspaceSettings.tsx
├── ui/                          # Reusable components
└── auth/
```

### State Management
```typescript
// React Query for server state
useQuery(['page', pageId], fetchPage)
useMutation(updateBlock)

// Zustand for client state
interface EditorStore {
  activeBlockId: string | null
  selection: Range | null
  sidebarOpen: boolean
}
```

---

## 📝 Block Content Format

### Rich Text JSON Format
```typescript
interface BlockContent {
  type: BlockType
  text: {
    content: string
    marks?: Mark[]
  }[]
  props?: Record<string, any>
}

interface Mark {
  type: 'bold' | 'italic' | 'underline' | 'code' | 'link'
  attrs?: { href?: string }
}
```

---

## 🚀 Implementation Phases

### Phase 1: Core Foundation
- [ ] Database setup & migrations
- [ ] Authentication system
- [ ] Basic workspace/page CRUD
- [ ] Basic block system (paragraph, heading)

### Phase 2: Editor Foundation
- [ ] Block-based editor UI
- [ ] Block creation/deletion
- [ ] Basic rich text editing
- [ ] Block reordering (drag-drop)

### Phase 3: Advanced Features
- [ ] Multiple block types (lists, todos, code)
- [ ] Nested blocks
- [ ] Page hierarchy
- [ ] Search functionality

### Phase 4: Collaboration
- [ ] WebSocket integration
- [ ] Real-time updates
- [ ] Presence indicators
- [ ] Comments system

### Phase 5: Advanced Views
- [ ] Table/database view
- [ ] Board/Kanban view
- [ ] Calendar view
- [ ] Templates

---

## 🎯 Next Steps

1. **Database Setup**: Update Prisma schema with Notion-like models
2. **Auth System**: Implement JWT authentication
3. **Basic Pages**: Create page CRUD operations
4. **Block System**: Implement block creation and management
5. **Editor UI**: Build the block-based editor interface

Would you like me to start implementing any of these phases?
