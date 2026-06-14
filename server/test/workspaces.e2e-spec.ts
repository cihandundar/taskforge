import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import * as bcrypt from 'bcrypt';

describe('Workspaces API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  let authToken: string;
  let userId: string;
  let workspaceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set global prefix like in main.ts
    app.setGlobalPrefix('api');

    // Add global exception filter
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
    await prismaService.workspaceMember.deleteMany({});
    await prismaService.workspace.deleteMany({});
    await prismaService.session.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.workspaceMember.deleteMany({});
    await prismaService.workspace.deleteMany({});
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
          email: 'workspace-test@example.com',
          password: 'Test123!',
          name: 'Workspace Test User',
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

  describe('POST /api/workspaces', () => {
    it('should create a new workspace', () => {
      return request(app.getHttpServer())
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace',
          icon: '🚀',
          description: 'A test workspace for e2e testing',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.name).toBe('Test Workspace');
          expect(res.body.data.icon).toBe('🚀');
          expect(res.body.data.description).toBe('A test workspace for e2e testing');
          workspaceId = res.body.data.id;
        });
    });

    it('should fail to create workspace without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/workspaces')
        .send({
          name: 'Unauthorized Workspace',
        })
        .expect(401);
    });

    it('should fail to create workspace with invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          icon: '🔒',
        })
        .expect(400);
    });
  });

  describe('GET /api/workspaces', () => {
    it('should get all workspaces for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(res.body.data[0]).toHaveProperty('role');
          expect(res.body.data[0].role).toBe('OWNER');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/workspaces')
        .expect(401);
    });
  });

  describe('GET /api/workspaces/:id', () => {
    it('should get a specific workspace', () => {
      return request(app.getHttpServer())
        .get(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(workspaceId);
          expect(res.body.data).toHaveProperty('role');
          expect(res.body.data).toHaveProperty('_count');
        });
    });

    it('should fail to get workspace without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/workspaces/${workspaceId}`)
        .expect(401);
    });

    it('should fail with invalid workspace id', () => {
      return request(app.getHttpServer())
        .get('/api/workspaces/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/workspaces/:id', () => {
    it('should update workspace as owner', () => {
      return request(app.getHttpServer())
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Workspace Name',
          description: 'Updated description',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('Updated Workspace Name');
          expect(res.body.data.description).toBe('Updated description');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put(`/api/workspaces/${workspaceId}`)
        .send({ name: 'Hacked' })
        .expect(401);
    });
  });

  describe('POST /api/workspaces/:id/members', () => {
    let testUserId: string;

    beforeAll(async () => {
      // Create a second user for testing with hashed password
      const hashedPassword = await bcrypt.hash('Test123!', 10);
      const user = await prismaService.user.create({
        data: {
          email: 'member-test@example.com',
          password: hashedPassword,
          name: 'Member Test User',
        },
      });
      testUserId = user.id;
    });

    it('should add a new member to workspace', () => {
      return request(app.getHttpServer())
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'member-test@example.com',
          role: 'ADMIN',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user.email).toBe('member-test@example.com');
          expect(res.body.data.role).toBe('ADMIN');
        });
    });

    it('should fail to add existing user again', () => {
      return request(app.getHttpServer())
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'member-test@example.com',
          role: 'MEMBER',
        })
        .expect(409);
    });

    it('should fail to add non-existent user', () => {
      return request(app.getHttpServer())
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'nonexistent@example.com',
          role: 'MEMBER',
        })
        .expect(404);
    });
  });

  describe('GET /api/workspaces/:id/members', () => {
    it('should get all members of workspace', () => {
      return request(app.getHttpServer())
        .get(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBe(2); // Owner + added member
        });
    });
  });

  describe('PUT /api/workspaces/:id/members/:memberId', () => {
    let memberId: string;

    beforeAll(async () => {
      const member = await prismaService.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: { not: userId },
        },
      });
      memberId = member!.id;
    });

    it('should update member role as owner', () => {
      return request(app.getHttpServer())
        .put(`/api/workspaces/${workspaceId}/members/${memberId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'MEMBER',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.role).toBe('MEMBER');
        });
    });
  });

  describe('DELETE /api/workspaces/:id', () => {
    it('should delete workspace as owner', () => {
      return request(app.getHttpServer())
        .delete(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Workspace deleted successfully');
        });
    });

    it('should not find deleted workspace', () => {
      return request(app.getHttpServer())
        .get(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('POST /api/workspaces/:id/leave', () => {
    let memberWorkspaceId: string;
    let memberAuthToken: string;

    beforeAll(async () => {
      // Create a new workspace for leave test
      const wsRes = await request(app.getHttpServer())
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace for Leave',
        })
        .expect(201);

      memberWorkspaceId = wsRes.body.data.id;

      // Create a second user and login
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'leave-test@example.com',
          password: 'Test123!',
          name: 'Leave Test User',
        });

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'leave-test@example.com',
          password: 'Test123!',
        });

      memberAuthToken = loginRes.body.data.tokens.accessToken;

      // Add member to workspace
      await request(app.getHttpServer())
        .post(`/api/workspaces/${memberWorkspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'leave-test@example.com',
          role: 'MEMBER',
        });
    });

    it('should allow member to leave workspace', () => {
      return request(app.getHttpServer())
        .post(`/api/workspaces/${memberWorkspaceId}/leave`)
        .set('Authorization', `Bearer ${memberAuthToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Left workspace successfully');
        });
    });

    it('should not allow left member to access workspace', () => {
      return request(app.getHttpServer())
        .get(`/api/workspaces/${memberWorkspaceId}`)
        .set('Authorization', `Bearer ${memberAuthToken}`)
        .expect(403);
    });
  });
});
