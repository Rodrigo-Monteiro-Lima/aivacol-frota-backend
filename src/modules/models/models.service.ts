import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { Brand } from '../brands/entities/brand.entity';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model) private readonly modelRepo: Repository<Model>,
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
  ) {}

  async create(dto: CreateModelDto, createdBy: string): Promise<Model> {
    await this.assertBrandExists(dto.brand_id);
    const model = this.modelRepo.create({ ...dto, created_by: createdBy });
    return this.modelRepo.save(model);
  }

  async findAll(): Promise<Model[]> {
    return this.modelRepo.find();
  }

  async findOne(id: string): Promise<Model> {
    const model = await this.modelRepo.findOne({ where: { id } });
    if (!model) {
      throw new NotFoundException(`Modelo não encontrado`);
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

    const vehicleCount = await this.modelRepo
      .createQueryBuilder('model')
      .leftJoin('model.vehicles', 'vehicle')
      .where('model.id = :id', { id })
      .andWhere('vehicle.id IS NOT NULL')
      .getCount();

    if (vehicleCount > 0) {
      throw new ConflictException(
        'Não é possível remover um modelo com veículos vinculados',
      );
    }

    await this.modelRepo.remove(model);
  }

  private async assertBrandExists(brandId: string): Promise<void> {
    const model = await this.brandRepo.findOne({ where: { id: brandId } });
    if (!model) {
      throw new NotFoundException(`Marca não encontrada`);
    }
  }
}
