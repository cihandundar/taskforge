import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new page
   */
  async create(userId: string, createPageDto: CreatePageDto) {
    const { title, icon, cover, workspaceId, parentId } = createPageDto;

    // Verify workspace access if workspaceId provided
    if (workspaceId) {
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
    }

    // Verify parent page exists and user has access
    if (parentId) {
      const parentPage = await this.prisma.page.findUnique({
        where: { id: parentId },
      });

      if (!parentPage) {
        throw new NotFoundException('Parent page not found');
      }

      if (parentPage.isDeleted) {
        throw new BadRequestException('Cannot create page under deleted parent');
      }

      // Check workspace access if parent belongs to workspace
      if (parentPage.workspaceId) {
        const membership = await this.prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: parentPage.workspaceId,
              userId,
            },
          },
        });

        if (!membership) {
          throw new ForbiddenException('You are not a member of this workspace');
        }
      }

      // Ensure workspace consistency
      if (workspaceId && parentPage.workspaceId !== workspaceId) {
        throw new BadRequestException('Parent page belongs to different workspace');
      }
    }

    // Create page
    const page = await this.prisma.page.create({
      data: {
        title: title || 'Untitled',
        icon,
        cover,
        isPublic: false,
        isDeleted: false,
        workspaceId: workspaceId || (parentId ? null : undefined),
        parentId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            blocks: true,
            children: true,
            comments: true,
          },
        },
      },
    });

    return page;
  }

  /**
   * Get all pages for user
   */
  async findAll(userId: string, workspaceId?: string) {
    const where: any = {
      isDeleted: false,
      OR: [
        // Pages owned by user
        { authorId: userId },
        // Pages in user's workspaces
        {
          workspace: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      ],
    };

    // Filter by workspace if specified
    if (workspaceId) {
      // Verify workspace access
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

      where.workspaceId = workspaceId;
    } else {
      // If no workspace specified, only return pages without workspace (personal pages)
      // or pages in user's workspaces
      where.OR = [
        { authorId: userId, workspaceId: null },
        {
          workspace: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      ];
    }

    const pages = await this.prisma.page.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            blocks: true,
            children: true,
            comments: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return pages;
  }

  /**
   * Get a specific page
   */
  async findOne(id: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            blocks: true,
            children: true,
            comments: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    if (page.isDeleted) {
      throw new NotFoundException('Page has been deleted');
    }

    // Check access permissions
    const hasAccess =
      // Author can always access
      page.authorId === userId ||
      // Public pages can be accessed by anyone (optional, depends on requirements)
      (page.isPublic && true) ||
      // Workspace members can access
      (page.workspaceId &&
        (await this.prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: page.workspaceId,
              userId,
            },
          },
        }))) !== null;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this page');
    }

    return page;
  }

  /**
   * Update page
   */
  async update(id: string, userId: string, updatePageDto: UpdatePageDto) {
    // Check page exists and user has access
    const page = await this.findOne(id, userId);

    // Only author can update
    if (page.authorId !== userId) {
      throw new ForbiddenException('Only page author can update the page');
    }

    // Validate workspace change if provided
    if (updatePageDto.workspaceId && updatePageDto.workspaceId !== page.workspaceId) {
      const membership = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: updatePageDto.workspaceId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenException('You are not a member of target workspace');
      }

      // Check for children - they should also be moved (optional, recursive)
      const childrenCount = await this.prisma.page.count({
        where: { parentId: id },
      });

      if (childrenCount > 0) {
        throw new BadRequestException(
          'Cannot move workspace with nested pages. Move children first.',
        );
      }
    }

    // Validate parent change if provided
    if (updatePageDto.parentId && updatePageDto.parentId !== page.parentId) {
      if (updatePageDto.parentId === id) {
        throw new BadRequestException('Page cannot be its own parent');
      }

      const parentPage = await this.prisma.page.findUnique({
        where: { id: updatePageDto.parentId },
      });

      if (!parentPage || parentPage.isDeleted) {
        throw new NotFoundException('Parent page not found or deleted');
      }

      // Check for circular reference
      let currentParent = parentPage;
      while (currentParent.parentId) {
        if (currentParent.parentId === id) {
          throw new BadRequestException('Circular parent reference detected');
        }
        currentParent = await this.prisma.page.findUnique({
          where: { id: currentParent.parentId },
        });
      }
    }

    // Update page
    const updatedPage = await this.prisma.page.update({
      where: { id },
      data: updatePageDto,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            blocks: true,
            children: true,
            comments: true,
          },
        },
      },
    });

    return updatedPage;
  }

  /**
   * Delete page (soft delete)
   */
  async remove(id: string, userId: string) {
    // Check page exists and user has access
    const page = await this.findOne(id, userId);

    // Only author can delete
    if (page.authorId !== userId) {
      throw new ForbiddenException('Only page author can delete the page');
    }

    // Soft delete
    await this.prisma.page.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: 'Page deleted successfully' };
  }

  /**
   * Restore deleted page
   */
  async restore(id: string, userId: string) {
    // Check page exists and user has access
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    if (!page.isDeleted) {
      throw new BadRequestException('Page is not deleted');
    }

    // Only author can restore
    if (page.authorId !== userId) {
      throw new ForbiddenException('Only page author can restore the page');
    }

    // Restore page
    const restoredPage = await this.prisma.page.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            blocks: true,
            children: true,
            comments: true,
          },
        },
      },
    });

    return restoredPage;
  }

  /**
   * Get page children (nested pages)
   */
  async getChildren(id: string, userId: string) {
    // Verify parent page access
    await this.findOne(id, userId);

    const children = await this.prisma.page.findMany({
      where: {
        parentId: id,
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            blocks: true,
            children: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return children;
  }

  /**
   * Search pages
   */
  async search(query: string, userId: string, workspaceId?: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchQuery = query.trim();

    const where: any = {
      isDeleted: false,
      OR: [
        { authorId: userId },
        {
          workspace: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      ],
      AND: [
        {
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { icon: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
      ],
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const pages = await this.prisma.page.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        _count: {
          select: {
            blocks: true,
            children: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 20,
    });

    return pages;
  }
}
