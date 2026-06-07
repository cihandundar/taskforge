# TaskForge - Database Documentation

## 🗄️ Database Overview

TaskForge PostgreSQL kullanır ve Prisma ORM ile yönetilir. Database şeması Notion-like block-based content system için optimize edilmiştir.

## 🔗 Connection Details

```env
DATABASE_URL="postgresql://postgres:kodesilent59@localhost:5432/notion_db"
```

### Connection Configuration
- **Host:** localhost
- **Port:** 5432
- **Database:** notion_db
- **User:** postgres
- **ORM:** Prisma 7.8.0

## 📊 Schema Overview

### Core Tables

#### 1. Users & Authentication
```prisma
User {
  id: String (cuid)
  email: String (unique)
  name: String?
  password: String (hashed)
  avatar: String?
  isActive: Boolean

  Relations:
  - ownedSpaces (Workspace)
  - memberships (WorkspaceMember)
  - pages (Page)
  - sessions (Session)
  - comments (Comment)
}

Session {
  id: String (cuid)
  userId: String (FK → User)
  refreshToken: String (unique)
  userAgent: String?
  ipAddress: String?
  expiresAt: DateTime
}
```

#### 2. Workspace Management
```prisma
Workspace {
  id: String (cuid)
  name: String
  icon: String?
  description: String?
  ownerId: String (FK → User)

  Relations:
  - owner (User)
  - members (WorkspaceMember)
  - pages (Page)
}

WorkspaceMember {
  id: String (cuid)
  workspaceId: String (FK → Workspace)
  userId: String (FK → User)
  role: MemberRole (OWNER, ADMIN, MEMBER, GUEST)
  joinedAt: DateTime

  Unique: [workspaceId, userId]
}
```

#### 3. Page System
```prisma
Page {
  id: String (cuid)
  title: String (default: "Untitled")
  icon: String?
  cover: String?
  isPublic: Boolean
  isDeleted: Boolean
  deletedAt: DateTime?
  workspaceId: String? (FK → Workspace)
  parentId: String? (FK → Page, self-referencing)
  authorId: String (FK → User)

  Relations:
  - workspace (Workspace)
  - parent (Page, self)
  - children (Page, self)
  - author (User)
  - blocks (Block)
  - comments (Comment)

  Indexes: [workspaceId, authorId, parentId, isDeleted]
}
```

#### 4. Block System (Core)
```prisma
Block {
  id: String (cuid)
  type: BlockType (Enum)
  content: String? (JSON: rich text)
  props: Json? (block-specific properties)
  pageId: String (FK → Page)
  parentId: String? (FK → Block, self-referencing)
  position: Int (ordering)
  authorId: String? (FK → User)

  Block Types:
  - Text: PARAGRAPH, HEADING_1/2/3, QUOTE, CODE, CALLOUT
  - List: BULLETED_LIST, NUMBERED_LIST, TO_DO
  - Media: IMAGE, VIDEO, FILE, EMBED
  - Layout: DIVIDER, COLUMN, COLUMN_LIST
  - Database: TABLE_VIEW, BOARD_VIEW, CALENDAR_VIEW, etc.
  - Interactive: TOGGLE, SYNCED_BLOCK, BOOKMARK

  Relations:
  - page (Page)
  - parent (Block, self)
  - children (Block, self)
  - author (User)

  Indexes: [pageId, parentId, position]
}
```

#### 5. Comments
```prisma
Comment {
  id: String (cuid)
  content: String (text)
  resolved: Boolean
  pageId: String (FK → Page)
  authorId: String (FK → User)
  createdAt: DateTime
  updatedAt: DateTime

  Relations:
  - page (Page)
  - author (User)

  Indexes: [pageId, resolved]
}
```

## 🔍 Database Relationships

### Relationship Diagram
```
User (1) ----< (N) Session
  |
  |-- (1) ----< (N) Workspace (owner)
  |                |
  |                |-- (1) ----< (N) WorkspaceMember ----< (1) User
  |                |
  |                |-- (1) ----< (N) Page
  |                                   |
  |                                   |-- (1) ----< (N) Block (self-referencing)
  |                                   |
  |                                   |-- (1) ----< (N) Comment
  |
  |-- (1) ----< (N) Page (author)
  |
  |-- (1) ----< (N) Comment (author)
```

### Key Relationships

1. **User ↔ Workspace**
   - One user can own multiple workspaces
   - One workspace can have multiple members
   - WorkspaceMember junction table for many-to-many

2. **Page Hierarchy**
   - Self-referencing relationship (parent → children)
   - Supports nested pages unlimited depth

3. **Block Hierarchy**
   - Self-referencing relationship for nested blocks
   - Position field for ordering within parent

4. **Soft Deletes**
   - Pages use soft delete (isDeleted flag)
   - Comments use resolved flag instead of delete

## 📝 Common Queries

### Get User with Workspaces
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    ownedSpaces: true,
    memberships: {
      include: { workspace: true }
    }
  }
})
```

### Get Page with Blocks
```typescript
const page = await prisma.page.findUnique({
  where: { id: pageId },
  include: {
    blocks: {
      where: { parentId: null }, // Top-level blocks only
      orderBy: { position: 'asc' }
    },
    author: true
  }
})
```

### Get Nested Blocks
```typescript
const blocks = await prisma.block.findMany({
  where: { pageId },
  include: {
    children: {
      include: { children: true } // Recursive loading
    }
  },
  orderBy: { position: 'asc' }
})
```

### Search Pages
```typescript
const pages = await prisma.page.findMany({
  where: {
    AND: [
      { isDeleted: false },
      { OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { blocks: { some: {
              content: { contains: query }
          }}}
      ]}
    ]
  },
  include: { author: true }
})
```

## 🔄 Migration Management

### Create New Migration
```bash
cd server
npx prisma migrate dev --name describe_your_changes
```

### Reset Database (⚠️ Development Only)
```bash
npx prisma migrate reset
```

### Generate Prisma Client
```bash
npx prisma generate
```

### View Database
```bash
npx prisma studio
```

## 📊 Index Strategy

### Optimized Queries

#### User Authentication
```sql
CREATE INDEX idx_user_email ON "User"(email);
```

#### Page Access
```sql
CREATE INDEX idx_page_workspace ON "Page"(workspaceId) WHERE isDeleted = false;
CREATE INDEX idx_page_author ON "Page"(authorId);
CREATE INDEX idx_page_parent ON "Page"(parentId) WHERE parentId IS NOT NULL;
```

#### Block Operations
```sql
CREATE INDEX idx_block_page ON "Block"(pageId);
CREATE INDEX idx_block_parent ON "Block"(parentId);
CREATE INDEX idx_block_position ON "Block"(pageId, position);
```

#### Comments
```sql
CREATE INDEX idx_comment_page ON "Comment"(pageId) WHERE resolved = false;
```

## 🎯 Data Integrity Rules

### Validation Rules
1. **Email Uniqueness:** User emails must be unique
2. **Workspace Membership:** One user per workspace per role
3. **Refresh Token Uniqueness:** Each refresh token is unique
4. **Position Uniqueness:** Blocks should have unique positions per parent

### Cascade Rules
- Delete User → Cascade Sessions, owned Workspaces, Pages, Comments
- Delete Workspace → Cascade Pages
- Delete Page → Cascade Blocks, Comments
- Delete Block → Cascade child Blocks

## 🚀 Performance Optimization

### Query Optimization Tips

1. **Use Selective Loading:**
   ```typescript
   // Good: Select only needed fields
   const users = await prisma.user.findMany({
     select: { id: true, name: true }
   })

   // Avoid: Loading all relations unnecessarily
   ```

2. **Pagination:**
   ```typescript
   const pages = await prisma.page.findMany({
     skip: page * limit,
     take: limit,
     orderBy: { updatedAt: 'desc' }
   })
   ```

3. **Use Indexes:**
   - Query on indexed fields
   - Create composite indexes for complex queries

### Connection Pooling
Prisma manages connection pooling automatically. Configure in `.env`:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
```

## 🔒 Security Considerations

### Password Storage
- Never store plain text passwords
- Use bcrypt for hashing (handled in application layer)
- Minimum 10 character bcrypt hashes

### Sensitive Data
- Session tokens have expiration
- Refresh tokens are single-use
- User data isolation per workspace

### SQL Injection Prevention
- Prisma automatically prevents SQL injection
- Always use parameterized queries through Prisma
- Never concatenate raw SQL

## 📝 Backup Strategy

### Development
- Prisma migrations serve as schema backup
- Export data: `pg_dump notion_db > backup.sql`

### Production (Future)
- Automated daily backups
- Point-in-time recovery
- Replica databases for read operations

---

*For database operations in development, refer to Prisma documentation: https://www.prisma.io/docs*
