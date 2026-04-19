import { Controller, Get } from '@nestjs/common';
import { RideShareApiGatewayService } from './ride_share_api-gateway.service';

@Controller()
export class RideShareApiGatewayController {
  constructor(private readonly rideShareApiGatewayService: RideShareApiGatewayService) {}

  @Get()
  getHello(): string {
    return this.rideShareApiGatewayService.getHello();
  }
}
