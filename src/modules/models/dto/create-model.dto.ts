import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateModelDto {
  @IsNotEmpty({ message: 'O nome do modelo é obrigatório.' })
  @IsString({ message: 'O nome do modelo deve ser um texto válido.' })
  @MinLength(2, {
    message: 'O nome do modelo deve ter pelo menos 2 caracteres.',
  })
  @MaxLength(100, {
    message: 'O nome do modelo não pode passar de 100 caracteres.',
  })
  name!: string;
}
