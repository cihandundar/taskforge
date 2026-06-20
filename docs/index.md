# TaskForge Documentation

Welcome to TaskForge documentation. TaskForge is a Notion-like collaborative workspace application with real-time editing capabilities.

---

## 📚 Documentation Index

### Getting Started

1. **[Setup Guide](./setup.md)**
   Development environment kurulumu ve ilk adımlar

2. **[Architecture Overview](./architecture.md)**
   Proje mimarisi, tech stack, ve genel yapı

### Core Documentation

3. **[API Documentation](./api.md)**
   RESTful API endpointleri, request/response formatları

4. **[Database Documentation](./database.md)**
   Database şeması, ilişkiler, query örnekleri

5. **[Authentication](./auth.md)**
   JWT auth sistemi, token yönetimi, guards

6. **[Frontend Architecture](./frontend.md)**
   Next.js yapısı, component'ler, hooks

7. **[WebSocket / Real-time](./websocket.md)**
   Socket.IO gateway, events, room management

8. **[Calendar & Sites](./calendar-sites.md)**
   Takvim notları ve site yönetimi özellikleri

---

## 🎯 Key Features

- **Block-based Editor** - Notion-like flexible content editing
- **Real-time Collaboration** - WebSocket ile anlık güncellemeler
- **Workspace Management** - Çalışma alanları ve page hiyerarşisi
- **Calendar Integration** - Takvim notları ve site yönetimi
- **JWT Authentication** - Secure token-based auth
- **Role-based Access** - Workspace member rolleri

---

## 🏗️ Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **Socket.IO Client** - WebSocket client
- **Axios** - HTTP client
- **TypeScript** - Type safety

### Backend
- **NestJS 11** - Node.js framework
- **Prisma 7** - Database ORM
- **PostgreSQL 16** - Database
- **Socket.IO** - WebSocket server
- **JWT** - Authentication
- **class-validator** - Validation

---

## 📁 Project Structure

```
taskforge/
├── client/           # Next.js Frontend
│   ├── app/          # App Router pages
│   ├── components/   # React components
│   ├── hooks/        # Custom hooks
│   └── lib/          # Utilities
│
├── server/           # NestJS Backend
│   ├── src/
│   │   ├── auth/     # Authentication
│   │   ├── workspaces/ # Workspace management
│   │   ├── pages/    # Page operations
│   │   ├── blocks/   # Block system
│   │   ├── calendar/ # Calendar features
│   │   ├── sites/    # Site management
│   │   └── websocket/ # Real-time updates
│   └── prisma/       # Database schema
│
└── docs/             # Documentation (this folder)
```

---

## 🚀 Quick Start

```bash
# Clone repository
git clone <repo-url>
cd taskforge

# Start PostgreSQL
docker-compose up -d

# Setup Backend
cd server
npm install
npx prisma migrate deploy
npm run start:dev

# Setup Frontend (new terminal)
cd client
npm install
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Prisma Studio: http://localhost:5555

---

## 📖 Reading Guide

### For New Developers
1. Start with [Setup Guide](./setup.md) to get your environment ready
2. Read [Architecture Overview](./architecture.md) to understand the system
3. Check [API Documentation](./api.md) to understand available endpoints

### For Frontend Developers
1. [Frontend Architecture](./frontend.md) - Component structure and patterns
2. [API Documentation](./api.md) - Available API endpoints
3. [WebSocket Documentation](./websocket.md) - Real-time features

### For Backend Developers
1. [Architecture Overview](./architecture.md) - Overall system design
2. [Database Documentation](./database.md) - Schema and relations
3. [Authentication](./auth.md) - Auth system details
4. [API Documentation](./api.md) - Endpoint specifications
5. [WebSocket Documentation](./websocket.md) - Real-time architecture

---

## 🔗 External Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Socket.IO Docs](https://socket.io/docs/v4/)

---

## 🤝 Contributing

When adding new features:

1. Update relevant documentation
2. Add API endpoints to [api.md](./api.md)
3. Update database schema in [database.md](./database.md)
4. Document new components in [frontend.md](./frontend.md)

---

*Generated for TaskForge v1.0.0*
