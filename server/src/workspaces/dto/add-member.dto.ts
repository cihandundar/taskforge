import { IsString, IsEnum, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

export class AddMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(MemberRole)
  @IsOptional()
  role?: MemberRole = MemberRole.MEMBER;
}
