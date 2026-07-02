import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Model } from '../../models/entities/model.entity';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'license_plate', type: 'varchar', length: 10 })
  license_plate!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  chassis!: string;

  @Index({ unique: true })
  @Column()
  renavam!: string;

  @Column({ type: 'int' })
  year!: number;

  @ManyToOne(() => Model, (model) => model.vehicles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'model_id' })
  model!: Model;

  @Column({ name: 'model_id', type: 'uuid' })
  model_id!: string;
}
