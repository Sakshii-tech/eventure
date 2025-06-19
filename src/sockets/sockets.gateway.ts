import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

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
    credentials: true
  },
  namespace: '/events',
})
export class SocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SocketsGateway');
  private connectedClients = new Map<string, number>(); // socketId -> userId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.debug(`New connection attempt - Socket ID: ${client.id}`);
      
      const token = client.handshake.auth.token;
      if (!token) {
        this.logger.error(`No token provided for socket ${client.id}`);
        client.disconnect();
        return;
      }

      try {
        const payload = this.jwtService.verify(token);
        const userId = payload.sub;
        this.logger.debug(`Token verified for user ${userId} (Socket: ${client.id})`);

        // Store userId in socket data and tracking map
        client.data.userId = userId;
        this.connectedClients.set(client.id, userId);

        // Join user's own room
        const userRoom = `user_${userId}`;
        await client.join(userRoom);
        
        // Join friend notification room
        const friendRoom = `user_${userId}_friends`;
        await client.join(friendRoom);

        // Log room membership
        const rooms = Array.from(client.rooms);
        this.logger.debug(`Socket ${client.id} (User ${userId}) joined rooms: ${rooms.join(', ')}`);
        
        // Log all connected clients
        this.logger.debug(`Connected clients: ${Array.from(this.connectedClients.entries()).map(([sid, uid]) => `${sid}:${uid}`).join(', ')}`);
        
        client.emit('connection_success', { 
          message: 'Successfully connected to events socket',
          userId: userId,
          rooms: rooms,
          socketId: client.id
        });
      } catch (jwtError) {
        this.logger.error(`JWT verification failed for socket ${client.id}: ${jwtError.message}`);
        client.disconnect();
        return;
      }
    } catch (error) {
      this.logger.error(`Connection error for socket ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedClients.get(client.id);
    this.logger.debug(`Client disconnected - Socket ID: ${client.id}, User ID: ${userId}`);
    this.connectedClients.delete(client.id);
    this.logger.debug(`Remaining connected clients: ${Array.from(this.connectedClients.entries()).map(([sid, uid]) => `${sid}:${uid}`).join(', ')}`);
  }

  async notifyEventCreated(creatorId: number, payload: EventCreatedPayload) {
    const room = `user_${creatorId}_friends`;
    this.logger.debug(`Attempting to emit event_created to room: ${room}`);
    this.logger.debug(`Event payload: ${JSON.stringify(payload)}`);
    
    // Get all sockets in the room
    const sockets = await this.server.in(room).allSockets();
    this.logger.debug(`Found ${sockets.size} socket(s) in room ${room}`);
    
    if (sockets.size === 0) {
      this.logger.warn(`No sockets found in room ${room}. Event notification might not be delivered.`);
      // Log all rooms for debugging
      const allRooms = await this.getAllRooms();
      this.logger.debug(`All active rooms: ${allRooms.join(', ')}`);
    }

    this.server.to(room).emit('event_created', payload);
    this.logger.debug(`Event notification emitted to room ${room}`);
  }

  async notifyLeaderboardUpdated(creatorId: number, data: LeaderboardUpdatedPayload) {
    const room = `user_${creatorId}`;
    this.logger.debug(`Attempting to emit leaderboard_updated to room: ${room}`);
    this.logger.debug(`Leaderboard payload: ${JSON.stringify(data)}`);
    
    const sockets = await this.server.in(room).allSockets();
    this.logger.debug(`Found ${sockets.size} socket(s) in room ${room}`);
    
    this.server.to(room).emit('leaderboard_updated', data);
    this.logger.debug(`Leaderboard update emitted to room ${room}`);
  }

  private async getAllRooms(): Promise<string[]> {
    const sids = await this.server.allSockets();
    const rooms = new Set<string>();
    for (const sid of sids) {
      const socket = this.server.sockets.sockets.get(sid);
      if (socket) {
        socket.rooms.forEach(room => rooms.add(room));
      }
    }
    return Array.from(rooms);
  }
}
