import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { connect } from 'socket.io-client';
import { StatusMonitorModule } from '../src/status.monitor.module';
import { INestApplication } from '@nestjs/common';
import { StatusMonitorService } from '../src/status.monitor.service';
import { StatusMonitorGateway } from '../src/status.monitor.gateway';

describe('Status Monitor Module (e2e)', () => {
  let app: INestApplication;
  let gateway: StatusMonitorGateway;
  let statusMonitorService = {
    collectResponseTime: () => {},
    getData: () => {
      return [
        {
          os: [
            {
              cpu: 0,
              memory: 53.2265625,
              timestamp: 1612493738893,
              load: [0, 0, 0],
              heap: {
                used_heap_size: 20338712,
              },
            },
            {
              cpu: 1,
              memory: 54.2265625,
              timestamp: 1612493739894,
              load: [0.2, 1, 0.8],
              heap: {
                used_heap_size: 22338712,
              },
            },
          ],
          responses: [
            {
              '2': 0,
              '3': 0,
              '4': 0,
              '5': 0,
              count: 0,
              mean: 0,
              timestamp: 1612493735889,
            },
            {
              '2': 1,
              '3': 0,
              '4': 1,
              '5': 0,
              count: 2,
              mean: 2,
              timestamp: 1612493739894,
            },
          ],
          interval: 1,
          retention: 60,
        },
      ];
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StatusMonitorModule.forRoot()],
    })
      .overrideProvider(StatusMonitorService)
      .useValue(statusMonitorService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listenAsync(3000);
    gateway = app.get<StatusMonitorGateway>(StatusMonitorGateway);
  });

  describe(`GET /status/data`, () => {
    it('should returns 200 with stats', () =>
      request(app.getHttpServer())
        .get('/status/data')
        .expect(200)
        .expect(statusMonitorService.getData())
        .expect('Content-type', /json/));
  });

  describe(`GET /status`, () => {
    it(`should returns html`, () => {
      request(app.getHttpServer())
        .get('/status')
        .expect(200)
        .expect('Content-type', /html/);
    });
  });

  describe(`Gateway initialized`, () => {
    it(`gateway should be defined`, () => {
      expect(gateway).toBeDefined();
    });

    describe(`Metric sent`, () => {
      it(`client should receive metrics`, async (done) => {
        const client = connect('http://localhost:3000/status-monitor');
        client.on('connect', () => {
          const metricData = statusMonitorService.getData()[0];
          gateway.sendMetrics(metricData);
          client.on('esm_stats', (data) => {
            const expected = {
              ...metricData,
              os: metricData.os.slice(-2, -1)[0],
              responses: metricData.responses.slice(-2, -1)[0],
            };
            expect(data).toEqual(expected);
            client.disconnect();
            done();
          });
        });
      });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
