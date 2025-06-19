import { Entity, PrimaryColumn, ManyToOne, Check } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('friendships')
@Check(`"user_id" <> "friend_id"`)
export class Friendship {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'friend_id' })
  friendId: number;

  @ManyToOne(() => User, (user: User) => user.outgoingFriends, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => User, (user: User) => user.incomingFriends, { onDelete: 'CASCADE' })
  friend: User;
}
