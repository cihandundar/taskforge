import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class CreateMentionDto {
  @IsString()
  @IsNotEmpty()
  commentId: string;

  @IsArray()
  @IsString({ each: true })
  mentionedUserIds: string[];
}
