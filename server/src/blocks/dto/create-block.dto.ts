import { IsString, IsOptional, IsEnum, IsObject, IsNotEmpty } from 'class-validator';
import { BlockType } from '@prisma/client';

export class CreateBlockDto {
  @IsEnum(BlockType)
  @IsNotEmpty()
  type: BlockType;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsObject()
  @IsOptional()
  props?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
