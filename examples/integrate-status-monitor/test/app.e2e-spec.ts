import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/admin/health/alive returns 200', () => {
    return request(app.getHttpServer())
      .get('/admin/health/alive')
      .expect(200)
      .expect('OK');
  });

  it('/admin/health/dead returns 500', () => {
    return request(app.getHttpServer())
      .get('/admin/health/dead')
      .expect(500)
      .expect('DEAD');
  });
});
