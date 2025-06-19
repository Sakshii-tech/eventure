import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardPoint } from './leaderboard-point.entity';
import { User } from '../users/user.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(LeaderboardPoint)
    private readonly pointsRepo: Repository<LeaderboardPoint>,
  ) {}

  async addPoints(creatorId: number, friendId: number, points: number) {
    let record = await this.pointsRepo.findOne({
      where: { creator: { id: creatorId }, friend: { id: friendId } },
      relations: ['creator', 'friend'],
    });

    if (!record) {
      record = this.pointsRepo.create({
        creator: { id: creatorId },
        friend: { id: friendId },
        points: 0,
      });
    }

    record.points += points;
    return this.pointsRepo.save(record);
  }

  async getLeaderboard(userId: number) {
    const leaderboard = await this.pointsRepo.find({
      where: { creator: { id: userId } },
      relations: ['friend'],
      order: { points: 'DESC' },
    });

    return leaderboard.map(entry => ({
      friendId: entry.friend.id,
      name: entry.friend.name,
      points: entry.points,
    }));
  }
}
