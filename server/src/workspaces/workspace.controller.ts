import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkspacesService } from './workspace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspaceOwnerGuard } from './guards/workspace-owner.guard';
import { WorkspaceAdminGuard } from './guards/workspace-admin.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /**
   * Create a new workspace
   * POST /api/workspaces
   */
  @Post()
  async create(@CurrentUser('id') userId: string, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    const result = await this.workspacesService.create(userId, createWorkspaceDto);

    return {
      success: true,
      message: 'Workspace created successfully',
      data: result,
    };
  }

  /**
   * Get all workspaces for current user
   * GET /api/workspaces
   */
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    const result = await this.workspacesService.findAll(userId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get a specific workspace
   * GET /api/workspaces/:id
   */
  @Get(':id')
  @UseGuards(WorkspaceMemberGuard)
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.workspacesService.findOne(id, userId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Update workspace
   * PUT /api/workspaces/:id
   */
  @Put(':id')
  @UseGuards(WorkspaceOwnerGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    const result = await this.workspacesService.update(id, userId, updateWorkspaceDto);

    return {
      success: true,
      message: 'Workspace updated successfully',
      data: result,
    };
  }

  /**
   * Delete workspace
   * DELETE /api/workspaces/:id
   */
  @Delete(':id')
  @UseGuards(WorkspaceOwnerGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.workspacesService.remove(id, userId);

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get all members of a workspace
   * GET /api/workspaces/:id/members
   */
  @Get(':id/members')
  @UseGuards(WorkspaceMemberGuard)
  async getMembers(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.workspacesService.getMembers(id, userId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Add a member to workspace
   * POST /api/workspaces/:id/members
   */
  @Post(':id/members')
  @UseGuards(WorkspaceOwnerGuard)
  async addMember(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    const result = await this.workspacesService.addMember(id, userId, addMemberDto);

    return {
      success: true,
      message: 'Member added successfully',
      data: result,
    };
  }

  /**
   * Update member role
   * PUT /api/workspaces/:id/members/:memberId
   */
  @Put(':id/members/:memberId')
  @UseGuards(WorkspaceAdminGuard)
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    const result = await this.workspacesService.updateMemberRole(
      id,
      memberId,
      userId,
      updateMemberRoleDto,
    );

    return {
      success: true,
      message: 'Member role updated successfully',
      data: result,
    };
  }

  /**
   * Remove member from workspace
   * DELETE /api/workspaces/:id/members/:memberId
   */
  @Delete(':id/members/:memberId')
  @UseGuards(WorkspaceAdminGuard)
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.workspacesService.removeMember(id, memberId, userId);

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Leave workspace
   * POST /api/workspaces/:id/leave
   */
  @Post(':id/leave')
  @UseGuards(WorkspaceMemberGuard)
  @HttpCode(HttpStatus.OK)
  async leaveWorkspace(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.workspacesService.leaveWorkspace(id, userId);

    return {
      success: true,
      ...result,
    };
  }
}
