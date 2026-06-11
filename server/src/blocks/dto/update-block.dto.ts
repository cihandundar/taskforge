import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { CreateBlockDto } from './create-block.dto';
import { BlockType } from '@prisma/client';

export class UpdateBlockDto extends PartialType(CreateBlockDto) {
  @IsEnum(BlockType)
  @IsOptional()
  type?: BlockType;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsObject()
  @IsOptional()
  props?: Record<string, any>;
}
