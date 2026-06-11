import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsString, IsOptional } from 'class-validator';
import { CreatePageDto } from './create-page.dto';

export class UpdatePageDto extends PartialType(
  OmitType(CreatePageDto, ['workspaceId', 'parentId'] as const),
) {
  // Allow workspaceId and parentId to be updated separately
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
