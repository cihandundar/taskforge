import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class BlockOrderDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  parentId?: string | null;

  position: number;
}

export class ReorderBlocksDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockOrderDto)
  blocks: BlockOrderDto[];
}
