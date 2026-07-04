import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateBrandDto {
  @IsNotEmpty({ message: 'O nome da marca é obrigatório.' })
  @IsString({ message: 'O nome da marca deve ser um texto válido.' })
  @MinLength(2, {
    message: 'O nome da marca deve ter pelo menos 2 caracteres.',
  })
  name!: string;
}
