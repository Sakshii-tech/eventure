import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { sub: number; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('add')
  addFriend(@Body('friendId') friendId: number, @Req() req: RequestWithUser) {
    const userId = req.user.sub;
    return this.friendsService.addFriend(userId, friendId);
  }

  @Get()
  listFriends(@Req() req: RequestWithUser) {
    const userId = req.user.sub;
    return this.friendsService.listFriends(userId);
  }
}
