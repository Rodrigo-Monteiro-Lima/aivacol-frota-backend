import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateVehicleDto {
  @IsNotEmpty({ message: 'A placa do veículo é obrigatória.' })
  @IsString({ message: 'A placa deve ser uma string.' })
  @Length(7, 10, { message: 'A placa deve ter entre 7 e 10 caracteres.' })
  license_plate!: string;

  @IsNotEmpty({ message: 'O chassi do veículo é obrigatório.' })
  @IsString({ message: 'O chassi deve ser uma string.' })
  @Length(17, 17, {
    message:
      'O chassi deve ter exatamente 17 caracteres (padrão internacional).',
  })
  chassis!: string;

  @IsNotEmpty({ message: 'O código RENAVAM é obrigatório.' })
  @IsString({ message: 'O RENAVAM deve ser uma string.' })
  @Length(9, 11, { message: 'O RENAVAM deve ter entre 9 e 11 dígitos.' })
  renavam!: string;

  @IsNotEmpty({ message: 'O ano do veículo é obrigatório.' })
  @IsInt({ message: 'O ano deve ser um número inteiro.' })
  @Min(1900, { message: 'O ano do veículo não pode ser anterior a 1900.' })
  @Max(new Date().getFullYear() + 1, {
    message: `O ano do veículo não pode ser superior a ${new Date().getFullYear() + 1}.`,
  })
  year!: number;

  @IsNotEmpty({ message: 'O ID do modelo é obrigatório.' })
  @IsUUID(undefined, {
    message: 'O model_id deve ser um UUID de versão 4 válido.',
  })
  model_id!: string;
}
