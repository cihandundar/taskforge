import { Injectable, ExecutionContext, CanActivate, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    // Extract token from handshake auth
    const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      client.disconnect();
      return false;
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
      const payload = this.jwtService.verify(token, { secret });

      // Attach user to socket for later use
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };

      return true;
    } catch (err) {
      client.disconnect();
      return false;
    }
  }
}
