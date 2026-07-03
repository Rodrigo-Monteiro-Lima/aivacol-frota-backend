import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle } from './entities/vehicle.entity';
import { Model } from '../models/entities/model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Model])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
