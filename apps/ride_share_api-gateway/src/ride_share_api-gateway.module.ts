import { Module } from '@nestjs/common';
import { RideShareApiGatewayController } from './ride_share_api-gateway.controller';
import { RideShareApiGatewayService } from './ride_share_api-gateway.service';

@Module({
  imports: [],
  controllers: [RideShareApiGatewayController],
  providers: [RideShareApiGatewayService],
})
export class RideShareApiGatewayModule {}
