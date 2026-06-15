import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Create a new comment
   * POST /api/comments
   */
  @Post()
  async create(@CurrentUser('id') userId: string, @Body() createCommentDto: CreateCommentDto) {
    const result = await this.commentsService.create(userId, createCommentDto);

    return {
      success: true,
      message: 'Yorum başarıyla oluşturuldu',
      data: result,
    };
  }

  /**
   * Get all comments for a page
   * GET /api/comments?pageId=xxx
   */
  @Get()
  async findByPage(@Query('pageId') pageId: string, @CurrentUser('id') userId: string) {
    if (!pageId) {
      return {
        success: true,
        data: [],
      };
    }

    const result = await this.commentsService.findByPage(pageId, userId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get unresolved comments for user
   * GET /api/comments/unresolved
   */
  @Get('unresolved')
  async findUnresolved(@CurrentUser('id') userId: string) {
    const result = await this.commentsService.findUnresolved(userId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get a specific comment
   * GET /api/comments/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.commentsService.findOne(id, userId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Update comment
   * PUT /api/comments/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const result = await this.commentsService.update(id, userId, updateCommentDto);

    return {
      success: true,
      message: 'Yorum başarıyla güncellendi',
      data: result,
    };
  }

  /**
   * Delete comment
   * DELETE /api/comments/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.commentsService.remove(id, userId);

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Resolve comment
   * POST /api/comments/:id/resolve
   */
  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.commentsService.resolve(id, userId);

    return {
      success: true,
      message: 'Yorum başarıyla çözüldü',
      data: result,
    };
  }

  /**
   * Unresolve comment
   * POST /api/comments/:id/unresolve
   */
  @Post(':id/unresolve')
  @HttpCode(HttpStatus.OK)
  async unresolve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.commentsService.unresolve(id, userId);

    return {
      success: true,
      message: 'Yorum başarıyla çözülmedi',
      data: result,
    };
  }
}
