import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import * as pidusage from 'pidusage';
import * as os from 'os';
import { StatusMonitorGateway } from './status.monitor.gateway';
import { STATUS_MONITOR_OPTIONS_PROVIDER } from './status.monitor.constants';
import { StatusMonitorConfiguration } from './config/status.monitor.configuration';
import * as v8 from 'v8';

@Injectable()
export class StatusMonitorService {
  spans = [];
  eventLoopStats;

  constructor(
    @Inject(forwardRef(() => StatusMonitorGateway))
    private readonly statusMonitorWs: StatusMonitorGateway,
    @Inject(STATUS_MONITOR_OPTIONS_PROVIDER)
    readonly config: StatusMonitorConfiguration,
  ) {
    import('event-loop-stats')
      .then((module) => (this.eventLoopStats = module))
      .catch((err) =>
        Logger.warn(
          'event-loop-stats not found, ignoring event loop metrics...',
        ),
      );

    config.spans.forEach((currentSpan) => {
      const span = {
        os: [],
        responses: [],
        interval: currentSpan.interval,
        retention: currentSpan.retention,
      };

      this.spans.push(span);

      this.collectOsMetrics(span);
      this.sendOsMetrics(span);

      const interval = setInterval(() => {
        this.collectOsMetrics(span);
        this.sendOsMetrics(span);
      }, span.interval * 1000);
      interval.unref(); // don't keep node.js process up
    });
  }

  collectOsMetrics(span) {
    const defaultResponse = {
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      count: 0,
      mean: 0,
      timestamp: Date.now(),
    };

    pidusage(process.pid, (err, stat) => {
      if (err) {
        Logger.debug(err, this.constructor.name);
        return;
      }

      const last = span.responses[span.responses.length - 1];

      // Convert from B to MB
      stat.memory = stat.memory / 1024 / 1024;
      stat.load = os.loadavg();
      stat.timestamp = Date.now();
      const { used_heap_size } = v8.getHeapStatistics();
      stat.heap = { used_heap_size };

      if (this.eventLoopStats && this.eventLoopStats.sense) {
        stat.loop = this.eventLoopStats.sense();
      }

      span.os.push(stat);
      if (
        !span.responses[0] ||
        last.timestamp + span.interval * 1000 < Date.now()
      ) {
        span.responses.push(defaultResponse);
      }

      // todo: I think this check should be moved somewhere else
      if (span.os.length >= span.retention) span.os.shift();
      if (span.responses[0] && span.responses.length > span.retention)
        span.responses.shift();
    });
  }

  sendOsMetrics(span) {
    this.statusMonitorWs.sendMetrics(span);
  }

  getData() {
    return this.spans;
  }

  collectResponseTime(statusCode, startTime) {
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e3 + diff[1]) * 1e-6;
    const category = Math.floor(statusCode / 100);

    this.spans.forEach((span) => {
      const last = span.responses[span.responses.length - 1];

      if (
        last !== undefined &&
        last.timestamp / 1000 + span.interval > Date.now() / 1000
      ) {
        last[category] += 1;
        last.count += 1;
        last.mean += (responseTime - last.mean) / last.count;
      } else {
        span.responses.push({
          2: category === 2 ? 1 : 0,
          3: category === 3 ? 1 : 0,
          4: category === 4 ? 1 : 0,
          5: category === 5 ? 1 : 0,
          count: 1,
          mean: responseTime,
          timestamp: Date.now(),
        });
      }
    });
  }
}
