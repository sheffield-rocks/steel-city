import { Injectable } from '@nestjs/common';
import { getTransportGreeting } from '@transport/application';

@Injectable()
export class AppService {
  getHello(): string {
    return getTransportGreeting();
  }
}
