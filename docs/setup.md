# TaskForge - Development Setup Guide

## 🚀 Quick Start

TaskForge projesini local geliştirme ortamında kurmak için bu rehberi takip edin.

---

## 📋 Prerequisites

Geliştirme ortamınızda aşağıların kurulu olduğundan emin olun:

- **Node.js** 20.x veya üzeri
- **npm** veya **yarn** veya **pnpm**
- **PostgreSQL** 16 veya Docker
- **Git**

### Version Check
```bash
node --version  # v20.x.x
npm --version   # 10.x.x
git --version   # 2.x.x
```

---

## 📦 Project Setup

### 1. Repository'yi Clone Edin

```bash
git clone <repository-url>
cd taskforge
```

### 2. Docker ile PostgreSQL Başlatın (Önerilen)

```bash
# Docker ile PostgreSQL başlat
docker-compose up -d

# PostgreSQL hazır olana kadar bekle
docker-compose logs -f postgres
```

**Veya manuel PostgreSQL kurulumu:**
```bash
# PostgreSQL 16 kur
# Veritabanı oluştur
createdb taskforge

# .env dosyasında DATABASE_URL ayarla
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskforge"
```

### 3. Backend Setup

```bash
cd server

# Dependencies kur
npm install

# Environment variables oluştur
cp .env.example .env
```

**`.env` dosyasını düzenleyin:**
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskforge?schema=public"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# Frontend URL (CORS için)
FRONTEND_URL="http://localhost:3000"
```

```bash
# Prisma migrations çalıştır
npx prisma migrate deploy

# Prisma client generate et
npx prisma generate

# Development server başlat
npm run start:dev
```

Backend **http://localhost:3001** adresinde çalışacaktır.

### 4. Frontend Setup

Yeni terminal açın:

```bash
cd client

# Dependencies kur
npm install

# Environment variables oluştur
cp .env.example .env
```

**`.env` dosyasını düzenleyin:**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_WS_URL="http://localhost:3001"
```

```bash
# Development server başlat
npm run dev
```

Frontend **http://localhost:3000** adresinde çalışacaktır.

---

## 🗄️ Database Setup

### Prisma Migrations

```bash
cd server

# Yeni migration oluştur (schema değişikliği sonrası)
npx prisma migrate dev --name describe_your_changes

# Production için migration
npx prisma migrate deploy

# Database'i sıfırla (development only!)
npx prisma migrate reset
```

### Prisma Studio (Database GUI)

```bash
cd server
npx prisma studio
```

**http://localhost:5555** adresinde database görsel editörü açılır.

---

## 🧪 Testing

### Backend Tests

```bash
cd server

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test -- --watch
```

### Frontend Tests (Future)

```bash
cd client

# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

---

## 🛠️ Development Tools

### Prisma Commands

```bash
# Prisma Studio (GUI)
npx prisma studio

# Schema validation
npx prisma validate

# Format schema
npx prisma format

# Reset database
npx prisma migrate reset
```

### Useful Scripts

```bash
# Backend
npm run start:dev     # Hot reload
npm run start:debug   # Debug mode
npm run start:prod    # Production build
npm run lint          # ESLint

# Frontend
npm run dev           # Next.js dev server
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint
```

---

## 🐳 Docker Development

### Full Docker Setup

Tüm stack'i Docker ile çalıştırabilirsiniz:

```bash
# Tüm servisleri başlat
docker-compose up -d

# Logs görüntüle
docker-compose logs -f

# Stop
docker-compose down

# Volume'ları temizle
docker-compose down -v
```

---

## 🔧 Troubleshooting

### Database Connection Issues

**Problem:** `Can't reach database server`

**Solutions:**
1. PostgreSQL'in çalıştığından emin olun:
   ```bash
   docker ps  # Docker ile kullanıyorsanız
   # veya
   pg_isready -h localhost -p 5432
   ```

2. `DATABASE_URL` doğru ayarlandığından emin olun

3. PostgreSQL'e manuel bağlanmayı deneyin:
   ```bash
   psql postgresql://postgres:postgres@localhost:5432/taskforge
   ```

### Migration Issues

**Problem:** Migration hatası

**Solutions:**
1. Migration'i resetleyin:
   ```bash
   npx prisma migrate reset
   ```

2. Migration history'i silin ve tekrar oluşturun:
   ```bash
   # Prüden silmeyin! Sadece development
   rm -rf prisma/migrations/*
   npx prisma migrate dev --name init
   ```

### Port Conflicts

**Problem:** Port 3000 veya 3001 kullanımda

**Solutions:**
1. Kullanan uygulamayı bulun ve kapatın
2. Veya farklı port kullanın:
   ```bash
   # Backend
   PORT=3002 npm run start:dev

   # Frontend
   PORT=3001 npm run dev
   ```

### CORS Issues

**Problem:** Frontend backend'e bağlanamıyor

**Solutions:**
1. `.env` dosyasında `FRONTEND_URL` doğru ayarlandığından emin olun
2. Backend CORS configuration kontrol edin:
   ```typescript
   // main.ts
   app.enableCors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   });
   ```

---

## 📝 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskforge?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"

# Optional: Redis (for future WebSocket scaling)
# REDIS_URL="redis://localhost:6379"
```

### Frontend (.env.local)

```env
# API Endpoints
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_WS_URL="http://localhost:3001"
```

---

## 🏗️ Project Structure Reference

```
taskforge/
├── server/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── workspaces/    # Workspace management
│   │   ├── pages/         # Page operations
│   │   ├── blocks/        # Block system
│   │   ├── comments/      # Comment system
│   │   ├── calendar/      # Calendar features
│   │   ├── sites/         # Site management
│   │   ├── websocket/     # WebSocket gateway
│   │   ├── common/        # Shared utilities
│   │   └── main.ts        # Entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Migration files
│   ├── test/              # E2E tests
│   └── .env               # Environment variables
│
├── client/                # Next.js Frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   └── .env.local         # Environment variables
│
├── docs/                  # Documentation
├── docker-compose.yml     # Docker services
└── README.md
```

---

## 🔄 Resetting Development Environment

Tüm development environment'i sıfırlamak için:

```bash
# 1. Stop all services
docker-compose down

# 2. Remove volumes (deletes database!)
docker-compose down -v

# 3. Clean node_modules (optional)
rm -rf server/node_modules client/node_modules

# 4. Reinstall dependencies
cd server && npm install
cd ../client && npm install

# 5. Restart services
docker-compose up -d

# 6. Run migrations
cd server
npx prisma migrate deploy
npx prisma generate
```

---

## 📚 Useful Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🆘 Getting Help

Sorun yaşarsanız:

1. **Check logs:**
   ```bash
   # Backend logs
   npm run start:dev

   # Frontend logs
   npm run dev

   # Docker logs
   docker-compose logs -f
   ```

2. **Check documentation:**
   - `docs/architecture.md` - Architecture overview
   - `docs/api.md` - API endpoints
   - `docs/database.md` - Database schema

3. **Check GitHub Issues:**
   - Known issues ve solutions

---

## ✅ Verification

Development setup doğru çalıştığını doğrulamak için:

### 1. Backend Check
```bash
curl http://localhost:3001/api
# Should return: {"message":"TaskForge API"}
```

### 2. Frontend Check
Browser'da **http://localhost:3000** açın ve landing page'i görün.

### 3. Database Check
```bash
cd server
npx prisma studio
# Browser'da http://localhost:5555 açın ve database'i görün
```

### 4. WebSocket Check
Browser console'da:
```javascript
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected!'));
```

---

Happy coding! 🚀
