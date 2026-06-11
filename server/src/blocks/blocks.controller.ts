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
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { ReorderBlocksDto } from './dto/reorder-blocks.dto';

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * Create a new block
   * POST /api/blocks
   */
  @Post()
  async create(@CurrentUser('id') userId: string, @Body() createBlockDto: CreateBlockDto) {
    const result = await this.blocksService.create(userId, createBlockDto);

    return {
      success: true,
      message: 'Block created successfully',
      data: result,
    };
  }

  /**
   * Get all blocks for a page
   * GET /api/blocks?pageId=xxx
   */
  @Get()
  async findByPage(@Query('pageId') pageId: string, @CurrentUser('id') userId: string) {
    if (!pageId) {
      return {
        success: true,
        data: [],
      };
    }

    const result = await this.blocksService.findByPage(pageId, userId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get a specific block with children
   * GET /api/blocks/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.blocksService.findOne(id, userId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Update block
   * PUT /api/blocks/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateBlockDto: UpdateBlockDto,
  ) {
    const result = await this.blocksService.update(id, userId, updateBlockDto);

    return {
      success: true,
      message: 'Block updated successfully',
      data: result,
    };
  }

  /**
   * Delete block
   * DELETE /api/blocks/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.blocksService.remove(id, userId);

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Reorder blocks
   * POST /api/blocks/reorder
   */
  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  async reorder(
    @CurrentUser('id') userId: string,
    @Body() reorderBlocksDto: ReorderBlocksDto,
  ) {
    const result = await this.blocksService.reorder(
      reorderBlocksDto.pageId,
      userId,
      reorderBlocksDto.blocks,
    );

    return {
      success: true,
      message: 'Blocks reordered successfully',
      data: result,
    };
  }

  /**
   * Duplicate block
   * POST /api/blocks/:id/duplicate
   */
  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.blocksService.duplicate(id, userId);

    return {
      success: true,
      message: 'Block duplicated successfully',
      data: result,
    };
  }

  /**
   * Get block children
   * GET /api/blocks/:id/children
   */
  @Get(':id/children')
  async getChildren(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.blocksService.getChildren(id, userId);

    return {
      success: true,
      data: result,
    };
  }
}
