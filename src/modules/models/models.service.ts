import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model) private readonly modelRepo: Repository<Model>,
  ) {}

  async create(dto: CreateModelDto, createdBy: string): Promise<Model> {
    const model = this.modelRepo.create({ ...dto, created_by: createdBy });
    return this.modelRepo.save(model);
  }

  async findAll(): Promise<Model[]> {
    return this.modelRepo.find();
  }

  async findOne(id: string): Promise<Model> {
    const model = await this.modelRepo.findOne({ where: { id } });
    if (!model) {
      throw new NotFoundException(`Model com id "${id}" não encontrado`);
    }
    return model;
  }

  async update(id: string, dto: UpdateModelDto): Promise<Model> {
    const model = await this.findOne(id);
    Object.assign(model, dto);
    return this.modelRepo.save(model);
  }

  async remove(id: string): Promise<void> {
    const model = await this.findOne(id);
    await this.modelRepo.remove(model);
  }
}
