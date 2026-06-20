import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Param,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FileService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(private readonly fileService: FileService) {}

  /**
   * Upload a single file
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = randomBytes(16).toString('hex');
          const ext = extname(file.originalname);
          const baseName = file.originalname.replace(ext, '').substring(0, 50);
          cb(null, `${baseName}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedMimes = [
          'text/plain',
          'text/html',
          'text/css',
          'text/javascript',
          'application/javascript',
          'application/json',
          'application/xml',
          'text/xml',
          'text/x-python',
          'text/x-java-source',
          'text/x-c',
          'text/x-c++',
          'text/x-csharp',
          'text/x-go',
          'text/x-rust',
          'text/x-php',
          'text/x-ruby',
          'text/x-swift',
          'text/x-kotlin',
          'application/sql',
          'text/x-yaml',
          'text/x-markdown',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];

        const allowedExtensions = [
          '.txt', '.md', '.json', '.xml', '.yaml', '.yml',
          '.js', '.jsx', '.ts', '.tsx',
          '.py', '.java', '.c', '.cpp', '.h', '.hpp',
          '.cs', '.go', '.rs', '.php', '.rb',
          '.swift', '.kt', '.sql',
          '.html', '.css', '.scss',
          '.jpg', '.jpeg', '.png', '.gif', '.webp',
        ];

        const ext = extname(file.originalname).toLowerCase();
        const isAllowedType = allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext);

        if (isAllowedType) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`File type ${file.mimetype} is not allowed`), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`User ${user.id} uploaded file: ${file.originalname}`);

    return await this.fileService.createFileRecord({
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedById: user.id,
    });
  }

  /**
   * Upload multiple files
   */
  @Post('upload/multiple')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = randomBytes(16).toString('hex');
          const ext = extname(file.originalname);
          const baseName = file.originalname.replace(ext, '').substring(0, 50);
          cb(null, `${baseName}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'text/plain',
          'text/html',
          'text/css',
          'text/javascript',
          'application/javascript',
          'application/json',
          'application/xml',
          'text/xml',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];

        const allowedExtensions = [
          '.txt', '.md', '.json', '.xml', '.yaml', '.yml',
          '.js', '.jsx', '.ts', '.tsx',
          '.py', '.java', '.c', '.cpp', '.h', '.hpp',
          '.cs', '.go', '.rs', '.php', '.rb',
          '.swift', '.kt', '.sql',
          '.html', '.css', '.scss',
          '.jpg', '.jpeg', '.png', '.gif', '.webp',
        ];

        const ext = extname(file.originalname).toLowerCase();
        const isAllowedType = allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext);

        if (isAllowedType) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`File type ${file.mimetype} is not allowed`), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
      },
    }),
  )
  async uploadFiles(
    @CurrentUser() user: { id: string },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    this.logger.log(`User ${user.id} uploaded ${files.length} files`);

    const fileRecords = await Promise.all(
      files.map((file) =>
        this.fileService.createFileRecord({
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedById: user.id,
        }),
      ),
    );

    return { files: fileRecords };
  }

  /**
   * Get file by ID
   */
  @Get(':id')
  async getFile(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const file = await this.fileService.findFile(id);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check access - user must have uploaded the file or have access to the workspace
    if (file.uploadedById !== user.id) {
      // TODO: Add workspace access check
      throw new NotFoundException('File not found');
    }

    return file;
  }

  /**
   * Download file by ID
   */
  @Get(':id/download')
  async downloadFile(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const file = await this.fileService.findFile(id);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check access
    if (file.uploadedById !== user.id) {
      throw new NotFoundException('File not found');
    }

    return {
      filename: file.originalName,
      url: `/uploads/${file.filename}`,
      mimetype: file.mimetype,
    };
  }

  /**
   * Delete file by ID
   */
  @Delete(':id')
  async deleteFile(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const file = await this.fileService.findFile(id);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check access - only uploader can delete
    if (file.uploadedById !== user.id) {
      throw new BadRequestException('You do not have permission to delete this file');
    }

    await this.fileService.deleteFile(id);
    await this.fileService.deletePhysicalFile(file.filename);

    this.logger.log(`User ${user.id} deleted file: ${file.originalName}`);

    return { message: 'File deleted successfully' };
  }
}
