import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: 900, // 15 minutes in seconds
        },
      }),
    }),
  ],
  providers: [
    WsJwtAuthGuard,
    WebsocketService,
    WebsocketGateway,
  ],
  exports: [WebsocketService],
})
export class WebsocketModule {}
