import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Order } from "../../order/entities/order.entity";

export enum TailorSpecialty {
  DRESSES = "dresses",
  SUITS = "suits",
  ALTERATIONS = "alterations",
  CUSTOM_DESIGN = "custom_design",
  TRADITIONAL = "traditional"
}

@Entity()
export class Tailor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: TailorSpecialty, array: true })
  specialties: TailorSpecialty[];

  @Column({ type: 'int', default: 0 })
  currentWorkload: number;

  @Column({ type: 'int', default: 40 })
  maxWeeklyCapacity: number;

  @OneToMany(() => Order, order => order.tailor)
  orders: Order[];

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}