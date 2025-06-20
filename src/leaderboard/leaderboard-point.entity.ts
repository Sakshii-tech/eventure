import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Event } from '../events/event.entity';

@Entity('leaderboard_points')
@Unique(['friend', 'creator', 'event'])
export class LeaderboardPoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'friend_id', type: 'int' })
  friendId: number;

  @Column({ name: 'creator_id', type: 'int' })
  creatorId: number;

  @Column({ name: 'event_id', type: 'int', nullable: true })
  eventId: number | null;

  @ManyToOne(() => User, user => user.leaderboardAsFriend, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'friend_id' })
  friend: User;

  @ManyToOne(() => User, user => user.leaderboardCreated, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  event: Event;

  @Column()
  points: number;
}
