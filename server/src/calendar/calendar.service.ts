import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCalendarDto, UpdateCalendarDto } from './dto';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async createNote(userId: string, createNoteDto: CreateCalendarDto) {
    const { date, note, color, siteId, status } = createNoteDto;

    return this.prisma.calendarNote.create({
      data: {
        date,
        note,
        color: color || 'blue',
        status: status || 'todo',
        userId,
        siteId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            color: true,
            url: true,
          },
        },
      },
    });
  }

  async getMyNotes(userId: string) {
    return this.prisma.calendarNote.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            color: true,
            url: true,
          },
        },
      },
    });
  }

  async getAllNotes() {
    return this.prisma.calendarNote.findMany({
      orderBy: { date: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            color: true,
            url: true,
          },
        },
      },
    });
  }

  async updateNote(noteId: string, userId: string, updateNoteDto: UpdateCalendarDto) {
    const note = await this.prisma.calendarNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Not bulunamadı');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('Bu notu güncelleme yetkiniz yok');
    }

    return this.prisma.calendarNote.update({
      where: { id: noteId },
      data: updateNoteDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            color: true,
            url: true,
          },
        },
      },
    });
  }

  async deleteNote(noteId: string, userId: string) {
    const note = await this.prisma.calendarNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Not bulunamadı');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('Bu notu silme yetkiniz yok');
    }

    await this.prisma.calendarNote.delete({
      where: { id: noteId },
    });

    return { message: 'Not silindi' };
  }
}
