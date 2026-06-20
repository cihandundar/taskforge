import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalı' })
  @MaxLength(128, { message: 'Şifre çok uzun' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Şifre en az 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter içermelidir (@$!%*?&)'
  })
  password: string;

  @IsString()
  @MinLength(2, { message: 'İsim en az 2 karakter olmalı' })
  @MaxLength(50, { message: 'İsim çok uzun' })
  @IsOptional()
  name?: string;
}
