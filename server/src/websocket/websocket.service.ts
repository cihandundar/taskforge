import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

export const SOCKET_IO_KEY = 'SOCKET_IO';

interface UserPresence {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  socketId: string;
  joinedAt: Date;
  typingBlockId?: string;
  lastTypingUpdate?: Date;
}

interface RoomUsers {
  [pageId: string]: {
    [socketId: string]: UserPresence;
  };
}

@Injectable()
export class WebsocketService {
  private roomUsers: RoomUsers = {};

  constructor() {}

  /**
   * Get Socket.IO server instance
   */
  getServer(): Server {
    // This will be set by the gateway
    return this[SOCKET_IO_KEY] as Server;
  }

  /**
   * Set Socket.IO server instance
   */
  setServer(server: Server): void {
    this[SOCKET_IO_KEY] = server;
  }

  /**
   * Get room name for a page
   */
  getPageRoomName(pageId: string): string {
    return `page:${pageId}`;
  }

  /**
   * Add user to room
   */
  joinPageRoom(
    socketId: string,
    pageId: string,
    user: { id: string; email: string; name: string; avatar?: string },
  ): void {
    const roomName = this.getPageRoomName(pageId);

    if (!this.roomUsers[pageId]) {
      this.roomUsers[pageId] = {};
    }

    this.roomUsers[pageId][socketId] = {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userAvatar: user.avatar,
      socketId,
      joinedAt: new Date(),
    };

    // Notify others in the room
    const server = this.getServer();
    if (server) {
      server.to(roomName).emit('user:joined', {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        socketId,
      });
    }
  }

  /**
   * Remove user from room
   */
  leavePageRoom(socketId: string, pageId?: string): UserPresence | null {
    if (pageId) {
      return this.leaveSpecificRoom(socketId, pageId);
    }

    // Leave all rooms for this socket
    for (const [roomId, users] of Object.entries(this.roomUsers)) {
      if (users[socketId]) {
        const user = users[socketId];
        delete users[socketId];

        // Clean up empty rooms
        if (Object.keys(users).length === 0) {
          delete this.roomUsers[roomId];
        }

        // Notify others
        const server = this.getServer();
        if (server) {
          server.to(this.getPageRoomName(roomId)).emit('user:left', {
            userId: user.userId,
            socketId,
          });
        }

        return user;
      }
    }

    return null;
  }

  /**
   * Leave a specific room
   */
  private leaveSpecificRoom(socketId: string, pageId: string): UserPresence | null {
    const roomName = this.getPageRoomName(pageId);

    if (!this.roomUsers[pageId] || !this.roomUsers[pageId][socketId]) {
      return null;
    }

    const user = this.roomUsers[pageId][socketId];
    delete this.roomUsers[pageId][socketId];

    // Clean up empty rooms
    if (Object.keys(this.roomUsers[pageId]).length === 0) {
      delete this.roomUsers[pageId];
    }

    // Notify others
    const server = this.getServer();
    if (server) {
      server.to(roomName).emit('user:left', {
        userId: user.userId,
        socketId,
      });
    }

    return user;
  }

  /**
   * Get all users in a room
   */
  getRoomUsers(pageId: string): UserPresence[] {
    if (!this.roomUsers[pageId]) {
      return [];
    }

    return Object.values(this.roomUsers[pageId]).map((user) => ({
      userId: user.userId,
      userName: user.userName,
      userEmail: user.userEmail,
      userAvatar: user.userAvatar,
      socketId: user.socketId,
      joinedAt: user.joinedAt,
      typingBlockId: user.typingBlockId,
      lastTypingUpdate: user.lastTypingUpdate,
    }));
  }

  /**
   * Update user typing status
   */
  updateTypingStatus(
    socketId: string,
    pageId: string,
    blockId: string | null,
  ): void {
    if (!this.roomUsers[pageId] || !this.roomUsers[pageId][socketId]) {
      return;
    }

    const user = this.roomUsers[pageId][socketId];
    const now = new Date();

    // Throttle typing updates (max 1 per second per user)
    if (user.lastTypingUpdate && now.getTime() - user.lastTypingUpdate.getTime() < 1000) {
      return;
    }

    user.typingBlockId = blockId || undefined;
    user.lastTypingUpdate = now;

    // Broadcast typing status to room
    const server = this.getServer();
    if (server) {
      server.to(this.getPageRoomName(pageId)).emit('user:typing', {
        userId: user.userId,
        userName: user.userName,
        userAvatar: user.userAvatar,
        blockId: blockId,
        isTyping: !!blockId,
      });
    }
  }

  /**
   * Broadcast block event to room
   */
  broadcastBlockEvent(
    pageId: string,
    event: 'block:created' | 'block:updated' | 'block:deleted' | 'blocks:reordered',
    data: any,
    excludeSocketId?: string,
  ): void {
    const server = this.getServer();
    if (!server) {
      return;
    }

    const roomName = this.getPageRoomName(pageId);

    if (excludeSocketId) {
      server.to(roomName).except(excludeSocketId).emit(event, data);
    } else {
      server.to(roomName).emit(event, data);
    }
  }

  /**
   * Emit conflict detected event
   */
  emitConflict(socketId: string, blockId: string, message: string): void {
    const server = this.getServer();
    if (!server) {
      return;
    }

    server.to(socketId).emit('conflict:detected', {
      blockId,
      message,
    });
  }
}
