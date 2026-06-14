import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new comment
   */
  async create(userId: string, createCommentDto: CreateCommentDto) {
    const { content, pageId } = createCommentDto;

    if (!pageId) {
      throw new BadRequestException('pageId is required');
    }

    // Verify page access
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: { workspace: true },
    });

    if (!page || page.isDeleted) {
      throw new NotFoundException('Page not found or deleted');
    }

    // Check access permissions
    const hasAccess =
      page.authorId === userId ||
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

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        content,
        pageId,
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
      },
    });

    return comment;
  }

  /**
   * Get all comments for a page
   */
  async findByPage(pageId: string, userId: string) {
    // Verify page access
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!page || page.isDeleted) {
      throw new NotFoundException('Page not found or deleted');
    }

    const hasAccess =
      page.authorId === userId ||
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

    // Get comments
    const comments = await this.prisma.comment.findMany({
      where: { pageId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments;
  }

  /**
   * Get a specific comment
   */
  async findOne(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
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
        page: {
          include: { workspace: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check access permissions via page
    const page = comment.page;
    const hasAccess =
      page.authorId === userId ||
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
      throw new ForbiddenException('You do not have access to this comment');
    }

    return comment;
  }

  /**
   * Update comment
   */
  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto) {
    // Verify comment exists and user has access
    const comment = await this.findOne(id, userId);

    // Only author can update
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only comment author can update the comment');
    }

    // Update comment
    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
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
      },
    });

    return updatedComment;
  }

  /**
   * Delete comment
   */
  async remove(id: string, userId: string) {
    // Verify comment exists and user has access
    const comment = await this.findOne(id, userId);

    // Only author can delete
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only comment author can delete the comment');
    }

    // Delete comment
    await this.prisma.comment.delete({
      where: { id },
    });

    return { message: 'Comment deleted successfully' };
  }

  /**
   * Resolve comment
   */
  async resolve(id: string, userId: string) {
    // Verify comment exists and user has access
    const comment = await this.findOne(id, userId);

    // Only page author can resolve comments
    const page = await this.prisma.page.findUnique({
      where: { id: comment.pageId },
    });

    if (page?.authorId !== userId) {
      throw new ForbiddenException('Only page author can resolve comments');
    }

    // Resolve comment
    const resolvedComment = await this.prisma.comment.update({
      where: { id },
      data: { resolved: true },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return resolvedComment;
  }

  /**
   * Unresolve comment
   */
  async unresolve(id: string, userId: string) {
    // Verify comment exists and user has access
    const comment = await this.findOne(id, userId);

    // Only page author can unresolve comments
    const page = await this.prisma.page.findUnique({
      where: { id: comment.pageId },
    });

    if (page?.authorId !== userId) {
      throw new ForbiddenException('Only page author can unresolve comments');
    }

    // Unresolve comment
    const unresolvedComment = await this.prisma.comment.update({
      where: { id },
      data: { resolved: false },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return unresolvedComment;
  }

  /**
   * Get all unresolved comments for user's pages
   */
  async findUnresolved(userId: string) {
    // Get all pages user has access to
    const pages = await this.prisma.page.findMany({
      where: {
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
      },
      select: { id: true },
    });

    const pageIds = pages.map((p) => p.id);

    // Get unresolved comments
    const comments = await this.prisma.comment.findMany({
      where: {
        pageId: { in: pageIds },
        resolved: false,
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
        page: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  }
}
