import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  create(@Request() req, @Body() createNoteDto: any) {
    return this.calendarService.createNote(req.user.id, req.user.name, createNoteDto);
  }

  @Get()
  getMyNotes(@Request() req) {
    return this.calendarService.getMyNotes(req.user.id);
  }

  @Get('all')
  getAllNotes() {
    return this.calendarService.getAllNotes();
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req, @Body() updateNoteDto: any) {
    return this.calendarService.updateNote(id, req.user.id, updateNoteDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.calendarService.deleteNote(id, req.user.id);
  }
}
