import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Sites API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  let authToken: string;
  let userId: string;
  let siteId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prismaService.calendarNote.deleteMany({});
    await prismaService.site.deleteMany({});
    await prismaService.session.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.calendarNote.deleteMany({});
    await prismaService.site.deleteMany({});
    await prismaService.session.deleteMany({});
    await prismaService.user.deleteMany({});

    await prismaService.$disconnect();
    await app.close();
  });

  describe('Authentication Setup', () => {
    it('should register a test user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'site-test@example.com',
          password: 'Test123!',
          name: 'Site Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data).toHaveProperty('tokens');
          authToken = res.body.data.tokens.accessToken;
          userId = res.body.data.user.id;
        });
    });
  });

  describe('POST /api/sites', () => {
    it('should create a new site', () => {
      return request(app.getHttpServer())
        .post('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'GitHub',
          url: 'https://github.com',
          color: 'blue',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('GitHub');
          expect(res.body.url).toBe('https://github.com');
          expect(res.body.color).toBe('blue');
          expect(res.body.isActive).toBe(true);
          siteId = res.body.id;
        });
    });

    it('should create site with default color when not provided', () => {
      return request(app.getHttpServer())
        .post('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'GitLab',
          url: 'https://gitlab.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.color).toBe('blue');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/sites')
        .send({
          name: 'Test Site',
          url: 'https://test.com',
        })
        .expect(401);
    });

    it('should fail with invalid URL', () => {
      return request(app.getHttpServer())
        .post('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Site',
          url: 'not-a-url',
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Incomplete Site',
        })
        .expect(400);
    });
  });

  describe('GET /api/sites', () => {
    it('should get user sites', () => {
      return request(app.getHttpServer())
        .get('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('url');
          expect(res.body[0]).toHaveProperty('color');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/sites')
        .expect(401);
    });
  });

  describe('GET /api/sites/:id', () => {
    it('should get site by id', () => {
      return request(app.getHttpServer())
        .get(`/api/sites/${siteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(siteId);
          expect(res.body).toHaveProperty('notes');
          expect(Array.isArray(res.body.notes)).toBe(true);
        });
    });

    it('should fail for non-existent site', () => {
      return request(app.getHttpServer())
        .get('/api/sites/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/sites/${siteId}`)
        .expect(401);
    });
  });

  describe('GET /api/sites/:id/stats', () => {
    it('should get site statistics', () => {
      return request(app.getHttpServer())
        .get(`/api/sites/${siteId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('siteId');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('noteCount');
          expect(res.body).toHaveProperty('notesByMonth');
          expect(res.body.siteId).toBe(siteId);
        });
    });

    it('should fail for non-existent site', () => {
      return request(app.getHttpServer())
        .get('/api/sites/non-existent-id/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/sites/${siteId}/stats`)
        .expect(401);
    });
  });

  describe('PUT /api/sites/:id', () => {
    it('should update site', () => {
      return request(app.getHttpServer())
        .put(`/api/sites/${siteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'GitHub Updated',
          color: 'green',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('GitHub Updated');
          expect(res.body.color).toBe('green');
        });
    });

    it('should update only provided fields', () => {
      return request(app.getHttpServer())
        .put(`/api/sites/${siteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          color: 'red',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.color).toBe('red');
          expect(res.body.name).toBe('GitHub Updated');
        });
    });

    it('should fail for non-existent site', () => {
      return request(app.getHttpServer())
        .put('/api/sites/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated',
        })
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put(`/api/sites/${siteId}`)
        .send({
          name: 'Unauthorized Update',
        })
        .expect(401);
    });
  });

  describe('Authorization Tests', () => {
    let otherAuthToken: string;
    let otherSiteId: string;
    const timestamp = Date.now();

    beforeAll(() => {
      // Register another user with unique email
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `other-user-${timestamp}@example.com`,
          password: 'Test123!',
          name: 'Other User',
        })
        .expect(201)
        .expect((res) => {
          otherAuthToken = res.body.data.tokens.accessToken;
        });
    });

    it('should create site for other user', () => {
      return request(app.getHttpServer())
        .post('/api/sites')
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({
          name: 'Private Site',
          url: 'https://private.com',
          color: 'purple',
        })
        .expect(201)
        .expect((res) => {
          otherSiteId = res.body.id;
        });
    });

    it('should prevent user from accessing other user site', () => {
      return request(app.getHttpServer())
        .get(`/api/sites/${otherSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should prevent user from updating other user site', () => {
      return request(app.getHttpServer())
        .put(`/api/sites/${otherSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Hacked',
        })
        .expect(403);
    });

    it('should prevent user from deleting other user site', () => {
      return request(app.getHttpServer())
        .delete(`/api/sites/${otherSiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should prevent user from getting other user site stats', () => {
      return request(app.getHttpServer())
        .get(`/api/sites/${otherSiteId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // Should either get 403 (Forbidden) or 404 (Not Found)
          // Both are acceptable for authorization failure
          expect([403, 404]).toContain(res.status);
        });
    });
  });

  describe('DELETE /api/sites/:id', () => {
    it('should soft delete site', () => {
      return request(app.getHttpServer())
        .delete(`/api/sites/${siteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('silindi');
        });
    });

    it('should not return deleted site in list', () => {
      return request(app.getHttpServer())
        .get('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const deletedSite = res.body.find((s: any) => s.id === siteId);
          expect(deletedSite).toBeUndefined();
        });
    });

    it('should fail for non-existent site', () => {
      return request(app.getHttpServer())
        .delete('/api/sites/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/sites/${siteId}`)
        .expect(401);
    });
  });
});
