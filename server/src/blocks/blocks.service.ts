import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { BlockType } from '@prisma/client';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new block
   */
  async create(userId: string, createBlockDto: CreateBlockDto) {
    const { type, content, props, pageId, parentId } = createBlockDto;

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

    // Verify parent block exists and belongs to same page
    if (parentId) {
      const parentBlock = await this.prisma.block.findUnique({
        where: { id: parentId },
      });

      if (!parentBlock) {
        throw new NotFoundException('Parent block not found');
      }

      if (parentBlock.pageId !== pageId) {
        throw new BadRequestException('Parent block must belong to the same page');
      }
    }

    // Get the next position
    const maxPosition = parentId
      ? (
          await this.prisma.block.findMany({
            where: { parentId },
            orderBy: { position: 'desc' },
            take: 1,
          })
        )[0]?.position
      : (
          await this.prisma.block.findMany({
            where: { pageId, parentId: null },
            orderBy: { position: 'desc' },
            take: 1,
          })
        )[0]?.position;

    const nextPosition = maxPosition !== undefined ? maxPosition + 1 : 0;

    // Create block
    const block = await this.prisma.block.create({
      data: {
        type: type as BlockType,
        content: content ? JSON.stringify(content) : null,
        props: props ? JSON.stringify(props) : null,
        pageId,
        parentId,
        position: nextPosition,
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
        children: true,
      },
    });

    // Parse JSON fields for response
    return {
      ...block,
      content: block.content ? JSON.parse(block.content) : null,
      props: block.props ? JSON.parse(block.props) : null,
    };
  }

  /**
   * Get all blocks for a page
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

    // Get top-level blocks
    const blocks = await this.prisma.block.findMany({
      where: {
        pageId,
        parentId: null,
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
        children: {
          include: {
            children: true, // Load 2 levels deep
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    // Parse JSON fields
    return blocks.map((block) => ({
      ...block,
      content: block.content ? JSON.parse(block.content) : null,
      props: block.props ? JSON.parse(block.props) : null,
    }));
  }

  /**
   * Get a specific block with nested children
   */
  async findOne(id: string, userId: string) {
    const block = await this.prisma.block.findUnique({
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
        children: {
          include: {
            children: true, // Load 2 levels deep
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    // Check access permissions via page
    const page = block.page;
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
      throw new ForbiddenException('You do not have access to this block');
    }

    // Parse JSON fields
    return {
      ...block,
      content: block.content ? JSON.parse(block.content) : null,
      props: block.props ? JSON.parse(block.props) : null,
    };
  }

  /**
   * Update block
   */
  async update(id: string, userId: string, updateBlockDto: UpdateBlockDto) {
    // Verify block exists and user has access
    const block = await this.findOne(id, userId);

    // Prepare update data
    const updateData: any = {};

    if (updateBlockDto.content !== undefined) {
      updateData.content = JSON.stringify(updateBlockDto.content);
    }

    if (updateBlockDto.props !== undefined) {
      updateData.props = JSON.stringify(updateBlockDto.props);
    }

    if (updateBlockDto.type !== undefined) {
      updateData.type = updateBlockDto.type as BlockType;
    }

    // Update block
    const updatedBlock = await this.prisma.block.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        children: true,
      },
    });

    // Parse JSON fields
    return {
      ...updatedBlock,
      content: updatedBlock.content ? JSON.parse(updatedBlock.content) : null,
      props: updatedBlock.props ? JSON.parse(updatedBlock.props) : null,
    };
  }

  /**
   * Delete block
   */
  async remove(id: string, userId: string) {
    // Verify block exists and user has access
    const block = await this.findOne(id, userId);

    // Check if block has children
    const childrenCount = await this.prisma.block.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException('Cannot delete block with children. Delete children first.');
    }

    // Delete block
    await this.prisma.block.delete({
      where: { id },
    });

    return { message: 'Block deleted successfully' };
  }

  /**
   * Reorder blocks
   */
  async reorder(
    pageId: string,
    userId: string,
    blockOrders: Array<{ id: string; position: number; parentId?: string | null }>,
  ) {
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

    // Update block positions in a transaction
    await this.prisma.$transaction(
      blockOrders.map(({ id, position, parentId }) =>
        this.prisma.block.update({
          where: { id },
          data: { position, parentId: parentId || null },
        }),
      ),
    );

    // Return updated blocks
    return this.findByPage(pageId, userId);
  }

  /**
   * Duplicate block
   */
  async duplicate(id: string, userId: string) {
    // Get original block
    const originalBlock = await this.findOne(id, userId);

    // Get next position
    const maxPosition = originalBlock.parentId
      ? (
          await this.prisma.block.findMany({
            where: { parentId: originalBlock.parentId },
            orderBy: { position: 'desc' },
            take: 1,
          })
        )[0]?.position
      : (
          await this.prisma.block.findMany({
            where: { pageId: originalBlock.pageId, parentId: null },
            orderBy: { position: 'desc' },
            take: 1,
          })
        )[0]?.position;

    const nextPosition = maxPosition !== undefined ? maxPosition + 1 : 0;

    // Create duplicated block
    const duplicatedBlock = await this.prisma.block.create({
      data: {
        type: originalBlock.type,
        content: originalBlock.content,
        props: originalBlock.props,
        pageId: originalBlock.pageId,
        parentId: originalBlock.parentId,
        position: nextPosition,
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

    // Parse JSON fields
    return {
      ...duplicatedBlock,
      content: duplicatedBlock.content ? JSON.parse(duplicatedBlock.content) : null,
      props: duplicatedBlock.props ? JSON.parse(duplicatedBlock.props) : null,
    };
  }

  /**
   * Get block children
   */
  async getChildren(id: string, userId: string) {
    // Verify parent block exists and user has access
    const parentBlock = await this.findOne(id, userId);

    const children = await this.prisma.block.findMany({
      where: { parentId: id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        children: true,
      },
      orderBy: { position: 'asc' },
    });

    // Parse JSON fields
    return children.map((block) => ({
      ...block,
      content: block.content ? JSON.parse(block.content) : null,
      props: block.props ? JSON.parse(block.props) : null,
    }));
  }
}
