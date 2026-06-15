import { IsString, IsOptional, IsEnum, IsObject, IsNotEmpty } from 'class-validator';
import { BlockType } from '@prisma/client';

export class BlockEventDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsEnum(BlockType)
  @IsOptional()
  type?: BlockType;

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

  @IsString()
  @IsOptional()
  timestamp?: string;

  @IsString()
  @IsOptional()
  previousContent?: string;
}

export class TypingEventDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsString()
  @IsNotEmpty()
  blockId: string;
}
