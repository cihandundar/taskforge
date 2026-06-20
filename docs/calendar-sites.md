# TaskForge - Calendar & Sites Documentation

## 📅 Calendar & Sites Overview

TaskForge, takvim notları ve site yönetimi özellikleri sunar. Bu özellikler kullanıcıların günlük notlarını takip etmesine ve site/project bazlı organize etmesine olanak sağlar.

---

## 🎯 Features

### Calendar Notes
- Tarih bazlı not yönetimi
- Renk kodlaması (5 farklı renk)
- Site ile ilişkilendirme (opsiyonel)
- Aylık görünümlü takvim arayüzü

### Site Management
- Site/proje oluşturma
- URL atama
- Renk kodlaması
- Aktif/pasif durumu
- Calendar note ile ilişkilendirme

---

## 🗄️ Database Schema

### Site Model

```prisma
model Site {
  id          String   @id @default(cuid())
  name        String
  url         String
  color       String   @default("blue")
  isActive    Boolean  @default(true)

  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  notes       CalendarNote[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}
```

### CalendarNote Model

```prisma
model CalendarNote {
  id        String   @id @default(cuid())
  date      String   // Format: YYYY-MM-DD
  note      String   @db.Text
  color     String   @default("blue")

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  siteId    String?
  site      Site?    @relation(fields: [siteId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([date])
  @@index([userId])
  @@index([siteId])
}
```

---

## 🎨 Color Options

Hem Site hem CalendarNote için 5 renk seçeneği:

| Color | Hex Value | Usage |
|-------|-----------|-------|
| `blue` | #3B82F6 | Default, production |
| `green` | #22C55E | Success, staging |
| `yellow` | #EAB308 | Warning, development |
| `red` | #EF4444 | Critical, hotfix |
| `purple` | #A855F7 | Feature, experimental |

---

## 📡 API Endpoints

### Site Endpoints

#### GET /sites
Kullanıcının sitelerini listeler.

```http
GET /api/sites
Authorization: Bearer <token>
```

**Response:**
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
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /sites
Yeni site oluşturur.

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

**Validation Rules:**
- `name`: 1-100 characters
- `url`: Valid URL format
- `color`: Must be one of: blue, green, yellow, red, purple

#### PATCH /sites/:id
Site günceller.

```http
PATCH /api/sites/clx999iii
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production Server",
  "isActive": false
}
```

#### DELETE /sites/:id
Site siler.

```http
DELETE /api/sites/clx999iii
Authorization: Bearer <token>
```

### Calendar Note Endpoints

#### GET /calendar/notes
Calendar notlarını getirir.

```http
GET /api/calendar/notes?startDate=2024-01-01&endDate=2024-01-31&siteId=clx999iii
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `siteId` (optional): Filter by site

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx777ggg",
      "date": "2024-01-15",
      "note": "Deployed v2.0",
      "color": "green",
      "userId": "clx123abc",
      "siteId": "clx999iii",
      "site": {
        "id": "clx999iii",
        "name": "Production",
        "color": "green"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /calendar/notes
Yeni calendar note oluşturur.

```http
POST /api/calendar/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-20",
  "note": "Release v3.0 planned",
  "color": "blue",
  "status": "todo",
  "siteId": "clx999iii"
}
```

**Validation Rules:**
- `date`: Valid date format (YYYY-MM-DD)
- `note`: 1-10000 characters
- `color`: Must be one of: blue, green, yellow, red, purple
- `status`: Must be one of: todo, in_progress, completed, cancelled
- `siteId`: Must belong to current user if provided

**Status Options:**
- `todo` - Başlamadı (○)
- `in_progress` - Devam Ediyor (◑)
- `completed` - Tamamlandı (●)
- `cancelled` - İptal (⊘)

#### PATCH /calendar/notes/:id
Calendar note günceller.

```http
PATCH /api/calendar/notes/clx888hhh
Authorization: Bearer <token>
Content-Type: application/json

{
  "note": "Updated release notes",
  "color": "yellow",
  "status": "in_progress"
}
```

#### DELETE /calendar/notes/:id
Calendar note siler.

```http
DELETE /api/calendar/notes/clx888hhh
Authorization: Bearer <token>
```

---

## 💻 Frontend Components

### Large Calendar (`components/calendar/large-calendar.tsx`)

Full-screen calendar dashboard component.

**Props:**
```typescript
interface LargeCalendarProps {
  userId: string;
  sites?: Site[];
  onNoteClick?: (note: CalendarNote) => void;
  onDateClick?: (date: Date) => void;
}
```

**Features:**
- Monthly navigation
- Day cell rendering with notes
- Color-coded notes
- Site filtering
- Add/edit note modal
- Team view mode (tüm kullanıcı notları)

**Usage:**
```tsx
import { LargeCalendar } from '@/components/calendar/large-calendar';

function Dashboard() {
  const { user } = useAuth();

  return (
    <LargeCalendar
      userId={user.id}
      sites={user.sites}
      onNoteClick={(note) => console.log('Clicked:', note)}
    />
  );
}
```

### Site Selector (`components/site/site-selector.tsx`)

Site selection component for calendar notes.

**Props:**
```typescript
interface SiteSelectorProps {
  sites: Site[];
  selectedSite?: Site | null;
  onSelect: (site: Site | null) => void;
  allowNone?: boolean;
}
```

**Features:**
- Site list display
- Color indicators
- Active/inactive states
- "No site" option

---

## 🪝 Frontend Hooks

### useSites (`hooks/useSites.ts`)

Site management operations hook.

```typescript
const {
  sites,
  isLoading,
  error,
  createSite,
  updateSite,
  deleteSite,
  refetch
} = useSites();

// Create new site
await createSite({
  name: 'Production',
  url: 'https://example.com',
  color: 'green'
});
```

### useCalendarNotes (future)

Calendar note operations hook.

```typescript
const {
  notes,
  isLoading,
  createNote,
  updateNote,
  deleteNote,
  getNotesByDateRange
} = useCalendarNotes();

// Get notes for month
const monthlyNotes = getNotesByDateRange(startDate, endDate);
```

---

## 🎨 UI Patterns

### Calendar Day Cell

```tsx
// Day cell component structure
<div className="calendar-day-cell">
  <span className="day-number">15</span>

  {/* Notes for this day */}
  <div className="day-notes">
    {notes.map(note => (
      <div
        key={note.id}
        className={`note-item note-${note.color}`}
        onClick={() => onNoteClick(note)}
      >
        <span className="note-text">{note.note}</span>
        {note.site && (
          <span className="note-site">{note.site.name}</span>
        )}
      </div>
    ))}
  </div>
</div>
```

### Site Card

```tsx
<div className="site-card site-{site.color}">
  <div className="site-icon">
    <GlobeIcon className="w-5 h-5" />
  </div>
  <div className="site-info">
    <h3>{site.name}</h3>
    <a href={site.url} target="_blank">{site.url}</a>
  </div>
  <div className="site-actions">
    <button onClick={() => onEdit(site)}>Edit</button>
    <button onClick={() => onDelete(site)}>Delete</button>
  </div>
</div>
```

---

## 🔄 User Flow Examples

### Creating a Calendar Note

1. User clicks on a date in calendar
2. Modal opens with date pre-filled
3. User enters note text
4. Optional: Select site from dropdown
5. Select color
6. Submit → POST /api/calendar/notes
7. Calendar updates with new note

### Creating a Site

1. User clicks "Add Site" button
2. Modal opens
3. User enters:
   - Site name (required)
   - Site URL (required)
   - Color selection
4. Submit → POST /api/sites
5. Site appears in dropdown and calendar

### Filtering by Site

1. User selects site from filter dropdown
2. Frontend calls: GET /api/calendar/notes?siteId=xxx
3. Calendar shows only notes for that site
4. "All sites" option shows all notes

---

## 🔐 Authorization Rules

### Sites
- **CREATE**: Any authenticated user
- **READ**: Only owner's sites
- **UPDATE**: Only owner
- **DELETE**: Only owner

### Calendar Notes
- **CREATE**: Any authenticated user (for own userId)
- **READ**: Only own notes (unless team view enabled)
- **UPDATE**: Only owner
- **DELETE**: Only owner

### Site Association
- Calendar note can only be associated with sites owned by the same user
- `siteId` validation in service layer

---

## 🎯 Use Cases

### 1. Deployment Tracking
```typescript
// Create deployment note
await createNote({
  date: '2024-01-15',
  note: 'Deployed v2.0.3 - Fixed login bug',
  color: 'green',
  status: 'completed',
  siteId: productionSiteId
});
```

### 2. Incident Management
```typescript
// Create incident note
await createNote({
  date: '2024-01-20',
  note: 'Server downtime - 30min outage',
  color: 'red',
  status: 'in_progress',
  siteId: productionSiteId
});
```

### 3. Release Planning
```typescript
// Create release note
await createNote({
  date: '2024-02-01',
  note: 'Planned v3.0 release',
  color: 'blue',
  status: 'todo',
  siteId: null // General planning
});
```

### 4. Daily Standup Notes
```typescript
// Create daily note
await createNote({
  date: new Date().toISOString().split('T')[0],
  note: 'Standup: Worked on auth flow, blocked on API',
  color: 'yellow',
  status: 'completed'
});
```

---

## 📊 Team View Mode

Calendar supports team view where users can see all users' notes:

### Backend Changes Needed

```typescript
// GET /api/calendar/notes/team?startDate=xxx&endDate=xxx
@Get('team')
async getTeamNotes(
  @Query('startDate') startDate: string,
  @Query('endDate') endDate: string,
  @CurrentUser() user: User
) {
  // Get notes from all users in user's workspaces
  return this.calendarService.getTeamNotes(user.id, startDate, endDate);
}
```

### Frontend Display

```tsx
// Display with user attribution
<div className="calendar-note">
  <span className="note-color-indicator" style={{ background: note.color }} />
  <span className="note-text">{note.note}</span>
  <span className="note-author">{note.user.name}</span>
  {note.site && <span className="note-site">{note.site.name}</span>}
</div>
```

---

## 🚀 Future Enhancements

1. **Recurring Notes**
   - Daily, weekly, monthly patterns
   - Reminder notifications

2. **Note Categories**
   - Deployments, incidents, planning, etc.
   - Category-based filtering

3. **Rich Text Notes**
   - Markdown support
   - Code snippets
   - Attachments

4. **Export/Import**
   - Export calendar as CSV/PDF
   - Import from other calendars

5. **Reminders**
   - Email notifications
   - In-app notifications

6. **Analytics**
   - Deployment frequency
   - Incident trends
   - Site activity reports

---

*For implementation details, see:*
- `server/src/calendar/` - Backend calendar service
- `server/src/sites/` - Backend sites service
- `client/components/calendar/` - Frontend calendar UI
- `client/hooks/useSites.ts` - Sites hook
