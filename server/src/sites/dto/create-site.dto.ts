import { IsString, IsNotEmpty, IsOptional, IsUrl, MaxLength, IsEnum, Matches } from 'class-validator';

export class CreateSiteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsUrl({}, { message: 'Geçerli bir URL giriniz' })
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  @IsEnum(['blue', 'green', 'yellow', 'red', 'purple'], {
    message: 'Geçerli bir renk seçiniz (blue, green, yellow, red, purple)'
  })
  color?: string;
}

export class UpdateSiteDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsUrl({}, { message: 'Geçerli bir URL giriniz' })
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['blue', 'green', 'yellow', 'red', 'purple'], {
    message: 'Geçerli bir renk seçiniz (blue, green, yellow, red, purple)'
  })
  color?: string;
}
