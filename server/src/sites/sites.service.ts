import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async createSite(userId: string, createSiteDto: any) {
    const { name, url, color } = createSiteDto;

    return this.prisma.site.create({
      data: {
        name,
        url,
        color: color || 'blue',
        userId,
      },
    });
  }

  async getUserSites(userId: string) {
    return this.prisma.site.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSiteById(siteId: string, userId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: {
        notes: {
          where: { userId },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!site) {
      throw new NotFoundException('Site bulunamadı');
    }

    if (site.userId !== userId) {
      throw new ForbiddenException('Bu siteyi görüntüleme yetkiniz yok');
    }

    return site;
  }

  async updateSite(siteId: string, userId: string, updateSiteDto: any) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundException('Site bulunamadı');
    }

    if (site.userId !== userId) {
      throw new ForbiddenException('Bu siteyi güncelleme yetkiniz yok');
    }

    return this.prisma.site.update({
      where: { id: siteId },
      data: updateSiteDto,
    });
  }

  async deleteSite(siteId: string, userId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundException('Site bulunamadı');
    }

    if (site.userId !== userId) {
      throw new ForbiddenException('Bu siteyi silme yetkiniz yok');
    }

    await this.prisma.site.update({
      where: { id: siteId },
      data: { isActive: false },
    });

    return { message: 'Site silindi' };
  }

  async getSiteStats(siteId: string, userId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site || site.userId !== userId) {
      throw new NotFoundException('Site bulunamadı');
    }

    const noteCount = await this.prisma.calendarNote.count({
      where: { siteId },
    });

    try {
      const notesByMonth = await this.prisma.$queryRaw`
        SELECT
          TO_DATE(date, 'YYYY-MM-DD') as month,
          COUNT(*) as count
        FROM calendar_notes
        WHERE site_id = ${siteId}::uuid
        GROUP BY DATE_TRUNC('month', TO_DATE(date, 'YYYY-MM-DD'))
        ORDER BY month DESC
        LIMIT 12
      `;

      return {
        siteId: site.id,
        name: site.name,
        noteCount,
        notesByMonth,
      };
    } catch (error) {
      // If query fails, return stats without monthly breakdown
      return {
        siteId: site.id,
        name: site.name,
        noteCount,
        notesByMonth: [],
      };
    }
  }
}
