import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';

@Module({
  imports: [PrismaModule],
  controllers: [PagesController],
  providers: [PagesService, WorkspaceMemberGuard],
  exports: [PagesService],
})
export class PagesModule {}
