import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship } from './friendship.entity';
import { User } from '../users/user.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendRepo: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async addFriend(userId: number, friendId: number) {
    try {
      if (userId === friendId) {
        throw new BadRequestException("You can't add yourself as a friend");
      }

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const friend = await this.userRepo.findOne({ where: { id: friendId } });
      if (!friend) {
        throw new NotFoundException('Friend not found');
      }

      // Check if friendship exists (either direction)
      const exists = await this.friendRepo.findOne({
        where: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId }
        ],
      });

      if (exists) {
        throw new BadRequestException('Already friends');
      }

      // Create mutual friendship
      const friendship1 = this.friendRepo.create({
        userId: userId,
        friendId: friendId,
        user: user,
        friend: friend
      });

      const friendship2 = this.friendRepo.create({
        userId: friendId,
        friendId: userId,
        user: friend,
        friend: user
      });

      await this.friendRepo.save([friendship1, friendship2]);

      return { message: 'Friend added successfully' };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error adding friend:', error);
      throw new BadRequestException('Failed to add friend');
    }
  }

  async listFriends(userId: number) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const friendships = await this.friendRepo.find({
        where: { userId: userId },
        relations: ['friend']
      });

      return friendships.map(friendship => ({
        id: friendship.friend.id,
        name: friendship.friend.name,
        email: friendship.friend.email
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error listing friends:', error);
      throw new BadRequestException('Failed to list friends');
    }
  }

  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    const friendship = await this.friendRepo.findOne({
      where: [
        { userId: userId1, friendId: userId2 },
        { userId: userId2, friendId: userId1 }
      ],
    });

    return !!friendship;
  }
}
