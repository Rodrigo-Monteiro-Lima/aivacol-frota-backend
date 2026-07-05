import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Model } from '../models/entities/model.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { RedisService } from '../../redis/redis.service';
import { MessagingService } from '../../messaging/messaging.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Model)
    private readonly modelRepo: Repository<Model>,
    private readonly redis: RedisService,
    private readonly messaging: MessagingService,
  ) {}

  async create(dto: CreateVehicleDto, createdBy: string): Promise<Vehicle> {
    await this.assertModelExists(dto.model_id);
    await this.assertUnique(dto);

    const vehicle = this.vehicleRepo.create({ ...dto, created_by: createdBy });
    const savedVehicle = await this.vehicleRepo.save(vehicle);

    await this.invalidateCache('vehicles:all');
    this.messaging.publish('vehicle.created', {
      id: savedVehicle.id,
      license_plate: savedVehicle.license_plate,
      created_by: createdBy,
    });

    return savedVehicle;
  }

  async findAll(): Promise<Vehicle[]> {
    const cacheKey = 'vehicles:all';
    const cachedVehicles = await this.redis.get<Vehicle[]>(cacheKey);
    if (cachedVehicles) {
      return cachedVehicles;
    }

    const vehicles = await this.vehicleRepo.find({
      relations: { model: true },
    });

    await this.redis.set(cacheKey, vehicles);
    return vehicles;
  }

  async findOne(id: string): Promise<Vehicle> {
    const cacheKey = `vehicles:id:${id}`;
    const cachedVehicle = await this.redis.get<Vehicle>(cacheKey);
    if (cachedVehicle) {
      return cachedVehicle;
    }

    const vehicle = await this.vehicleRepo.findOne({
      where: { id },
      relations: { model: true },
    });
    if (!vehicle) {
      throw new NotFoundException(`Veículo não encontrado`);
    }

    await this.redis.set(cacheKey, vehicle);
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (dto.model_id && dto.model_id !== vehicle.model_id) {
      await this.assertModelExists(dto.model_id);
    }

    const changedFields: Partial<
      Pick<Vehicle, 'license_plate' | 'chassis' | 'renavam'>
    > = {};
    if (dto.license_plate && dto.license_plate !== vehicle.license_plate) {
      changedFields.license_plate = dto.license_plate;
    }
    if (dto.chassis && dto.chassis !== vehicle.chassis) {
      changedFields.chassis = dto.chassis;
    }
    if (dto.renavam && dto.renavam !== vehicle.renavam) {
      changedFields.renavam = dto.renavam;
    }

    if (Object.keys(changedFields).length > 0) {
      await this.assertUnique(changedFields, id);
    }

    Object.assign(vehicle, dto);
    const updatedVehicle = await this.vehicleRepo.save(vehicle);

    await this.invalidateCache('vehicles:all');
    await this.invalidateCache(`vehicles:id:${id}`);
    this.messaging.publish('vehicle.updated', {
      id: updatedVehicle.id,
      changes: dto,
    });

    return updatedVehicle;
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepo.remove(vehicle);
    await this.invalidateCache('vehicles:all');
    await this.invalidateCache(`vehicles:id:${id}`);
    this.messaging.publish('vehicle.deleted', { id });
  }

  private async invalidateCache(key: string): Promise<void> {
    await this.redis.del(key);
  }

  private async assertModelExists(modelId: string): Promise<void> {
    const model = await this.modelRepo.findOne({ where: { id: modelId } });
    if (!model) {
      throw new NotFoundException(`Modelo não encontrado`);
    }
  }

  private async assertUnique(
    fields: Partial<Pick<Vehicle, 'license_plate' | 'chassis' | 'renavam'>>,
    excludeId?: string,
  ): Promise<void> {
    const checks: Array<{
      field: 'license_plate' | 'chassis' | 'renavam';
      label: string;
    }> = [
      { field: 'license_plate', label: 'placa' },
      { field: 'chassis', label: 'chassi' },
      { field: 'renavam', label: 'renavam' },
    ];

    for (const { field, label } of checks) {
      const value = fields[field];
      if (!value) continue;

      const qb = this.vehicleRepo
        .createQueryBuilder('vehicle')
        .where(`vehicle.${field} = :value`, { value });

      if (excludeId) {
        qb.andWhere('vehicle.id != :excludeId', { excludeId });
      }

      const exists = await qb.getOne();
      if (exists) {
        throw new ConflictException(`Já existe um veículo com esse ${label}`);
      }
    }
  }
}
