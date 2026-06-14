import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentDto } from './create-comment.dto';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(10000)
  content?: string;
}
