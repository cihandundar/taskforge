import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto, MemberRole } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MemberRole as WorkspaceMemberRole } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new workspace
   * The creator becomes the OWNER
   */
  async create(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    const { name, icon, description } = createWorkspaceDto;

    // Create workspace
    const workspace = await this.prisma.workspace.create({
      data: {
        name,
        icon,
        description,
        ownerId: userId,
      },
    });

    // Add creator as owner
    await this.prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: MemberRole.OWNER,
      },
    });

    // Return workspace with membership info
    return this.findOne(workspace.id, userId);
  }

  /**
   * Get all workspaces for the current user
   */
  async findAll(userId: string) {
    // Get workspaces where user is a member
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                pages: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((membership) => ({
      ...membership.workspace,
      role: membership.role,
      joinedAt: membership.joinedAt,
    }));
  }

  /**
   * Get a specific workspace
   */
  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            pages: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user is a member
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return {
      ...workspace,
      role: membership.role,
      joinedAt: membership.joinedAt,
    };
  }

  /**
   * Update workspace
   * Only OWNER and ADMIN can update
   */
  async update(id: string, userId: string, updateWorkspaceDto: UpdateWorkspaceDto) {
    // Check permission
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (
      membership.role !== MemberRole.OWNER &&
      membership.role !== MemberRole.ADMIN
    ) {
      throw new ForbiddenException('Only owners and admins can update workspace');
    }

    // Update workspace
    const workspace = await this.prisma.workspace.update({
      where: { id },
      data: updateWorkspaceDto,
      include: {
        _count: {
          select: {
            members: true,
            pages: true,
          },
        },
      },
    });

    return {
      ...workspace,
      role: membership.role,
      joinedAt: membership.joinedAt,
    };
  }

  /**
   * Delete workspace
   * Only OWNER can delete
   */
  async remove(id: string, userId: string) {
    // Check permission
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (membership.role !== MemberRole.OWNER) {
      throw new ForbiddenException('Only workspace owners can delete workspace');
    }

    // Delete workspace (cascade will handle members and pages)
    await this.prisma.workspace.delete({
      where: { id },
    });

    return { message: 'Workspace deleted successfully' };
  }

  /**
   * Get all members of a workspace
   */
  async getMembers(id: string, userId: string) {
    // Verify user is a member
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return members.map((member) => ({
      id: member.id,
      user: member.user,
      role: member.role,
      joinedAt: member.joinedAt,
    }));
  }

  /**
   * Add a member to workspace
   * Only OWNER and ADMIN can add members
   */
  async addMember(id: string, userId: string, addMemberDto: AddMemberDto) {
    const { email, role } = addMemberDto;

    // Check permission
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (
      membership.role !== MemberRole.OWNER &&
      membership.role !== MemberRole.ADMIN
    ) {
      throw new ForbiddenException('Only owners and admins can add members');
    }

    // Find user by email
    const userToAdd = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      throw new NotFoundException('User with this email not found');
    }

    // Check if already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    // Cannot add another OWNER
    if (role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot add another owner to the workspace');
    }

    // Add member
    const newMember = await this.prisma.workspaceMember.create({
      data: {
        workspaceId: id,
        userId: userToAdd.id,
        role: role as WorkspaceMemberRole,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return {
      id: newMember.id,
      user: newMember.user,
      role: newMember.role,
      joinedAt: newMember.joinedAt,
    };
  }

  /**
   * Update member role
   * Only OWNER can update roles
   */
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    userId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    const { role } = updateMemberRoleDto;

    // Check permission (only OWNER can update roles)
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership || membership.role !== MemberRole.OWNER) {
      throw new ForbiddenException('Only workspace owners can update member roles');
    }

    // Get member to update
    const memberToUpdate = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToUpdate || memberToUpdate.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    // Cannot change owner role
    if (memberToUpdate.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot change workspace owner role');
    }

    // Cannot make someone else owner
    if (role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot add another owner to the workspace');
    }

    // Update role
    const updatedMember = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: role as WorkspaceMemberRole },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return {
      id: updatedMember.id,
      user: updatedMember.user,
      role: updatedMember.role,
      joinedAt: updatedMember.joinedAt,
    };
  }

  /**
   * Remove member from workspace
   * Only OWNER can remove members (except themselves)
   */
  async removeMember(workspaceId: string, memberId: string, userId: string) {
    // Check permission
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Get member to remove
    const memberToRemove = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove || memberToRemove.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    // Check permissions
    if (membership.role === MemberRole.OWNER) {
      // Owner can remove anyone except themselves
      if (memberToRemove.userId === userId) {
        throw new BadRequestException('Workspace owner cannot leave. Transfer ownership first.');
      }
    } else if (membership.role === MemberRole.ADMIN) {
      // Admin can only remove guests
      if (memberToRemove.role !== MemberRole.GUEST) {
        throw new ForbiddenException('Admins can only remove guests');
      }
    } else {
      // Members and guests cannot remove anyone
      throw new ForbiddenException('Only owners and admins can remove members');
    }

    // Remove member
    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return { message: 'Member removed successfully' };
  }

  /**
   * Leave workspace
   * Members can leave, owners must transfer first
   */
  async leaveWorkspace(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this workspace');
    }

    // Owner cannot leave
    if (membership.role === MemberRole.OWNER) {
      throw new BadRequestException(
        'Workspace owner cannot leave. Transfer ownership to another member first.',
      );
    }

    // Remove membership
    await this.prisma.workspaceMember.delete({
      where: {
        id: membership.id,
      },
    });

    return { message: 'Left workspace successfully' };
  }
}
