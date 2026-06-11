import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MemberRole as WorkspaceMemberRole } from '@prisma/client';

@Injectable()
export class WorkspaceOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = this.extractWorkspaceId(request);

    if (!workspaceId) {
      throw new BadRequestException('Workspace ID is required');
    }

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is the owner or admin of the workspace
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Only OWNER and ADMIN can access
    if (
      membership.role !== WorkspaceMemberRole.OWNER &&
      membership.role !== WorkspaceMemberRole.ADMIN
    ) {
      throw new ForbiddenException('Only workspace owners and admins can perform this action');
    }

    // Attach workspace to request for later use
    request.workspace = { id: workspaceId, role: membership.role };
    return true;
  }

  private extractWorkspaceId(request: any): string | null {
    // Try to get workspaceId from params
    if (request.params?.workspaceId) {
      return request.params.workspaceId;
    }
    if (request.params?.id) {
      return request.params.id;
    }
    // Try to get from body
    if (request.body?.workspaceId) {
      return request.body.workspaceId;
    }
    return null;
  }
}
