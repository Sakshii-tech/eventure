import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Unique
} from 'typeorm';
import { Event } from './event.entity';
import { User } from '../users/user.entity';

@Entity('event_acknowledgments')
@Unique(['event', 'user'])
export class EventAcknowledgment {
  @PrimaryGeneratedColumn()
  id: number;

  // @ManyToOne(() => Event, (event: Event) => event.acknowledgments, { onDelete: 'CASCADE' })
  // event: Event;

  @ManyToOne(() => User, (user: User) => user.acknowledgments, { onDelete: 'CASCADE' })
  user: User;
  @ManyToOne(() => Event, event => event.acknowledgments, { onDelete: 'CASCADE' })
 event: Event;

  @CreateDateColumn({ name: 'acknowledged_at' })
  acknowledgedAt: Date;

  @Column({ name: 'order_position' })
  orderPosition: number;

  @Column({ name: 'points_earned' })
  pointsEarned: number;
}
