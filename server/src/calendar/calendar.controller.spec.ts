import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

describe('CalendarController', () => {
  let controller: CalendarController;
  let service: CalendarService;

  const mockCalendarService = {
    createNote: jest.fn(),
    getMyNotes: jest.fn(),
    getAllNotes: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
      ],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);
    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
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
      };

      mockCalendarService.createNote.mockResolvedValue(expectedResult);

      const result = await controller.create(mockRequest as any, createNoteDto);

      expect(result).toEqual(expectedResult);
      expect(mockCalendarService.createNote).toHaveBeenCalledWith(
        mockRequest.user.id,
        createNoteDto
      );
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
        },
      ];

      mockCalendarService.getMyNotes.mockResolvedValue(expectedResult);

      const result = await controller.getMyNotes(mockRequest as any);

      expect(result).toEqual(expectedResult);
      expect(mockCalendarService.getMyNotes).toHaveBeenCalledWith('user1');
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
        },
      ];

      mockCalendarService.getAllNotes.mockResolvedValue(expectedResult);

      const result = await controller.getAllNotes();

      expect(result).toEqual(expectedResult);
      expect(mockCalendarService.getAllNotes).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a note', async () => {
      const updateNoteDto = {
        note: 'Updated note',
        color: 'green',
      };

      const expectedResult = {
        id: '1',
        ...updateNoteDto,
        userId: 'user1',
      };

      mockCalendarService.updateNote.mockResolvedValue(expectedResult);

      const result = await controller.update('1', mockRequest as any, updateNoteDto);

      expect(result).toEqual(expectedResult);
      expect(mockCalendarService.updateNote).toHaveBeenCalledWith(
        '1',
        'user1',
        updateNoteDto
      );
    });
  });

  describe('delete', () => {
    it('should delete a note', async () => {
      const expectedResult = { message: 'Not silindi' };

      mockCalendarService.deleteNote.mockResolvedValue(expectedResult);

      const result = await controller.delete('1', mockRequest as any);

      expect(result).toEqual(expectedResult);
      expect(mockCalendarService.deleteNote).toHaveBeenCalledWith('1', 'user1');
    });
  });
});
