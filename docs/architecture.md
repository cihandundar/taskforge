# TaskForge - Architecture Overview

## 🏗️ General Architecture

TaskForge, Notion-like bir collaborative workspace applicationdır. Modern full-stack architecture ile geliştirilmiştir.

### Tech Stack

**Frontend:**
- **Framework:** Next.js 16.2.7 (App Router)
- **UI Library:** React 19.2.4
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript 5
- **State Management:** React Query + Zustand
- **Rich Text Editor:** Custom block-based editor

**Backend:**
- **Framework:** NestJS 11.0.1
- **Language:** TypeScript 5.7.3
- **Database:** PostgreSQL 18
- **ORM:** Prisma 7.8.0
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** class-validator, class-transformer

## 📁 Project Structure

```
taskforge/
├── client/                  # Next.js Frontend
│   ├── app/                # App Router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and API client
│   └── public/             # Static assets
├── server/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── workspaces/    # Workspace management
│   │   ├── pages/         # Page operations
│   │   ├── blocks/        # Block system
│   │   ├── comments/      # Comment system
│   │   ├── common/        # Shared utilities
│   │   └── main.ts        # Application entry
│   ├── prisma/            # Database schema & migrations
│   └── dist/              # Compiled output
├── docs/                  # Project documentation
├── docker-compose.yml     # Docker services
└── README.md            # Project overview
```

## 🔄 Application Flow

### Authentication Flow
```
1. User → Register/Login
2. Backend → Validate credentials
3. Backend → Generate JWT tokens (access + refresh)
4. Frontend → Store tokens securely
5. Subsequent requests → Include JWT in headers
6. Backend → Validate JWT → Process request
```

### Data Flow
```
Frontend (Next.js)
    ↓ HTTP/HTTPS
Backend (NestJS)
    ↓ Prisma ORM
Database (PostgreSQL)
```

### Real-time Updates (Future)
```
1. User makes changes → WebSocket event
2. Server broadcasts to connected clients
3. Other users receive updates instantly
4. Optimistic UI updates
```

## 🎯 Core Concepts

### 1. Block-Based Content System
- Her content piece bir "block" olarak saklanır
- Blocks nested olabilir (parent-child relationship)
- Her block type özelleştirilebilir props içerir
- Atomic operations ile güncellenir

### 2. Workspace Hierarchy
```
Workspace (Çalışma Alanı)
├── Members (Kullanıcılar)
├── Pages (Sayfalar)
│   ├── Blocks (İçerik blokları)
│   └── Comments (Yorumlar)
```

### 3. Multi-Tenancy
- Her workspace izole edilmiştir
- User role-based access control
- Workspace-specific data separation

## 🔒 Security Architecture

### Authentication
- JWT based stateless authentication
- Access tokens (15 min expiration)
- Refresh tokens (7 days expiration)
- Password hashing (bcrypt)

### Authorization
- Role-based access control (RBAC)
- Workspace-level permissions
- Resource-level guards

### Data Protection
- SQL injection prevention (Prisma)
- XSS protection (React)
- CSRF protection (Next.js)
- Input validation (class-validator)

## 📊 Data Models

### User Management
- Users, Sessions
- Workspace membership
- Role-based permissions

### Content Management
- Pages (nested hierarchy)
- Blocks (flexible content)
- Comments (collaboration)

### Organization
- Workspaces
- Projects (future)
- Tags/Categories (future)

## 🚀 Performance Considerations

### Database Optimization
- Indexed queries on frequently accessed fields
- Efficient joins with proper relations
- Query optimization with Prisma

### Frontend Optimization
- React Query caching
- Code splitting (Next.js automatic)
- Image optimization (Next.js Image)
- Lazy loading components

### API Design
- RESTful conventions
- Proper HTTP status codes
- Consistent response format
- Rate limiting (future)

## 🔄 Development Workflow

### Local Development
```bash
# Backend
cd server
npm run start:dev  # Hot reload

# Frontend
cd client
npm run dev        # Next.js dev server
```

### Database Operations
```bash
cd server
npx prisma studio          # Visual database browser
npx prisma migrate dev      # Create migration
npx prisma generate         # Generate Prisma Client
```

### Testing
```bash
# Backend tests
cd server
npm run test               # Unit tests
npm run test:e2e          # End-to-end tests

# Frontend tests (future)
cd client
npm run test              # Jest tests
```

## 📝 API Documentation Standards

All endpoints must follow these conventions:

### Request Format
```typescript
// POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe"
}
```

### Response Format
```typescript
// Success Response
{
  "data": { /* response data */ },
  "success": true,
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## 🎯 Next Implementation Steps

1. **Auth System** - JWT authentication
2. **Workspace API** - Workspace management
3. **Page System** - Page CRUD operations
4. **Block System** - Core content management
5. **Frontend Auth** - Login/Register UI
6. **Editor UI** - Block-based editor

---

*For detailed implementation guides, see specific documentation files.*
