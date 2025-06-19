import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('leaderboard_points')
@Unique(['friend', 'creator'])
export class LeaderboardPoint {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  friend: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  creator: User;

  @Column()
  points: number;
}
