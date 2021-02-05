import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { StatusMonitorModule } from '../src/status.monitor.module';
import { INestApplication } from '@nestjs/common';
import { StatusMonitorService } from '../src/status.monitor.service';

describe('Status Monitor Module', () => {
  let app: INestApplication;
  let statusMonitorService = {
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

  afterAll(async () => {
    await app.close();
  });
});
