import { Module } from '@nestjs/common';
import {
  StatusMonitorModule,
  StatusMonitorConfiguration,
} from '../../../dist/index';
import { HealthController } from './healthController';

const statusMonitorConfig: StatusMonitorConfiguration = {
  title: 'NestJS Monitoring Page',
  port: 3001,
  socketPath: '/socket.io',
  path: '/status',
  ignoreStartsWith: '/admin',
  healthChecks: [
    {
      protocol: 'http',
      host: 'localhost',
      path: '/admin/health/alive',
      port: 3001,
    },
    {
      protocol: 'http',
      host: 'localhost',
      path: '/admin/health/dead',
      port: 3001,
    },
  ],
  spans: [
    {
      interval: 1, // Every second
      retention: 60, // Keep 60 datapoints in memory
    },
    {
      interval: 5, // Every 5 seconds
      retention: 60,
    },
    {
      interval: 15, // Every 15 seconds
      retention: 60,
    },
    {
      interval: 60, // Every 60 seconds
      retention: 600,
    },
  ],
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    responseTime: true,
    rps: true,
    statusCodes: true,
  },
};

@Module({
  imports: [StatusMonitorModule.forRoot(statusMonitorConfig)],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
