// src/events/events.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from '../users/user.entity';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { EventAcknowledgment } from './event-ack.entity';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { FriendsService } from '../friends/friends.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EventAcknowledgment)
    private readonly ackRepo: Repository<EventAcknowledgment>,
    private readonly gateway: SocketsGateway,
    private readonly leaderboardService: LeaderboardService,
    private readonly friendsService: FriendsService,
  ) {}

  async createEvent(userId: number, dto: CreateEventDto, mediaPath: string) {
    this.logger.debug(`Creating event for user ${userId} with title: "${dto.title}"`);

    const creator = await this.userRepo.findOne({ where: { id: userId } });
    if (!creator) {
      this.logger.error(`User ${userId} not found`);
      throw new NotFoundException('User not found');
    }
    this.logger.debug(`Found creator: ${creator.id} (${creator.email})`);

    const event = this.eventRepo.create({
      title: dto.title,
      description: dto.description,
      mediaPath: `/uploads/${mediaPath}`,
      creator: creator,
    });

    this.logger.debug(`Saving event: ${JSON.stringify(event)}`);
    const saved = await this.eventRepo.save(event);
    this.logger.debug(`Event saved successfully with ID: ${saved.id}`);

    // Get list of friends before notification
    const friends = await this.friendsService.listFriends(creator.id);
    this.logger.debug(`Creator ${creator.id} has ${friends.length} friends: ${JSON.stringify(friends.map(f => f.id))}`);

    // Emit WebSocket event to friends if gateway is available
    if (this.gateway) {
      this.logger.debug(`Preparing to notify friends about event ${saved.id}`);
      
      const notificationPayload = {
        eventId: saved.id,
        title: saved.title,
        creatorId: creator.id,
        timestamp: saved.createdAt,
      };
      this.logger.debug(`Notification payload: ${JSON.stringify(notificationPayload)}`);

      try {
        await this.gateway.notifyEventCreated(creator.id, notificationPayload);
        this.logger.debug(`WebSocket notification sent successfully`);
      } catch (error) {
        this.logger.error(`Failed to send WebSocket notification: ${error.message}`);
      }
    } else {
      this.logger.warn(`Gateway not available - WebSocket notifications disabled`);
    }

    return {
      message: 'Event created',
      id: saved.id,
      title: saved.title,
      creatorId: creator.id,
      createdAt: saved.createdAt,
      mediaPath: saved.mediaPath
    };
  }

  async acknowledgeEvent(eventId: number, userId: number) {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['creator', 'acknowledgments'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user is trying to acknowledge their own event
    if (event.creator.id === userId) {
      throw new ForbiddenException('Cannot acknowledge your own event');
    }

    // Check if user is friend with creator
    const isFriend = await this.friendsService.areFriends(event.creator.id, userId);
    if (!isFriend) {
      throw new ForbiddenException('Only friends can acknowledge events');
    }

    // Check for duplicate acknowledgment
    const existingAck = await this.ackRepo.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
    });

    if (existingAck) {
      throw new BadRequestException('Event already acknowledged');
    }

    // Calculate points based on acknowledgment order
    const orderPosition = event.acknowledgments.length + 1;
    const points = Math.max(100 - ((orderPosition - 1) * 10), 10); // Minimum 10 points

    // Get the full user entity
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create acknowledgment
    const acknowledgment = new EventAcknowledgment();
    acknowledgment.event = event;
    acknowledgment.user = user;
    acknowledgment.orderPosition = orderPosition;
    acknowledgment.pointsEarned = points;

    await this.ackRepo.save(acknowledgment);

    // Update leaderboard
    await this.leaderboardService.addPoints(event.creator.id, userId, event.id, points);

    // Get updated leaderboard for the event
    const eventLeaderboard = await this.getEventLeaderboard(eventId);

    // Emit WebSocket event
    if (this.gateway) {
      await this.gateway.notifyLeaderboardUpdated(event.creator.id, {
        eventId: event.id,
        leaderboard: eventLeaderboard
      });
    }

    return {
      message: 'Event acknowledged',
      pointsEarned: points
    };
  }

  private async getEventLeaderboard(eventId: number) {
    const acknowledgments = await this.ackRepo.find({
      where: { event: { id: eventId } },
      relations: ['user'],
      order: { orderPosition: 'ASC' },
    });

    return acknowledgments.map(ack => ({
      friendId: ack.user.id,
      points: ack.pointsEarned,
    }));
  }
}
