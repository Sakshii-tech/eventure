import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/users/user.entity';

@Entity('leaderboard_points')
export class LeaderboardPoint {
  @PrimaryColumn({ name: 'creator_id' })
  creatorId: number;

  @PrimaryColumn({ name: 'friend_id' })
  friendId: number;

  @ManyToOne(() => User, (user: User) => user.leaderboardCreated, { onDelete: 'CASCADE' })
  creator: User;

  @ManyToOne(() => User, (user: User) => user.leaderboardAsFriend, { onDelete: 'CASCADE' })
  friend: User;

  @Column({ name: 'total_points', default: 0 })
  totalPoints: number;
}
