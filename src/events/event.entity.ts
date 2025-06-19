// src/events/event.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { EventAcknowledgment } from './event-ack.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.events, { onDelete: 'CASCADE' })
  creator: User;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  mediaPath: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => EventAcknowledgment, ack => ack.event)
  acknowledgments: EventAcknowledgment[];
}
