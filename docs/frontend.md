# TaskForge - Frontend Architecture

## 🎨 Frontend Overview

TaskForge frontend'i Next.js 16 (App Router) kullanarak geliştirilmiştir. React 19 ve TypeScript ile modern, type-safe bir uygulama sağlar.

### Tech Stack

- **Framework:** Next.js 16.2.7 (App Router)
- **UI Library:** React 19.2.4
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript 5
- **State Management:** React Query + custom hooks
- **HTTP Client:** Axios
- **Rich Text:** Custom block-based editor
- **Icons:** Lucide React

---

## 📁 Project Structure

```
client/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Auth routes group
│   │   ├── login/
│   │   │   └── page.tsx      # Login page
│   │   └── register/
│   │       └── page.tsx      # Register page
│   ├── dashboard/             # Dashboard routes
│   │   ├── page.tsx          # Dashboard home (workspace list)
│   │   └── workspace/
│   │       └── [id]/
│   │           ├── page.tsx  # Workspace view (page list)
│   │           └── page/
│   │               └── [pageId]/
│   │                   └── page.tsx  # Page editor
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
│
├── components/                # React components
│   ├── auth/                 # Authentication components
│   │   ├── login-form.tsx    # Login form
│   │   └── register-form.tsx # Register form
│   ├── calendar/             # Calendar components
│   │   └── large-calendar.tsx # Full-screen calendar
│   ├── layout/               # Layout components
│   │   ├── header.tsx       # Top navigation
│   │   └── sidebar.tsx      # Workspace sidebar
│   ├── editor/               # Block editor components
│   │   ├── block-editor.tsx # Main editor
│   │   ├── block-renderer.tsx # Block display
│   │   └── blocks/           # Individual block types
│   └── site/                 # Site management components
│
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts            # Authentication hook
│   └── useSites.ts           # Site management hook
│
├── lib/                       # Utilities
│   ├── api-client.ts         # Axios instance
│   └── utils.ts              # Helper functions
│
├── types/                     # TypeScript types
│   └── index.ts              # Shared types
│
├── public/                    # Static assets
└── package.json
```

---

## 🎯 Key Components

### Layout Components

#### Header (`components/layout/header.tsx`)
Top navigation bar. User info ve logout içerir.

**Features:**
- User avatar ve name display
- Logout button
- Workspace breadcrumb (optional)

#### Sidebar (`components/layout/sidebar.tsx`)
Workspace ve page navigation.

**Features:**
- Workspace list
- Page list within workspace
- Create new workspace/page actions
- Active state highlighting

### Authentication Components

#### Login Form (`components/auth/login-form.tsx`)
User login form.

**State:**
- Email, password inputs
- Loading state
- Error display

**Actions:**
- Validates input
- Calls `/api/auth/login`
- Stores tokens
- Redirects to dashboard

#### Register Form (`components/auth/register-form.tsx`)
User registration form.

**State:**
- Name, email, password inputs
- Password confirmation
- Loading state

**Actions:**
- Validates password strength
- Calls `/api/auth/register`
- Auto-login after success

### Editor Components

#### Block Editor (`components/editor/block-editor.tsx`)
Main content editor component.

**Features:**
- Block list rendering
- Drag-and-drop reordering
- Add new block button
- Block type selector
- Real-time updates via WebSocket

**Props:**
```typescript
interface BlockEditorProps {
  pageId: string;
  blocks: Block[];
  onUpdate: (blocks: Block[]) => void;
  readOnly?: boolean;
}
```

#### Block Renderer (`components/editor/block-renderer.tsx`)
Individual block display component.

**Features:**
- Type-specific rendering
- Content editing
- Props customization
- Child block rendering

**Block Types:**
- `PARAGRAPH` - Simple text
- `HEADING_1/2/3` - Headings
- `BULLETED_LIST` - Bullet list
- `NUMBERED_LIST` - Numbered list
- `TO_DO` - Checkbox
- `QUOTE` - Quote block
- `CODE` - Code block with syntax
- `IMAGE` - Image embed
- `DIVIDER` - Horizontal line

### Calendar Components

#### Large Calendar (`components/calendar/large-calendar.tsx`)
Full-screen calendar dashboard.

**Features:**
- Monthly view navigation
- Day cell rendering with notes
- Site-specific note filtering
- Add/edit note modal
- Color coding

**Props:**
```typescript
interface LargeCalendarProps {
  userId: string;
  sites?: Site[];
}
```

### Site Components

#### Site Selector (`components/site/site-selector.tsx`)
Site selection for calendar notes.

**Features:**
- Site list display
- Active/inactive states
- Color indicators
- Create new site

---

## 🪝 Custom Hooks

### useAuth (`hooks/useAuth.ts`)
Authentication state ve operations.

**Returns:**
```typescript
{
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

**Features:**
- Auto token refresh on 401
- Persist auth state
- Redirect on auth failure

### useSites (`hooks/useSites.ts`)
Site management operations.

**Returns:**
```typescript
{
  sites: Site[];
  isLoading: boolean;
  createSite: (data: CreateSiteData) => Promise<void>;
  updateSite: (id: string, data: UpdateSiteData) => Promise<void>;
  deleteSite: (id: string) => Promise<void>;
}
```

### useWorkspace (future)
Workspace operations hook.

### usePages (future)
Page operations hook.

### useBlocks (future)
Block operations hook with WebSocket integration.

---

## 🌐 API Client

### Axios Instance (`lib/api-client.ts`)
Configured HTTP client for API communication.

**Features:**
- Base URL configuration
- Auto token attachment
- Token refresh on 401
- Error handling
- Type-safe responses

```typescript
// Usage
import apiClient from '@/lib/api-client';

const response = await apiClient.post('/auth/login', {
  email,
  password
});
```

---

## 📝 Pages

### Landing Page (`app/page.tsx`)
Public landing page.

**Features:**
- Hero section
- Features showcase
- CTA to register

### Login Page (`app/(auth)/login/page.tsx`)
Login form wrapper.

### Register Page (`app/(auth)/register/page.tsx`)
Registration form wrapper.

### Dashboard Home (`app/dashboard/page.tsx`)
Workspace list view.

**Features:**
- User's workspaces grid
- Create new workspace button
- Workspace cards with icon, name

### Workspace View (`app/dashboard/workspace/[id]/page.tsx`)
Page list within workspace.

**Features:**
- Breadcrumb navigation
- Page list (nested support)
- Create new page button
- Page cards with title, icon

### Page Editor (`app/dashboard/workspace/[id]/page/[pageId]/page.tsx`)
Main editor view.

**Features:**
- Page header (title, icon)
- Block editor
- Comment sidebar (future)
- Share button (future)

---

## 🎨 Styling

### Tailwind CSS Configuration

**Theme:**
- Primary colors: Blue/Indigo based
- Neutral grays for text
- Accent colors for site management

**Component Patterns:**
```tsx
// Button component pattern
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Click me
</button>

// Card pattern
<div className="p-6 bg-white rounded-lg shadow-md border">
  Content here
</div>

// Input pattern
<input
  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
  type="text"
/>
```

---

## 📡 WebSocket Integration

### Block Real-time Updates

Future implementation for collaborative editing:

```typescript
// In useBlocks hook
useEffect(() => {
  const ws = new WebSocket(`ws://localhost:3001?token=${token}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.event === 'blockUpdated') {
      updateBlockInState(data.data);
    }
  };

  return () => ws.close();
}, [token]);
```

---

## 🔐 Authentication Flow

### Protected Routes

Middleware checks auth state:

```typescript
// In layout or page component
const { user, isLoading } = useAuth();

if (isLoading) return <LoadingSpinner />;
if (!user) redirect('/login');
```

### Token Refresh

Auto-refresh on expiry:

```typescript
// In api-client.ts
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axios(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

---

## 🚀 Performance Optimizations

### Code Splitting
- Automatic with Next.js App Router
- Dynamic imports for heavy components

### Image Optimization
```tsx
import Image from 'next/image';

<Image
  src="/avatar.png"
  alt="Avatar"
  width={32}
  height={32}
/>
```

### Caching Strategy
- React Query for API caching
- SWR pattern for data fetching
- Optimistic updates for block operations

---

## 🧪 Testing (Future)

### Component Tests
```typescript
// Example
import { render, screen } from '@testing-library/react';
import { LoginForm } from './login-form';

test('renders login form', () => {
  render(<LoginForm />);
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
});
```

### E2E Tests
- Playwright or Cypress for full user flows
- Critical path testing (login → create page → edit)

---

## 📦 Build & Deployment

### Development
```bash
cd client
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 🎯 Future Enhancements

1. **Real-time Collaboration**
   - WebSocket integration
   - User cursors
   - Presence indicators

2. **Advanced Block Types**
   - Table blocks
   - Database views
   - Template blocks

3. **Mobile App**
   - React Native version
   - Offline support

4. **PWA Features**
   - Service workers
   - Offline editing
   - Push notifications

---

*For implementation details, see source code in `client/`*
