import { Test, TestingModule } from '@nestjs/testing';
import { RideShareApiGatewayController } from './ride_share_api-gateway.controller';
import { RideShareApiGatewayService } from './ride_share_api-gateway.service';

describe('RideShareApiGatewayController', () => {
  let rideShareApiGatewayController: RideShareApiGatewayController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RideShareApiGatewayController],
      providers: [RideShareApiGatewayService],
    }).compile();

    rideShareApiGatewayController = app.get<RideShareApiGatewayController>(RideShareApiGatewayController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(rideShareApiGatewayController.getHello()).toBe('Hello World!');
    });
  });
});
