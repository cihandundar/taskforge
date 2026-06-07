# 🛡️ TaskForge (Notion-Clone) Geliştirme Standartları & Kuralları

Bu belge, TaskForge projesinin teknik kalitesini ve tasarım bütünlüğünü korumak için Senior Developer rehberliğinde oluşturulmuştur.

## 🎨 Tasarım Sistemi & Estetik (Light Theme - Notion Style)
- **Renk Paleti:** Ana arka plan `bg-white` ve `bg-gray-50`. Kartlar `bg-white` ile `border-gray-200`. Vurgu renkleri `blue-600` ve `indigo-600`.
- **Modern Minimal:** Notion tarzı clean interface. `border-gray-200` ince borderlar ve `shadow-sm` yumuşak gölgeler.
- **Typography:** `text-gray-900` primary text, `text-gray-600` secondary text. Font: Inter veya system-ui.
- **Kenar Yuvarlaklık:** `rounded-lg` ve `rounded-xl` tercih edilmelidir.
- **Butonlar:** `bg-blue-600 hover:bg-blue-700` primary actions için. `text-gray-700 hover:bg-gray-100` secondary actions için.

## 📐 Layout & Dizilim Kuralları
- **Grid Sistemi:**
    - Dashboard ve page listelerinde `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` kullanın.
    - Responsive kademeli geçişler zorunlu.
- **Flexbox:**
    - Header, sidebar, toolbar için `flex items-center justify-between` kullanın.
    - Vertical spacing için `flex flex-col gap-4` tercih edin.
- **Sidebar:**
    - Fixed sidebar `w-64` veya `w-72` genişliğinde
    - `border-r border-gray-200` ile ayrım
    - Page tree structure için nested lists

## 🛠️ Teknik Standartlar (Frontend - Next.js 16)
- **Komponent Yapısı:**
    - `client/components/editor/` - Block editor components
    - `client/components/workspace/` - Workspace UI
    - `client/components/ui/` - Reusable components
- **State Management:**
    - React Query (TanStack Query) - server state
    - Zustand veya Context API - client state
- **API İstekleri:**
    - Axios veya fetch ile API calls
    - `client/lib/api-client.ts` central API management
- **TypeScript:**
    - Strict mode enabled
    - Interface definitions for all API responses

## 🔌 API Standartları (Backend - NestJS 11)
- **Modüler Yapı:**
    - `auth/` - Authentication modülü
    - `workspaces/` - Workspace CRUD
    - `pages/` - Page management
    - `blocks/` - Block operations
    - `comments/` - Comment system
- **Controller Standards:**
    - RESTful endpoint naming
    - Consistent response format: `{ data, message, success }`
    - Proper HTTP status codes
- **Validation:**
    - class-validator for DTOs
    - Proper error handling

## 🎯 Block-Based Editor Kuralları
- **Block Types:**
    - PARAGRAPH, HEADING_1-3, QUOTE, CODE
    - BULLETED_LIST, NUMBERED_LIST, TO_DO
    - IMAGE, VIDEO, FILE
    - DIVIDER, TABLE_VIEW, BOARD_VIEW
- **Content Storage:**
    - JSON formatında rich text content
    - Block props database'de JSON field olarak saklanır
- **Positioning:**
    - `position` field ile ordering
    - Nested blocks için parent-child relationship

## 🚀 Yol Haritası (Sıradaki Adımlar)
1. **[x] Database Setup:** PostgreSQL + Prisma ile Notion-like schema
2. **[ ] Auth System:** JWT authentication ve user management
3. **[ ] Workspace API:** Workspace ve member management
4. **[ ] Page API:** Page CRUD ve hierarchy
5. **[ ] Block System:** Block creation, editing, reordering
6. **[ ] Editor UI:** React-based block editor
7. **[ ] Real-time:** WebSocket ile collaboration

## 🎨 UI Component Priorities
1. **LoginPage/RegisterPage** - Clean, centered forms
2. **Dashboard** - Workspace listesi ve recent pages
3. **Sidebar** - Page tree navigation
4. **Editor** - Block-based content editor
5. **PageList** - Grid veya list view

---
*Bu kurallar TaskForge'un profesyonel Notion-clone standartlarda kalmasını sağlar. Her yeni özellik bu kurallara göre denetlenmelidir.*
