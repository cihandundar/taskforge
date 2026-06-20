import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FileService } from './files.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FilesController],
  providers: [FileService],
  exports: [FileService],
})
export class FilesModule {}
