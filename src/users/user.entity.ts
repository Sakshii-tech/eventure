import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany
} from 'typeorm';
import { Event } from '../events/event.entity';
import { EventAcknowledgment } from '../events/event-ack.entity';
import { Friendship } from '../friends/friendship.entity';
import { LeaderboardPoint } from '../leaderboard/leaderboard.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Event, (event: Event) => event.creator)
  events: Event[];

  @OneToMany(() => EventAcknowledgment, (ack: EventAcknowledgment) => ack.user)
  acknowledgments: EventAcknowledgment[];

  @OneToMany(() => Friendship, (friendship: Friendship) => friendship.user)
  outgoingFriends: Friendship[];

  @OneToMany(() => Friendship, (friendship: Friendship) => friendship.friend)
  incomingFriends: Friendship[];

  @OneToMany(() => LeaderboardPoint, (lb: LeaderboardPoint) => lb.creator)
  leaderboardCreated: LeaderboardPoint[];

  @OneToMany(() => LeaderboardPoint, (lb: LeaderboardPoint) => lb.friend)
  leaderboardAsFriend: LeaderboardPoint[];
}
