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
import { PagesService } from './pages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Controller('pages')
@UseGuards(JwtAuthGuard)
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  /**
   * Create a new page
   * POST /api/pages
   */
  @Post()
  async create(@CurrentUser('id') userId: string, @Body() createPageDto: CreatePageDto) {
    const result = await this.pagesService.create(userId, createPageDto);

    return {
      success: true,
      message: 'Page created successfully',
      data: result,
    };
  }

  /**
   * Get all pages for current user
   * GET /api/pages?workspaceId=xxx
   */
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    const result = await this.pagesService.findAll(userId, workspaceId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Search pages
   * GET /api/pages/search?q=query&workspaceId=xxx
   * Must come before :id route to avoid "search" being treated as an id
   */
  @Get('search')
  async search(
    @Query('q') query: string,
    @CurrentUser('id') userId: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    const result = await this.pagesService.search(query, userId, workspaceId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get a specific page
   * GET /api/pages/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.pagesService.findOne(id, userId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Update page
   * PUT /api/pages/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updatePageDto: UpdatePageDto,
  ) {
    const result = await this.pagesService.update(id, userId, updatePageDto);

    return {
      success: true,
      message: 'Page updated successfully',
      data: result,
    };
  }

  /**
   * Delete page (soft delete)
   * DELETE /api/pages/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.pagesService.remove(id, userId);

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Restore deleted page
   * POST /api/pages/:id/restore
   */
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.pagesService.restore(id, userId);

    return {
      success: true,
      message: 'Page restored successfully',
      data: result,
    };
  }

  /**
   * Get page children (nested pages)
   * GET /api/pages/:id/children
   */
  @Get(':id/children')
  async getChildren(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.pagesService.getChildren(id, userId);

    return {
      success: true,
      data: result,
    };
  }
}
