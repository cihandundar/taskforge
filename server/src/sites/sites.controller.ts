import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SitesService } from './sites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSiteDto, UpdateSiteDto } from './dto/create-site.dto';

@Controller('sites')
@UseGuards(JwtAuthGuard)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  create(@Request() req, @Body() createSiteDto: CreateSiteDto) {
    return this.sitesService.createSite(req.user.id, createSiteDto);
  }

  @Get()
  getUserSites(@Request() req) {
    return this.sitesService.getUserSites(req.user.id);
  }

  @Get(':id')
  getSiteById(@Param('id') id: string, @Request() req) {
    return this.sitesService.getSiteById(id, req.user.id);
  }

  @Get(':id/stats')
  getSiteStats(@Param('id') id: string, @Request() req) {
    return this.sitesService.getSiteStats(id, req.user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req, @Body() updateSiteDto: UpdateSiteDto) {
    return this.sitesService.updateSite(id, req.user.id, updateSiteDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.sitesService.deleteSite(id, req.user.id);
  }
}
