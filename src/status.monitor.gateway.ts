import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { StatusMonitoringService } from './status.monitoring.service';
import { Inject, forwardRef, Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: 'status-monitor' })
export class StatusMonitorGateway {
  @WebSocketServer()
  server;

  constructor(
    @Inject(forwardRef(() => StatusMonitoringService))
    private readonly statusMonitoringService: StatusMonitoringService,
  ) {}

  @SubscribeMessage('esm_change')
  onEvent(client, data: any) {
    const event = 'esm_start';
    const spans = this.statusMonitoringService.getData();
    return { event, data: spans };
  }

  handleConnection(client) {
    const spans = this.statusMonitoringService.getData();
    client.emit('esm_start', spans);
  }

  sendMetrics(metrics) {
    if (this.server) {
      const data = {
        os: metrics.os[metrics.os.length - 2],
        responses: metrics.responses[metrics.responses.length - 2],
        interval: metrics.interval,
        retention: metrics.retention,
      };
      this.server.emit('esm_stats', data);
    }
  }
}
