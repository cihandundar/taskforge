import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';

export enum ColorEnum {
  BLUE = 'blue',
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
  PURPLE = 'purple',
}

export enum StatusEnum {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateCalendarDto {
  @IsString()
  @IsNotEmpty()
  date: string; // YYYY-MM-DD format

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  note: string;

  @IsEnum(ColorEnum)
  @IsOptional()
  color?: ColorEnum;

  @IsEnum(StatusEnum)
  @IsOptional()
  status?: StatusEnum;

  @IsString()
  @IsOptional()
  siteId?: string;
}
