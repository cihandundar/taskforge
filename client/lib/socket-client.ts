import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

// Cookie names matching api-client.ts
const COOKIE_NAMES = {
  ACCESS: 'taskforge_access_token',
  REFRESH: 'taskforge_refresh_token',
  USER: 'taskforge_user',
};

// WebSocket URL
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

// Token management
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return Cookies.get(COOKIE_NAMES.ACCESS) || localStorage.getItem('accessToken');
};

interface SocketCallbacks {
  onUserJoined?: (data: { userId: string; userName: string; userAvatar?: string; socketId: string }) => void;
  onUserLeft?: (data: { userId: string; socketId: string }) => void;
  onBlockCreated?: (data: any) => void;
  onBlockUpdated?: (data: any) => void;
  onBlockDeleted?: (data: any) => void;
  onBlocksReordered?: (data: any) => void;
  onUserTyping?: (data: { userId: string; userName: string; userAvatar?: string; blockId: string; isTyping: boolean }) => void;
  onRoomUsers?: (users: any[]) => void;
  onConflictDetected?: (data: { blockId: string; message: string }) => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
  onError?: (error: any) => void;
}

class SocketClient {
  private socket: Socket | null = null;
  private currentPageId: string | null = null;
  private callbacks: SocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(pageId: string, callbacks?: SocketCallbacks): void {
    if (this.socket?.connected && this.currentPageId === pageId) {
      return; // Already connected to this page
    }

    // Update callbacks
    if (callbacks) {
      this.callbacks = callbacks;
    }

    // Disconnect existing connection if page changed
    if (this.socket && this.currentPageId !== pageId) {
      this.leavePage();
      this.socket.disconnect();
      this.socket = null;
    }

    const token = getToken();
    if (!token) {
      console.warn('[SocketClient] No auth token available');
      return;
    }

    // Create new socket connection
    this.socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.currentPageId = pageId;

    // Setup event listeners
    this.setupEventListeners();

    // Connect and join room
    this.socket.connect();
    this.joinPage(pageId);
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[SocketClient] Connected', this.socket?.id);
      this.reconnectAttempts = 0;
      if (this.currentPageId) {
        this.joinPage(this.currentPageId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketClient] Disconnected');
      this.callbacks.onDisconnect?.();
    });

    this.socket.on('reconnect', () => {
      console.log('[SocketClient] Reconnected');
      this.callbacks.onReconnect?.();
      if (this.currentPageId) {
        this.joinPage(this.currentPageId);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketClient] Connection error:', error);
      this.callbacks.onError?.(error);
    });

    // Room events
    this.socket.on('user:joined', (data) => {
      console.log('[SocketClient] User joined:', data);
      this.callbacks.onUserJoined?.(data);
    });

    this.socket.on('user:left', (data) => {
      console.log('[SocketClient] User left:', data);
      this.callbacks.onUserLeft?.(data);
    });

    this.socket.on('room:users', (users) => {
      console.log('[SocketClient] Room users:', users);
      this.callbacks.onRoomUsers?.(users);
    });

    // Block events
    this.socket.on('block:created', (data) => {
      console.log('[SocketClient] Block created:', data);
      this.callbacks.onBlockCreated?.(data);
    });

    this.socket.on('block:updated', (data) => {
      console.log('[SocketClient] Block updated:', data);
      this.callbacks.onBlockUpdated?.(data);
    });

    this.socket.on('block:deleted', (data) => {
      console.log('[SocketClient] Block deleted:', data);
      this.callbacks.onBlockDeleted?.(data);
    });

    this.socket.on('blocks:reordered', (data) => {
      console.log('[SocketClient] Blocks reordered:', data);
      this.callbacks.onBlocksReordered?.(data);
    });

    // Typing events
    this.socket.on('user:typing', (data) => {
      // console.log('[SocketClient] User typing:', data);
      this.callbacks.onUserTyping?.(data);
    });

    // Conflict events
    this.socket.on('conflict:detected', (data) => {
      console.warn('[SocketClient] Conflict detected:', data);
      this.callbacks.onConflictDetected?.(data);
    });
  }

  joinPage(pageId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('[SocketClient] Cannot join page: not connected');
      return;
    }

    this.socket.emit('page:join', { pageId });
  }

  leavePage(): void {
    if (!this.socket || !this.currentPageId) return;

    this.socket.emit('page:leave', { pageId: this.currentPageId });
    this.currentPageId = null;
  }

  emitCreateBlock(data: any): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('block:create', data);
  }

  emitUpdateBlock(data: any): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('block:update', data);
  }

  emitDeleteBlock(data: any): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('block:delete', data);
  }

  emitTypingStart(pageId: string, blockId: string): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('typing:start', { pageId, blockId });
  }

  emitTypingStop(pageId: string, blockId: string): void {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('typing:stop', { pageId, blockId });
  }

  disconnect(): void {
    if (this.socket) {
      this.leavePage();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentPageId = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentPageId(): string | null {
    return this.currentPageId;
  }
}

// Export singleton instance
export const socketClient = new SocketClient();
