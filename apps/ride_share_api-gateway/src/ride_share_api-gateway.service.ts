import { Injectable } from '@nestjs/common';

@Injectable()
export class RideShareApiGatewayService {
  getHello(): string {
    return 'Hello World!';
  }
}
