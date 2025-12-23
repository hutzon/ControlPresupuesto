import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#([0-9A-F]{3}){1,2}$/i, { message: 'Color must be a valid hex code' })
  color?: string;
}

export class UpdateCategoryDto extends CreateCategoryDto {}
