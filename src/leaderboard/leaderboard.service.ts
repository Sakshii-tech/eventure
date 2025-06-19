import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { LeaderboardPoint } from './leaderboard-point.entity';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(LeaderboardPoint)
    private readonly pointsRepo: Repository<LeaderboardPoint>,
  ) {}

  async addPoints(creatorId: number, friendId: number, eventId: number, points: number) {
    let record = await this.pointsRepo.findOne({
      where: { 
        creatorId,
        friendId,
        eventId
      }
    });

    if (!record) {
      record = this.pointsRepo.create({
        creatorId,
        friendId,
        eventId,
        points: 0
      });
    }

    record.points += points;
    await this.pointsRepo.save(record);

    // Update total points
    await this.updateTotalPoints(creatorId, friendId);
  }

  private async updateTotalPoints(creatorId: number, friendId: number) {
    const points = await this.pointsRepo
      .createQueryBuilder('point')
      .where('point.creatorId = :creatorId', { creatorId })
      .andWhere('point.friendId = :friendId', { friendId })
      .andWhere('point.eventId IS NOT NULL')
      .select('SUM(point.points)', 'total')
      .getRawOne();

    const totalPoints = parseInt(points?.total) || 0;

    // Update or create the total points record
    let totalRecord = await this.pointsRepo.findOne({
      where: {
        creatorId,
        friendId,
        eventId: IsNull()
      }
    });

    if (!totalRecord) {
      totalRecord = this.pointsRepo.create({
        creatorId,
        friendId,
        points: totalPoints
      });
    } else {
      totalRecord.points = totalPoints;
    }

    await this.pointsRepo.save(totalRecord);
  }

  async getLeaderboard(userId: number) {
    const query = this.pointsRepo
      .createQueryBuilder('point')
      .leftJoin('point.friend', 'friend')
      .select([
        'point.friendId as friendId',
        'friend.name as name',
        'SUM(point.points) as points'
      ])
      .where('point.creatorId = :userId', { userId })
      .andWhere('point.eventId IS NULL')  // Get only the total points records
      .groupBy('point.friendId, friend.name')
      .orderBy('points', 'DESC');

    this.logger.debug(`Generated SQL query: ${query.getSql()}`);
    
    const leaderboard = await query.getRawMany();
    
    return leaderboard.map(entry => ({
      friendId: entry.friendId,
      name: entry.name,
      points: parseInt(entry.points)
    }));
  }

  async getEventLeaderboard(eventId: number) {
    const points = await this.pointsRepo
      .createQueryBuilder('point')
      .leftJoinAndSelect('point.friend', 'friend')
      .where('point.eventId = :eventId', { eventId })
      .orderBy('point.points', 'DESC')
      .getMany();

    return points.map(entry => ({
      friendId: entry.friendId,
      name: entry.friend.name,
      points: entry.points
    }));
  }
}
