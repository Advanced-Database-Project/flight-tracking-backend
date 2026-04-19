import { NestFactory } from '@nestjs/core';
import { RideShareApiGatewayModule } from './ride_share_api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(RideShareApiGatewayModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
