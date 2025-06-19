// src/sockets/sockets.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FriendsService } from '../friends/friends.service';

interface EventCreatedPayload {
  eventId: number;
  title: string;
  creatorId: number;
  timestamp: Date;
}

interface LeaderboardEntry {
  friendId: number;
  points: number;
}

interface LeaderboardUpdatedPayload {
  eventId: number;
  leaderboard: LeaderboardEntry[];
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/events',
})
export class SocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SocketsGateway');
  private connectedClients = new Map<string, number>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private friendsService: FriendsService, // Needed to get friend list
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        this.logger.error(`No token provided for socket ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      client.data.userId = userId;
      this.connectedClients.set(client.id, userId);

      const room = `user_${userId}`;
      await client.join(room);

      this.logger.debug(`User ${userId} connected with socket ${client.id}, joined room ${room}`);

      client.emit('connection_success', {
        message: 'Successfully connected to socket',
        userId,
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error(`Socket connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedClients.get(client.id);
    this.logger.debug(`User ${userId} disconnected (Socket: ${client.id})`);
    this.connectedClients.delete(client.id);
  }

  async notifyEventCreated(creatorId: number, payload: EventCreatedPayload) {
    const friends = await this.friendsService.listFriends(creatorId);
    const friendIds = friends.map(friend => friend.id);

    for (const friendId of friendIds) {
      const room = `user_${friendId}`;
      const sockets = await this.server.in(room).allSockets();
      this.logger.debug(`Emitting event_created to user ${friendId} in room ${room} (Sockets: ${sockets.size})`);

      this.server.to(room).emit('event_created', payload);
    }

    this.logger.log(`Event notification sent to ${friendIds.length} friends of creator ${creatorId}`);
  }

  async notifyLeaderboardUpdated(creatorId: number, data: LeaderboardUpdatedPayload) {
    const room = `user_${creatorId}`;
    const sockets = await this.server.in(room).allSockets();
    this.logger.debug(`Sending leaderboard_updated to ${sockets.size} socket(s) in room ${room}`);

    this.server.to(room).emit('leaderboard_updated', data);
  }
}
