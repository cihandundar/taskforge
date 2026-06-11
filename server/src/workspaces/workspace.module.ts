import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspace.controller';
import { WorkspacesService } from './workspace.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspaceOwnerGuard } from './guards/workspace-owner.guard';
import { WorkspaceAdminGuard } from './guards/workspace-admin.guard';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    WorkspaceMemberGuard,
    WorkspaceOwnerGuard,
    WorkspaceAdminGuard,
  ],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
