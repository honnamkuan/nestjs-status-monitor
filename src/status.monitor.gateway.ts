import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

@WebSocketGateway({ namespace: 'status-monitor' })
export class StatusMonitorGateway {
  @WebSocketServer()
  server;

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
