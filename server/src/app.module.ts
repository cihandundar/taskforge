import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspace.module';
import { PagesModule } from './pages/pages.module';
import { BlocksModule } from './blocks/blocks.module';
import { CommentsModule } from './comments/comments.module';
import { WebsocketModule } from './websocket/websocket.module';
import { CalendarModule } from './calendar/calendar.module';
import { SitesModule } from './sites/sites.module';
import { MentionsModule } from './mentions/mentions.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    WorkspacesModule,
    PagesModule,
    BlocksModule,
    CommentsModule,
    WebsocketModule,
    CalendarModule,
    SitesModule,
    MentionsModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
