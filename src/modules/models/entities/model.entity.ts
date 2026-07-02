import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('models')
export class Model extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.model)
  vehicles!: Vehicle[];
}
