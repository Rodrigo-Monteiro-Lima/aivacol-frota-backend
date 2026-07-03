import { CreateModelDto } from './create-model.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateModelDto extends PartialType(CreateModelDto) {}
