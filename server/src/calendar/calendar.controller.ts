import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCalendarDto, UpdateCalendarDto } from './dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  create(@Request() req, @Body() createNoteDto: CreateCalendarDto) {
    return this.calendarService.createNote(req.user.id, createNoteDto);
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
  update(@Param('id') id: string, @Request() req, @Body() updateNoteDto: UpdateCalendarDto) {
    return this.calendarService.updateNote(id, req.user.id, updateNoteDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.calendarService.deleteNote(id, req.user.id);
  }
}
