import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string;

  @Column()
  userId: number;

  @Column()
  performedBy: number;

  @Column('json', { nullable: true })
  details: any;

  @CreateDateColumn()
  timestamp: Date;
}
