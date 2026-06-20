import { Test, TestingModule } from '@nestjs/testing';
import { SitesService } from './sites.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('SitesService', () => {
  let service: SitesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    site: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      $queryRaw: jest.fn(),
    },
    calendarNote: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SitesService>(SitesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSite', () => {
    it('should create a new site', async () => {
      const createSiteDto = {
        name: 'GitHub',
        url: 'https://github.com',
        color: 'blue',
      };

      const expectedResult = {
        id: '1',
        ...createSiteDto,
        userId: 'user1',
        isActive: true,
      };

      mockPrismaService.site.create.mockResolvedValue(expectedResult);

      const result = await service.createSite('user1', createSiteDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.site.create).toHaveBeenCalledWith({
        data: expect.objectContaining(createSiteDto),
      });
    });
  });

    describe('getUserSites', () => {
    it('should return user sites', async () => {
      const expectedResult = [
        {
          id: '1',
          name: 'GitHub',
          url: 'https://github.com',
          color: 'blue',
        },
      ];

      mockPrismaService.site.findMany.mockResolvedValue(expectedResult);

      const result = await service.getUserSites('user1');

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.site.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when user has no sites', async () => {
      mockPrismaService.site.findMany.mockResolvedValue([]);

      const result = await service.getUserSites('user1');

      expect(result).toEqual([]);
    });
  });

  describe('getSiteById', () => {
    const mockSite = {
      id: '1',
      name: 'GitHub',
      url: 'https://github.com',
      color: 'blue',
      userId: 'user1',
      isActive: true,
      notes: [],
    };

    it('should return site with notes when user owns it', async () => {
      mockPrismaService.site.findUnique.mockResolvedValue(mockSite);

      const result = await service.getSiteById('1', 'user1');

      expect(result).toEqual(mockSite);
      expect(mockPrismaService.site.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          notes: {
            where: { userId: 'user1' },
            orderBy: { date: 'desc' },
            take: 10,
          },
        },
      });
    });

    it('should throw NotFoundException when site not found', async () => {
      mockPrismaService.site.findUnique.mockResolvedValue(null);

      await expect(service.getSiteById('999', 'user1')).rejects.toThrow('Site bulunamadı');
    });

    it('should throw ForbiddenException when user does not own site', async () => {
      const otherUserSite = { ...mockSite, userId: 'user2' };
      mockPrismaService.site.findUnique.mockResolvedValue(otherUserSite);

      await expect(service.getSiteById('1', 'user1')).rejects.toThrow('Bu siteyi görüntüleme yetkiniz yok');
    });
  });

  describe('updateSite', () => {
    const mockSite = {
      id: '1',
      name: 'GitHub',
      url: 'https://github.com',
      color: 'blue',
      userId: 'user1',
    };

    it('should update site when user owns it', async () => {
      const updateDto = { name: 'GitHub Updated', color: 'green' };
      const updatedSite = { ...mockSite, ...updateDto };

      mockPrismaService.site.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.site.update.mockResolvedValue(updatedSite);

      const result = await service.updateSite('1', 'user1', updateDto);

      expect(result).toEqual(updatedSite);
      expect(mockPrismaService.site.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
      });
    });

    it('should throw NotFoundException when site not found', async () => {
      mockPrismaService.site.findUnique.mockResolvedValue(null);

      await expect(service.updateSite('999', 'user1', {})).rejects.toThrow('Site bulunamadı');
    });

    it('should throw ForbiddenException when user does not own site', async () => {
      const otherUserSite = { ...mockSite, userId: 'user2' };
      mockPrismaService.site.findUnique.mockResolvedValue(otherUserSite);

      await expect(service.updateSite('1', 'user1', {})).rejects.toThrow('Bu siteyi güncelleme yetkiniz yok');
    });
  });

  describe('deleteSite', () => {
    const mockSite = {
      id: '1',
      name: 'GitHub',
      url: 'https://github.com',
      color: 'blue',
      userId: 'user1',
    };

    it('should soft delete site when user owns it', async () => {
      mockPrismaService.site.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.site.update.mockResolvedValue({ isActive: false });

      const result = await service.deleteSite('1', 'user1');

      expect(result).toEqual({ message: 'Site silindi' });
      expect(mockPrismaService.site.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when site not found', async () => {
      mockPrismaService.site.findUnique.mockResolvedValue(null);

      await expect(service.deleteSite('999', 'user1')).rejects.toThrow('Site bulunamadı');
    });

    it('should throw ForbiddenException when user does not own site', async () => {
      const otherUserSite = { ...mockSite, userId: 'user2' };
      mockPrismaService.site.findUnique.mockResolvedValue(otherUserSite);

      await expect(service.deleteSite('1', 'user1')).rejects.toThrow('Bu siteyi silme yetkiniz yok');
    });
  });

  describe('getSiteStats', () => {
    const mockSite = {
      id: '1',
      name: 'GitHub',
      url: 'https://github.com',
      color: 'blue',
      userId: 'user1',
    };

    it('should return site stats when user owns site', async () => {
      const mockNotesByMonth = [
        { month: new Date('2026-01-01'), count: 10 },
        { month: new Date('2026-02-01'), count: 15 },
      ];

      mockPrismaService.site.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.calendarNote.count.mockResolvedValue(25);
      mockPrismaService.$queryRaw.mockResolvedValue(mockNotesByMonth);

      const result = await service.getSiteStats('1', 'user1');

      expect(result).toEqual({
        siteId: '1',
        name: 'GitHub',
        noteCount: 25,
        notesByMonth: mockNotesByMonth,
      });
      expect(mockPrismaService.calendarNote.count).toHaveBeenCalledWith({
        where: { siteId: '1' },
      });
    });

    it('should throw NotFoundException when site not found', async () => {
      mockPrismaService.site.findUnique.mockResolvedValue(null);

      await expect(service.getSiteStats('999', 'user1')).rejects.toThrow('Site bulunamadı');
    });

    it('should throw NotFoundException when user does not own site', async () => {
      const otherUserSite = { ...mockSite, userId: 'user2' };
      mockPrismaService.site.findUnique.mockResolvedValue(otherUserSite);

      await expect(service.getSiteStats('1', 'user1')).rejects.toThrow('Site bulunamadı');
    });

    it('should return zero notes when site has no notes', async () => {
      mockPrismaService.site.findUnique.mockResolvedValue(mockSite);
      mockPrismaService.calendarNote.count.mockResolvedValue(0);
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.getSiteStats('1', 'user1');

      expect(result.noteCount).toBe(0);
      expect(result.notesByMonth).toEqual([]);
    });
  });
});
