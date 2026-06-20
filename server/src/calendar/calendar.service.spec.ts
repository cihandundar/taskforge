import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('CalendarService', () => {
  let service: CalendarService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    calendarNote: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNote', () => {
    it('should create a calendar note', async () => {
      const createNoteDto = {
        date: '2024-01-15',
        note: 'Test note',
        color: 'blue',
        status: 'todo',
      };

      const expectedResult = {
        id: '1',
        ...createNoteDto,
        userId: 'user1',
        user: { id: 'user1', name: 'Test User', email: 'test@example.com' },
      };

      mockPrismaService.calendarNote.create.mockResolvedValue(expectedResult);

      const result = await service.createNote('user1', createNoteDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.calendarNote.create).toHaveBeenCalledWith({
        data: {
          date: createNoteDto.date,
          note: createNoteDto.note,
          color: createNoteDto.color,
          status: createNoteDto.status || 'todo',
          userId: 'user1',
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
    });
  });

  describe('getMyNotes', () => {
    it('should return user notes', async () => {
      const expectedResult = [
        {
          id: '1',
          date: '2024-01-15',
          note: 'Test note',
          color: 'blue',
          userId: 'user1',
          user: { id: 'user1', name: 'Test User', email: 'test@example.com' },
        },
      ];

      mockPrismaService.calendarNote.findMany.mockResolvedValue(expectedResult);

      const result = await service.getMyNotes('user1');

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.calendarNote.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
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
    });
  });

  describe('getAllNotes', () => {
    it('should return all notes', async () => {
      const expectedResult = [
        {
          id: '1',
          date: '2024-01-15',
          note: 'Test note',
          color: 'blue',
          userId: 'user1',
          user: { id: 'user1', name: 'Test User', email: 'test@example.com' },
        },
      ];

      mockPrismaService.calendarNote.findMany.mockResolvedValue(expectedResult);

      const result = await service.getAllNotes();

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.calendarNote.findMany).toHaveBeenCalledWith({
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
    });
  });
});
