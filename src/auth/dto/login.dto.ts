import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  nickname!: string;

  @IsString()
  @MinLength(4)
  password!: string;
}
