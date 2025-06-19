import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FriendsModule } from './friends/friends.module';
import { EventsModule } from './events/events.module';
import { SocketsModule } from './sockets/sockets.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { User } from './users/user.entity';
import { Event } from './events/event.entity';
import { EventAcknowledgment } from './events/event-ack.entity';
import { Friendship } from './friends/friendship.entity';
import { LeaderboardPoint } from './leaderboard/leaderboard-point.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'eventure',
      entities: [User, Event, EventAcknowledgment, Friendship, LeaderboardPoint],
      synchronize: true, 
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    FriendsModule,
    EventsModule,
    SocketsModule,
    LeaderboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
