import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updated_at!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 100 })
  created_by!: string;
}
