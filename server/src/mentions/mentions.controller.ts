import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MentionsService } from './mentions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMentionDto } from './dto/create-mention.dto';

@Controller('mentions')
@UseGuards(JwtAuthGuard)
export class MentionsController {
  constructor(private readonly mentionsService: MentionsService) {}

  /**
   * Search users in workspace for mentions
   * GET /api/mentions/search?workspaceId=xxx&query=john
   */
  @Get('search')
  async searchUsers(
    @Query('workspaceId') workspaceId: string,
    @Query('query') query: string,
    @CurrentUser('id') userId: string,
  ) {
    const users = await this.mentionsService.searchWorkspaceUsers(
      workspaceId,
      query,
      userId
    );

    return {
      success: true,
      data: users,
    };
  }

  /**
   * Get user's unread mentions
   * GET /api/mentions/unread
   */
  @Get('unread')
  async getUnread(@CurrentUser('id') userId: string) {
    const mentions = await this.mentionsService.getUnreadMentions(userId);

    return {
      success: true,
      data: mentions,
    };
  }

  /**
   * Get all user's mentions with pagination
   * GET /api/mentions?skip=0&take=20
   */
  @Get()
  async getAllMentions(
    @Query('skip') skip = 0,
    @Query('take') take = 20,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.mentionsService.getUserMentions(
      userId,
      Number(skip),
      Number(take)
    );

    return {
      success: true,
      data: result.mentions,
      meta: {
        total: result.total,
        skip: Number(skip),
        take: Number(take),
      },
    };
  }

  /**
   * Mark mention as read
   * PUT /api/mentions/:id/read
   */
  @Put(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.mentionsService.markAsRead(id, userId);

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Mark all mentions as read
   * PUT /api/mentions/read-all
   */
  @Put('read-all')
  async markAllAsRead(@CurrentUser('id') userId: string) {
    const result = await this.mentionsService.markAllAsRead(userId);

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get mentions for a specific comment
   * GET /api/mentions/comment/:commentId
   */
  @Get('comment/:commentId')
  async getCommentMentions(@Param('commentId') commentId: string) {
    const mentions = await this.mentionsService.getCommentMentions(commentId);

    return {
      success: true,
      data: mentions,
    };
  }

  /**
   * Create mentions for a comment (internal use)
   * POST /api/mentions/create
   */
  @Post('create')
  async createMentions(@Body() createMentionDto: CreateMentionDto) {
    const mentions = await this.mentionsService.createMentions(
      createMentionDto.commentId,
      createMentionDto.mentionedUserIds
    );

    return {
      success: true,
      data: mentions,
    };
  }
}
