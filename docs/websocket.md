# TaskForge - WebSocket / Real-time Documentation

## 🔌 WebSocket Architecture

TaskForge, gerçek zamanlı işbirliği için Socket.IO tabanlı WebSocket kullanır. NestJS WebSocket Gateway ile implement edilmiştir.

---

## 🏗️ Architecture Overview

```
Frontend (Socket.IO Client)
    ↓ WebSocket Connection
Backend (NestJS WebSocket Gateway)
    ↓ Room Management
Socket.IO Server
    ↓ Broadcast to Room
Other Connected Clients
```

### Components

1. **WebSocket Gateway** (`server/src/websocket/websocket.gateway.ts`)
   - Socket.IO gateway implementation
   - JWT authentication for WebSocket
   - Event handlers for block operations
   - Room management for pages

2. **WebSocket Service** (`server/src/websocket/websocket.service.ts`)
   - Room user tracking
   - Broadcast logic
   - Typing indicator management

3. **JWT Auth Guard** (`server/src/websocket/guards/ws-jwt-auth.guard.ts`)
   - WebSocket authentication
   - Token validation on connection

4. **Frontend Client** (`client/`)
   - Socket.IO client integration
   - Event listeners and emitters

---

## 🔌 Connection Details

### Server URL
```
Development: ws://localhost:3001/ws
Production: wss://api.taskforge.com/ws
```

### Authentication
WebSocket connection JWT token gerektirir:

**Query Parameter:**
```typescript
const socket = io('http://localhost:3001/ws', {
  auth: {
    token: accessToken
  }
});
```

---

## 📡 Events Reference

### Client → Server Events

#### page:join
Bir sayfanın room'una katılır.

```typescript
socket.emit('page:join', {
  pageId: 'clx222bbb'
});
```

**Response (server → client):**
- `room:users` - Odadaki kullanıcılar listesi

#### page:leave
Sayfa room'undan ayrılır.

```typescript
socket.emit('page:leave', {
  pageId: 'clx222bbb'
});
```

#### block:create
Yeni block oluşturur.

```typescript
socket.emit('block:create', {
  pageId: 'clx222bbb',
  type: 'PARAGRAPH',
  content: 'New paragraph',
  position: 0,
  parentId: null
});
```

**Response (server → all clients in room):**
- `block:created` - Block oluşturuldu bildirimi

#### block:update
Block günceller.

```typescript
socket.emit('block:update', {
  id: 'clx444ddd',
  pageId: 'clx222bbb',
  content: 'Updated content',
  timestamp: '2024-01-01T00:00:00Z',
  previousContent: 'Old content'
});
```

**Response (server → all clients in room except sender):**
- `block:updated` - Block güncellendi bildirimi

#### block:delete
Block siler.

```typescript
socket.emit('block:delete', {
  id: 'clx444ddd',
  pageId: 'clx222bbb'
});
```

**Response (server → all clients in room except sender):**
- `block:deleted` - Block silindi bildirimi

#### typing:start
Typing indicator başlatır.

```typescript
socket.emit('typing:start', {
  pageId: 'clx222bbb',
  blockId: 'clx444ddd'
});
```

**Response (server → all clients in room except sender):**
- `user:typing` - Kullanıcı yazıyor bildirimi

#### typing:stop
Typing indicator durdurur.

```typescript
socket.emit('typing:stop', {
  pageId: 'clx222bbb',
  blockId: null
});
```

---

### Server → Client Events

#### block:created
Yeni block oluşturuldu.

```typescript
{
  id: 'clx555eee',
  type: 'PARAGRAPH',
  content: 'New paragraph',
  position: 0,
  authorId: 'clx123abc',
  authorName: 'John Doe',
  authorAvatar: null,
  timestamp: '2024-01-01T00:00:00Z'
}
```

#### block:updated
Block güncellendi.

```typescript
{
  id: 'clx444ddd',
  content: 'Updated content',
  updatedBy: 'clx999xxx',
  updatedByName: 'Jane Smith',
  updatedByAvatar: null,
  timestamp: '2024-01-01T00:00:00Z',
  previousContent: 'Old content'
}
```

#### block:deleted
Block silindi.

```typescript
{
  id: 'clx444ddd',
  deletedBy: 'clx123abc',
  deletedByName: 'John Doe',
  deletedByAvatar: null,
  timestamp: '2024-01-01T00:00:00Z'
}
```

#### room:users
Odadaki kullanıcılar listesi.

```typescript
[
  {
    id: 'clx123abc',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: null,
    socketId: 'abc123'
  }
]
```

#### user:joined
Yeni kullanıcı katıldı.

```typescript
{
  pageId: 'clx222bbb',
  user: {
    id: 'clx999xxx',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: null
  },
  timestamp: '2024-01-01T00:00:00Z'
}
```

#### user:left
Kullanıcı ayrıldı.

```typescript
{
  pageId: 'clx222bbb',
  userId: 'clx999xxx',
  timestamp: '2024-01-01T00:00:00Z'
}
```

#### user:typing
Kullanıcı yazıyor.

```typescript
{
  pageId: 'clx222bbb',
  userId: 'clx123abc',
  userName: 'John Doe',
  blockId: 'clx444ddd',
  timestamp: '2024-01-01T00:00:00Z'
}
```

---

## 🛡️ Authentication

### WS JWT Auth Guard

WebSocket bağlantılarında JWT doğrulaması:

```typescript
@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth.token;

    try {
      const user = this.jwtService.verify(token);
      client.data.user = user;
      return true;
    } catch {
      return false;
    }
  }
}
```

**Usage:**
```typescript
@WebSocketGateway()
@UseGuards(WsJwtAuthGuard)
export class WebsocketGateway {
  @SubscribeMessage('page:join')
  handleJoinRoom(@CurrentWsUser() user: any) {
    // user is authenticated
  }
}
```

---

## 🏠 Room Management

### Room Naming Convention

```typescript
// Format: page:{pageId}
const roomName = `page:${pageId}`;
// Example: page:clx222bbb
```

### Joining a Room

```typescript
// Server-side (Gateway)
client.join(`page:${pageId}`);

// Client-side
socket.emit('page:join', { pageId: 'clx222bbb' });
```

### Broadcasting to Room

```typescript
// Broadcast to all clients in room except sender
this.server
  .to(`page:${pageId}`)
  .emit('block:updated', blockData);

// Broadcast to all clients including sender
this.server
  .to(`page:${pageId}`)
  .emit('room:users', usersList);
```

### Leaving a Room

```typescript
// Server-side
client.leave(`page:${pageId}`);

// Client-side
socket.emit('page:leave', { pageId: 'clx222bbb' });
```

---

## 👥 User Presence

### Tracking Online Users

```typescript
// Service maintains user map
private roomUsers = new Map<string, Map<string, User>>();

joinPageRoom(socketId: string, pageId: string, user: User) {
  if (!this.roomUsers.has(pageId)) {
    this.roomUsers.set(pageId, new Map());
  }
  this.roomUsers.get(pageId).set(socketId, user);

  // Notify others
  this.server.to(`page:${pageId}`).emit('user:joined', {
    pageId,
    user,
    timestamp: new Date()
  });
}

leavePageRoom(socketId: string, pageId?: string) {
  // Remove from room and notify others
}
```

### Typing Indicators

```typescript
// Track who is typing where
private typingUsers = new Map<string, { userId: string; blockId: string }>();

updateTypingStatus(socketId: string, pageId: string, blockId: string | null) {
  if (blockId) {
    this.typingUsers.set(socketId, { userId: socketId, blockId });
  } else {
    this.typingUsers.delete(socketId);
  }

  // Broadcast to room
  this.server.to(`page:${pageId}`).emit('user:typing', {
    pageId,
    userId: socketId,
    blockId,
    timestamp: new Date()
  });
}
```

---

## 💻 Frontend Integration

### Socket Hook Example

```typescript
// client/hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export function useSocket() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      path: '/ws',
      auth: {
        token: getAccessToken()
      }
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return { socket, isConnected };
}
```

### Page Room Hook

```typescript
// client/hooks/usePageRoom.ts
import { useEffect } from 'react';
import { useSocket } from './useSocket';

export function usePageRoom(pageId: string) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !pageId) return;

    // Join room
    socket.emit('page:join', { pageId });

    // Listen for events
    const handleBlockCreated = (data) => {
      console.log('Block created:', data);
    };

    socket.on('block:created', handleBlockCreated);

    return () => {
      socket.off('block:created', handleBlockCreated);
      socket.emit('page:leave', { pageId });
    };
  }, [socket, pageId]);
}
```

---

## 🔄 Event Flow Examples

### User Creates Block

```
1. User creates block in UI
2. Frontend sends POST /api/blocks (HTTP)
3. Server saves to database
4. Frontend emits block:create (WebSocket)
5. Server broadcasts block:created to room
6. Other clients update UI with new block
```

### User Updates Block

```
1. User edits block content
2. Frontend emits typing:start
3. Other clients show "User is typing..."
4. Frontend sends PATCH /api/blocks (HTTP)
5. Server saves to database
6. Frontend emits block:update (WebSocket)
7. Server broadcasts block:updated to room
8. Other clients update block content
9. Frontend emits typing:stop
10. Typing indicator disappears
```

---

## 🚨 Error Handling

### Connection Errors

```typescript
socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);

  if (error.message.includes('Authentication failed')) {
    // Token expired, refresh and reconnect
    refreshToken().then(newToken => {
      socket.auth.token = newToken;
      socket.connect();
    });
  }
});
```

### Reconnection Strategy

```typescript
const socket = io(url, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  reconnectionDelayMax: 5000
});
```

---

## 🧪 Testing

### Unit Test Example

```typescript
describe('WebsocketGateway', () => {
  it('should handle page:join event', async () => {
    const client = await createClient();
    const pageId = 'test-page-id';

    client.emit('page:join', { pageId });

    await waitFor(() => {
      expect(client).toHaveReceivedEvent('room:users');
    });
  });
});
```

### E2E Test Example

```typescript
describe('WebSocket (e2e)', () => {
  it('should broadcast block updates', async () => {
    const client1 = await createAuthenticatedSocket();
    const client2 = await createAuthenticatedSocket();

    await client1.emit('page:join', { pageId: 'test-page' });
    await client2.emit('page:join', { pageId: 'test-page' });

    client1.emit('block:update', {
      id: 'block-1',
      pageId: 'test-page',
      content: 'Updated'
    });

    await waitFor(() => {
      expect(client2).toHaveReceivedEventWith('block:updated', {
        id: 'block-1',
        content: 'Updated'
      });
    });
  });
});
```

---

## 🔒 Security Considerations

### 1. Token Validation
- Every connection validated with JWT
- Expired tokens rejected immediately

### 2. Room Access Control
- Users can only join rooms for pages they have access to
- Server validates page permissions before room join

### 3. Event Validation
- All incoming events validated with DTOs
- Sanitization of user-generated content

### 4. Rate Limiting (Future)
- Per-user rate limit on events
- Prevent spam/abuse

---

## 📊 Performance Optimization

### 1. Selective Broadcasting
- Only send to relevant users (room-based)
- Exclude sender from update events

### 2. Batch Updates
- Debounce rapid updates from same user
- Merge multiple changes into single broadcast

### 3. Compression
- Enable Socket.IO compression for large payloads
- Minimize event data size

### 4. Connection Pooling
- Reuse connections where possible
- Clean up idle connections

---

## 🎯 Future Enhancements

1. **Conflict Resolution**
   - Operational Transformation (OT) or CRDT
   - Handle concurrent edits

2. **Presence**
   - User cursor positions
   - Selection highlighting

3. **Offline Support**
   - Queue events when offline
   - Sync on reconnect

4. **Scalability**
   - Redis adapter for multi-server
   - Load balancing support

---

*For implementation details, see source code in `server/src/websocket/`*
