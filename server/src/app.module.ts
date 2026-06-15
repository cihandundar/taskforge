import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspace.module';
import { PagesModule } from './pages/pages.module';
import { BlocksModule } from './blocks/blocks.module';
import { CommentsModule } from './comments/comments.module';
import { WebsocketModule } from './websocket/websocket.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    WorkspacesModule,
    PagesModule,
    BlocksModule,
    CommentsModule,
    WebsocketModule,
    CalendarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
