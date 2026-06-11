import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspace.service';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MemberRole as WorkspaceMemberRole } from '@prisma/client';
import { MemberRole } from './dto/add-member.dto';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    workspace: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockWorkspace = {
    id: 'workspace1',
    name: 'Test Workspace',
    icon: '🚀',
    description: 'Test Description',
    ownerId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a workspace and add owner as member', async () => {
      const createWorkspaceDto = {
        name: 'New Workspace',
        icon: '💼',
        description: 'A new workspace',
      };

      mockPrismaService.workspace.create.mockResolvedValue(mockWorkspace);
      mockPrismaService.workspaceMember.create.mockResolvedValue({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      });
      mockPrismaService.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        _count: { members: 1, pages: 0 },
      });
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      });

      const result = await service.create('user1', createWorkspaceDto);

      expect(mockPrismaService.workspace.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Workspace',
          icon: '💼',
          description: 'A new workspace',
          ownerId: 'user1',
        }),
      });

      expect(mockPrismaService.workspaceMember.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 'workspace1',
          userId: 'user1',
          role: WorkspaceMemberRole.OWNER,
        },
      });

      expect(result).toHaveProperty('id');
    });
  });

  describe('findAll', () => {
    it('should return all workspaces for user', async () => {
      const mockMemberships = [
        {
          id: 'member1',
          workspaceId: 'workspace1',
          userId: 'user1',
          role: WorkspaceMemberRole.OWNER,
          joinedAt: new Date(),
          workspace: {
            ...mockWorkspace,
            _count: { members: 1, pages: 0 },
          },
        },
      ];

      mockPrismaService.workspaceMember.findMany.mockResolvedValue(mockMemberships);

      const result = await service.findAll('user1');

      expect(mockPrismaService.workspaceMember.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
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

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('role');
    });
  });

  describe('findOne', () => {
    it('should return workspace if user is member', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        _count: { members: 1, pages: 0 },
      });
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
        user: mockUser,
      });

      const result = await service.findOne('workspace1', 'user1');

      expect(result).toHaveProperty('id', 'workspace1');
      expect(result).toHaveProperty('role');
    });

    it('should throw NotFoundException if workspace not found', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not member', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.findOne('workspace1', 'user2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update workspace if user is admin or owner', async () => {
      const updateWorkspaceDto = { name: 'Updated Name' };

      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.ADMIN,
        joinedAt: new Date(),
      });

      mockPrismaService.workspace.update.mockResolvedValue({
        ...mockWorkspace,
        name: 'Updated Name',
        _count: { members: 1, pages: 0 },
      });

      const result = await service.update('workspace1', 'user1', updateWorkspaceDto);

      expect(mockPrismaService.workspace.update).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
    });

    it('should throw ForbiddenException if user is not admin or owner', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.MEMBER,
        joinedAt: new Date(),
      });

      await expect(
        service.update('workspace1', 'user1', { name: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete workspace if user is owner', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      });

      mockPrismaService.workspace.delete.mockResolvedValue(mockWorkspace);

      const result = await service.remove('workspace1', 'user1');

      expect(mockPrismaService.workspace.delete).toHaveBeenCalledWith({
        where: { id: 'workspace1' },
      });
      expect(result).toHaveProperty('message', 'Workspace deleted successfully');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.ADMIN,
        joinedAt: new Date(),
      });

      await expect(service.remove('workspace1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addMember', () => {
    it('should add member to workspace', async () => {
      const addMemberDto = { email: 'newuser@example.com', role: MemberRole.MEMBER };

      // First call: check if current user is member (owner)
      mockPrismaService.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user2',
        email: 'newuser@example.com',
        name: 'New User',
      });

      // Second call: check if user to add is already a member (null)
      mockPrismaService.workspaceMember.findUnique.mockResolvedValueOnce(null);

      mockPrismaService.workspaceMember.create.mockResolvedValue({
        id: 'member2',
        workspaceId: 'workspace1',
        userId: 'user2',
        role: WorkspaceMemberRole.MEMBER,
        joinedAt: new Date(),
        user: { id: 'user2', email: 'newuser@example.com', name: 'New User', avatar: null },
      });

      const result = await service.addMember('workspace1', 'user1', addMemberDto);

      expect(mockPrismaService.workspaceMember.create).toHaveBeenCalled();
      expect(result.user.email).toBe('newuser@example.com');
    });

    it('should throw NotFoundException if user to add does not exist', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      });

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember('workspace1', 'user1', { email: 'notfound@example.com', role: MemberRole.MEMBER }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user is already member', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      }).mockResolvedValue({
        id: 'member2',
        workspaceId: 'workspace1',
        userId: 'user2',
        role: WorkspaceMemberRole.MEMBER,
        joinedAt: new Date(),
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user2',
        email: 'existing@example.com',
        name: 'Existing User',
      });

      await expect(
        service.addMember('workspace1', 'user1', { email: 'existing@example.com', role: MemberRole.MEMBER }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role if user is owner', async () => {
      const updateMemberRoleDto = { role: MemberRole.ADMIN };

      mockPrismaService.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      }).mockResolvedValueOnce({
        id: 'member2',
        workspaceId: 'workspace1',
        userId: 'user2',
        role: WorkspaceMemberRole.MEMBER,
        joinedAt: new Date(),
      });

      mockPrismaService.workspaceMember.update.mockResolvedValue({
        id: 'member2',
        workspaceId: 'workspace1',
        userId: 'user2',
        role: WorkspaceMemberRole.ADMIN,
        joinedAt: new Date(),
        user: { id: 'user2', email: 'user2@example.com', name: 'User 2', avatar: null },
      });

      const result = await service.updateMemberRole('workspace1', 'member2', 'user1', updateMemberRoleDto);

      expect(mockPrismaService.workspaceMember.update).toHaveBeenCalled();
      expect(result.role).toBe(WorkspaceMemberRole.ADMIN);
    });

    it('should throw BadRequestException when trying to change owner role', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      }).mockResolvedValueOnce({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      });

      await expect(
        service.updateMemberRole('workspace1', 'member1', 'user1', { role: MemberRole.ADMIN }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeMember', () => {
    it('should remove member if user is owner', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      }).mockResolvedValueOnce({
        id: 'member2',
        workspaceId: 'workspace1',
        userId: 'user2',
        role: WorkspaceMemberRole.MEMBER,
        joinedAt: new Date(),
      });

      mockPrismaService.workspaceMember.delete.mockResolvedValue({});

      const result = await service.removeMember('workspace1', 'member2', 'user1');

      expect(mockPrismaService.workspaceMember.delete).toHaveBeenCalled();
      expect(result).toHaveProperty('message', 'Member removed successfully');
    });

    it('should throw BadRequestException when owner tries to remove themselves', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      });

      await expect(service.removeMember('workspace1', 'member1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('leaveWorkspace', () => {
    it('should allow member to leave workspace', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.MEMBER,
        joinedAt: new Date(),
      });

      mockPrismaService.workspaceMember.delete.mockResolvedValue({});

      const result = await service.leaveWorkspace('workspace1', 'user1');

      expect(mockPrismaService.workspaceMember.delete).toHaveBeenCalled();
      expect(result).toHaveProperty('message', 'Left workspace successfully');
    });

    it('should throw BadRequestException when owner tries to leave', async () => {
      mockPrismaService.workspaceMember.findUnique.mockResolvedValue({
        id: 'member1',
        workspaceId: 'workspace1',
        userId: 'user1',
        role: WorkspaceMemberRole.OWNER,
        joinedAt: new Date(),
      });

      await expect(service.leaveWorkspace('workspace1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
