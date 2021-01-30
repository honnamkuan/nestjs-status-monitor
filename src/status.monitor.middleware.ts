import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import * as onHeaders from 'on-headers';
import { StatusMonitoringService } from './status.monitoring.service';
import { STATUS_MONITOR_OPTIONS_PROVIDER } from './status.monitor.constants';
import { StatusMonitorConfiguration } from './config/status.monitor.configuration';

@Injectable()
export class StatusMonitorMiddleware implements NestMiddleware {
  constructor(
    private readonly statusMonitoringService: StatusMonitoringService,
    @Inject(STATUS_MONITOR_OPTIONS_PROVIDER)
    private readonly config: StatusMonitorConfiguration,
  ) {}

  use(req, res, next: Function) {
    let ignoredStartWithList: string[] = [];
    if (this.config.ignoreStartsWith) {
      const isArray = Array.isArray(this.config.ignoreStartsWith);
      ignoredStartWithList = isArray
        ? this.config.ignoreStartsWith as any
        : [this.config.ignoreStartsWith];
    }
    if (
      !req.originalUrl.startsWith(this.config.path) &&
      ignoredStartWithList.every(i => !req.originalUrl.startsWith(i))
    ) {
      const startTime = process.hrtime();
      onHeaders(res, () => {
        this.statusMonitoringService.collectResponseTime(
          res.statusCode,
          startTime,
        );
      });
    }

    next();
  }
}
