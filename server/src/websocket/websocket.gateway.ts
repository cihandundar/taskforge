import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WebsocketService } from './websocket.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { CurrentWsUser } from './decorators/current-ws-user.decorator';
import { JoinRoomDto } from './dto/join-room.dto';
import { BlockEventDto, TypingEventDto } from './dto/block-event.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
})
@UseGuards(WsJwtAuthGuard)
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server): void {
    this.websocketService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket): void {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Client connected: ${client.id} (User: ${user.name})`);
    } else {
      this.logger.warn(`Client connected without authentication: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.websocketService.leavePageRoom(client.id);
  }

  @SubscribeMessage('page:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() joinRoomDto: JoinRoomDto,
    @CurrentWsUser() user: any,
  ): void {
    const { pageId } = joinRoomDto;
    const roomName = this.websocketService.getPageRoomName(pageId);

    // Join Socket.IO room
    client.join(roomName);

    // Add to room users
    this.websocketService.joinPageRoom(client.id, pageId, {
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Send current room users to the joining client
    const roomUsers = this.websocketService.getRoomUsers(pageId);
    client.emit('room:users', roomUsers);

    this.logger.log(`User ${user.name} joined room: ${roomName}`);
  }

  @SubscribeMessage('page:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() joinRoomDto: JoinRoomDto,
  ): void {
    const { pageId } = joinRoomDto;
    const roomName = this.websocketService.getPageRoomName(pageId);

    // Leave Socket.IO room
    client.leave(roomName);

    // Remove from room users
    this.websocketService.leavePageRoom(client.id, pageId);

    this.logger.log(`Client ${client.id} left room: ${roomName}`);
  }

  @SubscribeMessage('block:create')
  async handleCreateBlock(
    @ConnectedSocket() client: Socket,
    @MessageBody() blockEvent: BlockEventDto,
    @CurrentWsUser() user: any,
  ): Promise<void> {
    const { pageId, ...blockData } = blockEvent;

    // Broadcast to other users in the room
    this.websocketService.broadcastBlockEvent(
      pageId,
      'block:created',
      {
        ...blockData,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
      },
      client.id,
    );

    this.logger.log(`Block created by ${user.name} in page ${pageId}`);
  }

  @SubscribeMessage('block:update')
  async handleUpdateBlock(
    @ConnectedSocket() client: Socket,
    @MessageBody() blockEvent: BlockEventDto,
    @CurrentWsUser() user: any,
  ): Promise<void> {
    const { id, pageId, content, timestamp, previousContent } = blockEvent;

    // Broadcast to other users in the room
    this.websocketService.broadcastBlockEvent(
      pageId,
      'block:updated',
      {
        id,
        content,
        updatedBy: user.id,
        updatedByName: user.name,
        updatedByAvatar: user.avatar,
        timestamp,
      },
      client.id,
    );

    this.logger.log(`Block ${id} updated by ${user.name}`);
  }

  @SubscribeMessage('block:delete')
  async handleDeleteBlock(
    @ConnectedSocket() client: Socket,
    @MessageBody() blockEvent: BlockEventDto,
    @CurrentWsUser() user: any,
  ): Promise<void> {
    const { id, pageId } = blockEvent;

    // Broadcast to other users in the room
    this.websocketService.broadcastBlockEvent(
      pageId,
      'block:deleted',
      {
        id,
        deletedBy: user.id,
        deletedByName: user.name,
        deletedByAvatar: user.avatar,
      },
      client.id,
    );

    this.logger.log(`Block ${id} deleted by ${user.name}`);
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() typingEvent: TypingEventDto,
  ): Promise<void> {
    const { pageId, blockId } = typingEvent;

    this.websocketService.updateTypingStatus(client.id, pageId, blockId);
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() typingEvent: TypingEventDto,
  ): Promise<void> {
    const { pageId } = typingEvent;

    this.websocketService.updateTypingStatus(client.id, pageId, null);
  }
}
