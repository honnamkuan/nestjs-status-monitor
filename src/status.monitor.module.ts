import {
  MiddlewareConsumer,
  RequestMethod,
  DynamicModule,
} from '@nestjs/common';
import { StatusMonitorController } from './status.monitor.controller';
import { StatusMonitorGateway } from './status.monitor.gateway';
import { StatusMonitorService } from './status.monitor.service';
import { StatusMonitorMiddleware } from './status.monitor.middleware';
import { HealthCheckService } from './health.check.service';
import { StatusMonitorConfiguration } from './config/status.monitor.configuration';
import { STATUS_MONITOR_OPTIONS_PROVIDER } from './status.monitor.constants';
import * as defaultConfig from './default.config';

export class StatusMonitorModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(StatusMonitorMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }

  static forRoot(
    config: StatusMonitorConfiguration = defaultConfig.default,
  ): DynamicModule {
    return {
      module: StatusMonitorModule,
      providers: [
        {
          provide: STATUS_MONITOR_OPTIONS_PROVIDER,
          useValue: config,
        },
        StatusMonitorGateway,
        StatusMonitorService,
        HealthCheckService,
      ],
      controllers: [StatusMonitorController.forRoot(config.path)],
    };
  }
}
