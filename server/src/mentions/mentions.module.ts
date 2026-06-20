import { Module, forwardRef } from '@nestjs/common';
import { MentionsService } from './mentions.service';
import { MentionsController } from './mentions.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [PrismaModule, WebsocketModule, forwardRef(() => CommentsModule)],
  controllers: [MentionsController],
  providers: [MentionsService],
  exports: [MentionsService],
})
export class MentionsModule {}
