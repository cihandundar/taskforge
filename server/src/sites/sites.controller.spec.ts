import { Test, TestingModule } from '@nestjs/testing';
import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';

describe('SitesController', () => {
  let controller: SitesController;
  let service: SitesService;

  const mockSitesService = {
    createSite: jest.fn(),
    getUserSites: jest.fn(),
    getSiteById: jest.fn(),
    getSiteStats: jest.fn(),
    updateSite: jest.fn(),
    deleteSite: jest.fn(),
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
      controllers: [SitesController],
      providers: [
        {
          provide: SitesService,
          useValue: mockSitesService,
        },
      ],
    }).compile();

    controller = module.get<SitesController>(SitesController);
    service = module.get<SitesService>(SitesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new site', async () => {
      const createSiteDto = {
        name: 'GitHub',
        url: 'https://github.com',
        color: 'blue',
      };

      const expectedResult = { id: '1', ...createSiteDto };

      mockSitesService.createSite.mockResolvedValue(expectedResult);

      const result = await controller.create(mockRequest as any, createSiteDto);

      expect(result).toEqual(expectedResult);
      expect(mockSitesService.createSite).toHaveBeenCalledWith('user1', createSiteDto);
    });
  });

  describe('getUserSites', () => {
    it('should return user sites', async () => {
      const expectedResult = [
        { id: '1', name: 'GitHub', url: 'https://github.com', color: 'blue' },
      ];

      mockSitesService.getUserSites.mockResolvedValue(expectedResult);

      const result = await controller.getUserSites(mockRequest as any);

      expect(result).toEqual(expectedResult);
      expect(mockSitesService.getUserSites).toHaveBeenCalledWith('user1');
    });

    it('should return empty array when user has no sites', async () => {
      mockSitesService.getUserSites.mockResolvedValue([]);

      const result = await controller.getUserSites(mockRequest as any);

      expect(result).toEqual([]);
    });
  });

  describe('getSiteById', () => {
    it('should return site with notes', async () => {
      const expectedResult = {
        id: '1',
        name: 'GitHub',
        url: 'https://github.com',
        color: 'blue',
        notes: [],
      };

      mockSitesService.getSiteById.mockResolvedValue(expectedResult);

      const result = await controller.getSiteById('1', mockRequest as any);

      expect(result).toEqual(expectedResult);
      expect(mockSitesService.getSiteById).toHaveBeenCalledWith('1', 'user1');
    });
  });

  describe('getSiteStats', () => {
    it('should return site statistics', async () => {
      const expectedResult = {
        siteId: '1',
        name: 'GitHub',
        noteCount: 25,
        notesByMonth: [],
      };

      mockSitesService.getSiteStats.mockResolvedValue(expectedResult);

      const result = await controller.getSiteStats('1', mockRequest as any);

      expect(result).toEqual(expectedResult);
      expect(mockSitesService.getSiteStats).toHaveBeenCalledWith('1', 'user1');
    });
  });

  describe('update', () => {
    it('should update site', async () => {
      const updateDto = { name: 'GitHub Updated', color: 'green' };
      const expectedResult = {
        id: '1',
        name: 'GitHub Updated',
        url: 'https://github.com',
        color: 'green',
      };

      mockSitesService.updateSite.mockResolvedValue(expectedResult);

      const result = await controller.update('1', mockRequest as any, updateDto);

      expect(result).toEqual(expectedResult);
      expect(mockSitesService.updateSite).toHaveBeenCalledWith('1', 'user1', updateDto);
    });

    it('should update only provided fields', async () => {
      const updateDto = { color: 'red' };
      const expectedResult = {
        id: '1',
        name: 'GitHub',
        url: 'https://github.com',
        color: 'red',
      };

      mockSitesService.updateSite.mockResolvedValue(expectedResult);

      const result = await controller.update('1', mockRequest as any, updateDto);

      expect(result.color).toBe('red');
      expect(result.name).toBe('GitHub');
    });
  });

  describe('delete', () => {
    it('should delete site', async () => {
      const expectedResult = { message: 'Site silindi' };

      mockSitesService.deleteSite.mockResolvedValue(expectedResult);

      const result = await controller.delete('1', mockRequest as any);

      expect(result).toEqual(expectedResult);
      expect(mockSitesService.deleteSite).toHaveBeenCalledWith('1', 'user1');
    });
  });
});
