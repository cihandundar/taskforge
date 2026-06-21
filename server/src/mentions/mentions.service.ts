import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WebsocketService } from '../websocket/websocket.service';
import { CreateMentionDto } from './dto/create-mention.dto';

@Injectable()
export class MentionsService {
  constructor(
    private prisma: PrismaService,
    private websocketService: WebsocketService,
  ) {}

  /**
   * Create mentions for a comment
   */
  async createMentions(commentId: string, mentionedUserIds: string[]) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { page: true, author: true },
    });

    if (!comment) {
      throw new NotFoundException('Yorum bulunamadı');
    }

    // Filter out duplicates and the author
    const uniqueUserIds = [...new Set(mentionedUserIds)].filter(
      (id) => id !== comment.authorId
    );

    // Create mentions
    const mentions = await Promise.all(
      uniqueUserIds.map((mentionedUserId) =>
        this.prisma.mention.upsert({
          where: {
            commentId_mentionedUserId: {
              commentId,
              mentionedUserId,
            },
          },
          create: {
            commentId,
            mentionedUserId,
            read: false,
          },
          update: {}, // Keep existing
          include: {
            mentionedUser: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        })
      )
    );

    // Broadcast mention events
    for (const mention of mentions) {
      // Notify mentioned user
      this.websocketService.broadcastToUser(mention.mentionedUserId, 'mention:created', {
        id: mention.id,
        commentId: comment.id,
        comment: {
          content: comment.content,
          author: comment.author,
        },
        page: {
          id: comment.page.id,
          title: comment.page.title,
        },
        mentionedBy: comment.author,
        createdAt: mention.createdAt,
      });
    }

    return mentions;
  }

  /**
   * Get user's unread mentions
   */
  async getUnreadMentions(userId: string) {
    return this.prisma.mention.findMany({
      where: {
        mentionedUserId: userId,
        read: false,
      },
      include: {
        comment: {
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
                workspaceId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all user's mentions
   */
  async getUserMentions(userId: string, skip = 0, take = 20) {
    const [mentions, total] = await Promise.all([
      this.prisma.mention.findMany({
        where: {
          mentionedUserId: userId,
        },
        include: {
          comment: {
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
                  workspaceId: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.mention.count({
        where: { mentionedUserId: userId },
      }),
    ]);

    return { mentions, total };
  }

  /**
   * Mark mention as read
   */
  async markAsRead(id: string, userId: string) {
    const mention = await this.prisma.mention.findUnique({
      where: { id },
    });

    if (!mention) {
      throw new NotFoundException('Etiket bulunamadı');
    }

    if (mention.mentionedUserId !== userId) {
      throw new ForbiddenException('Sadece kendi etiketlerinizi okundu olarak işaretleyebilirsiniz');
    }

    await this.prisma.mention.update({
      where: { id },
      data: { read: true },
    });

    return { message: 'Mention marked as read' };
  }

  /**
   * Mark all mentions as read for user
   */
  async markAllAsRead(userId: string) {
    await this.prisma.mention.updateMany({
      where: {
        mentionedUserId: userId,
        read: false,
      },
      data: { read: true },
    });

    return { message: 'All mentions marked as read' };
  }

  /**
   * Search users in workspace for mentions
   */
  async searchWorkspaceUsers(workspaceId: string, query: string, currentUserId: string) {
    if (!query || query.length < 2) {
      return [];
    }

    // Get workspace members
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
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
        },
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!workspace) {
      return [];
    }

    // Combine owner and members
    const allUsers = [
      workspace.owner,
      ...workspace.members.map((m) => m.user),
    ];

    // Filter by query (name or email)
    const filtered = allUsers.filter(
      (user) =>
        user.id !== currentUserId &&
        (user.name?.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase()))
    );

    // Remove duplicates
    const unique = Array.from(
      new Map(filtered.map((user) => [user.id, user])).values()
    );

    return unique.slice(0, 10); // Limit to 10 results
  }

  /**
   * Parse mentions from comment content
   */
  parseMentionsFromContent(content: string): string[] {
    const mentionPattern = /@(\w+)/g;
    const matches = content.match(mentionPattern);
    if (!matches) return [];

    // Extract user IDs or emails from mentions
    // Pattern: @userId or @email
    const mentionedIds: string[] = [];
    for (const match of matches) {
      const identifier = match.substring(1); // Remove @
      // Check if it's a valid ID or email
      if (identifier.includes('@')) {
        // It's an email - need to lookup user
        // This will be handled by the caller
        mentionedIds.push(identifier);
      } else {
        // It's a user ID
        mentionedIds.push(identifier);
      }
    }

    return [...new Set(mentionedIds)];
  }

  /**
   * Get comment mentions
   */
  async getCommentMentions(commentId: string) {
    return this.prisma.mention.findMany({
      where: { commentId },
      include: {
        mentionedUser: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }
}
