import { IsString, MinLength } from 'class-validator';

export class CreateModelDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
