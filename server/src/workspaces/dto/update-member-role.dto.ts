import { IsEnum, IsNotEmpty } from 'class-validator';
import { MemberRole } from './add-member.dto';

export class UpdateMemberRoleDto {
  @IsEnum(MemberRole)
  @IsNotEmpty()
  role: MemberRole;
}
