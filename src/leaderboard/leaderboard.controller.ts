import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { sub: number; email: string };
}

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  getLeaderboard(@Req() req: RequestWithUser) {
    return this.leaderboardService.getLeaderboard(req.user.sub);
  }
}
