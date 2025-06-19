import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SocketsGateway } from './sockets.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.register({
      secret: 'secret-key', // Using same secret as auth module
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [SocketsGateway],
  exports: [SocketsGateway],
})
export class SocketsModule {}
