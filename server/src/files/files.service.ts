import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface CreateFileRecord {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedById: string;
}

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a file record in the database
   */
  async createFileRecord(data: CreateFileRecord) {
    return await this.prisma.file.create({
      data: {
        originalName: data.originalName,
        filename: data.filename,
        mimetype: data.mimetype,
        size: data.size,
        path: data.path,
        uploadedBy: {
          connect: { id: data.uploadedById },
        },
      },
    });
  }

  /**
   * Find a file by ID
   */
  async findFile(id: string) {
    return await this.prisma.file.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find files by uploader ID
   */
  async findFilesByUploader(uploaderId: string) {
    return await this.prisma.file.findMany({
      where: { uploadedById: uploaderId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete a file record from the database
   */
  async deleteFile(id: string): Promise<void> {
    try {
      await this.prisma.file.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete file record: ${error.message}`);
      throw new NotFoundException('File not found or already deleted');
    }
  }

  /**
   * Delete physical file from disk
   */
  async deletePhysicalFile(filename: string): Promise<void> {
    const filePath = join(process.cwd(), 'uploads', filename);

    try {
      await fs.unlink(filePath);
      this.logger.log(`Deleted physical file: ${filename}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error(`Failed to delete physical file: ${error.message}`);
      }
      // If file doesn't exist, that's okay
    }
  }

  /**
   * Clean up orphaned files (files without database records)
   */
  async cleanupOrphanedFiles(): Promise<void> {
    const uploadsDir = join(process.cwd(), 'uploads');

    try {
      const files = await fs.readdir(uploadsDir);
      const dbFiles = await this.prisma.file.findMany({
        select: { filename: true },
      });

      const dbFilenames = new Set(dbFiles.map(f => f.filename));
      const orphanedFiles = files.filter(f => !dbFilenames.has(f));

      for (const orphan of orphanedFiles) {
        await this.deletePhysicalFile(orphan);
        this.logger.log(`Cleaned up orphaned file: ${orphan}`);
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup orphaned files: ${error.message}`);
    }
  }
}
