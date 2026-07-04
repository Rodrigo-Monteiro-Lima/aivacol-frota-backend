import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Brand } from '../../brands/entities/brand.entity';

@Entity('models')
export class Model extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.model)
  vehicles!: Vehicle[];

  @Column({ name: 'brand_id' })
  brand_id!: string;

  @ManyToOne(() => Brand, (brand) => brand.models)
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;
}
