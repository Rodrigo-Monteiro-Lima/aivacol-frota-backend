import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand) private readonly brandRepo: Repository<Brand>,
  ) {}

  create(dto: CreateBrandDto, createdBy: string): Promise<Brand> {
    const brand = this.brandRepo.create({ ...dto, created_by: createdBy });
    return this.brandRepo.save(brand);
  }

  findAll(): Promise<Brand[]> {
    return this.brandRepo.find({ relations: { models: true } });
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandRepo.findOne({
      where: { id },
      relations: { models: true },
    });
    if (!brand) {
      throw new NotFoundException(`Marca não encontrada`);
    }
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);
    Object.assign(brand, dto);
    return this.brandRepo.save(brand);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.findOne(id);
    await this.brandRepo.remove(brand);
  }
}
