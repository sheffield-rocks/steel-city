import { Module } from '@nestjs/common';
import { TransportApplicationModule } from '@transport/application';
import { TransportInfrastructureModule } from '@transport/infrastructure';

@Module({
  imports: [TransportInfrastructureModule, TransportApplicationModule],
})
export class TransportCliModule {}
