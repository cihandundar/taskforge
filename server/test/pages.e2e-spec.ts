import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import * as bcrypt from 'bcrypt';

describe('Pages API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  let authToken: string;
  let userId: string;
  let workspaceId: string;
  let pageId: string;
  let childPageId: string;

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
    await prismaService.page.deleteMany({});
    await prismaService.workspaceMember.deleteMany({});
    await prismaService.workspace.deleteMany({});
    await prismaService.session.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.page.deleteMany({});
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
          email: 'pages-test@example.com',
          password: 'Test123!',
          name: 'Pages Test User',
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

    it('should create a test workspace', () => {
      return request(app.getHttpServer())
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace for Pages',
          icon: '📄',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          workspaceId = res.body.data.id;
        });
    });
  });

  describe('POST /api/pages', () => {
    it('should create a personal page', () => {
      return request(app.getHttpServer())
        .post('/api/pages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'My Personal Page',
          icon: '📝',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.title).toBe('My Personal Page');
          expect(res.body.data.icon).toBe('📝');
          expect(res.body.data.authorId).toBe(userId);
          expect(res.body.data.workspaceId).toBeNull();
          pageId = res.body.data.id;
        });
    });

    it('should create a workspace page', () => {
      return request(app.getHttpServer())
        .post('/api/pages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Workspace Page',
          icon: '📋',
          workspaceId: workspaceId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.workspaceId).toBe(workspaceId);
        });
    });

    it('should create a nested page', () => {
      return request(app.getHttpServer())
        .post('/api/pages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Child Page',
          icon: '📄',
          parentId: pageId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.parentId).toBe(pageId);
          childPageId = res.body.data.id;
        });
    });

    it('should fail to create page without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/pages')
        .send({
          title: 'Unauthorized Page',
        })
        .expect(401);
    });

    it('should fail to create page in non-member workspace', async () => {
      // Create another user and get token
      const registerRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'other-user@example.com',
          password: 'Test123!',
          name: 'Other User',
        });

      const otherToken = registerRes.body.data.tokens.accessToken;

      // Try to create page in first user's workspace
      return request(app.getHttpServer())
        .post('/api/pages')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Unauthorized Workspace Page',
          workspaceId: workspaceId,
        })
        .expect(403);
    });
  });

  describe('GET /api/pages', () => {
    it('should get all pages for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/pages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should filter pages by workspace', () => {
      return request(app.getHttpServer())
        .get(`/api/pages?workspaceId=${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          res.body.data.forEach((page: any) => {
            expect(page.workspaceId).toBe(workspaceId);
          });
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/pages')
        .expect(401);
    });
  });

  describe('GET /api/pages/:id', () => {
    it('should get a specific page', () => {
      return request(app.getHttpServer())
        .get(`/api/pages/${pageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(pageId);
          expect(res.body.data).toHaveProperty('author');
          expect(res.body.data).toHaveProperty('_count');
        });
    });

    it('should fail to get deleted page', async () => {
      // Delete the page first
      await request(app.getHttpServer())
        .delete(`/api/pages/${childPageId}`)
        .set('Authorization', `Bearer ${authToken}`);

      return request(app.getHttpServer())
        .get(`/api/pages/${childPageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/pages/${pageId}`)
        .expect(401);
    });
  });

  describe('PUT /api/pages/:id', () => {
    it('should update page as author', () => {
      return request(app.getHttpServer())
        .put(`/api/pages/${pageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Personal Page',
          icon: '✏️',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.title).toBe('Updated Personal Page');
          expect(res.body.data.icon).toBe('✏️');
        });
    });

    it('should fail to update page without authentication', () => {
      return request(app.getHttpServer())
        .put(`/api/pages/${pageId}`)
        .send({ title: 'Hacked Title' })
        .expect(401);
    });
  });

  describe('GET /api/pages/:id/children', () => {
    it('should get page children', () => {
      // Create a new child page since previous one was deleted
      return request(app.getHttpServer())
        .post('/api/pages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Child Page',
          parentId: pageId,
        })
        .expect(201)
        .expect(() => {
          // Now get children
          request(app.getHttpServer())
            .get(`/api/pages/${pageId}/children`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)
            .expect((res) => {
              expect(res.body.success).toBe(true);
              expect(Array.isArray(res.body.data)).toBe(true);
            });
        });
    });
  });

  describe('POST /api/pages/:id/restore', () => {
    it('should restore deleted page', async () => {
      // Create and delete a page
      const createRes = await request(app.getHttpServer())
        .post('/api/pages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'To Be Deleted',
        });

      const tempPageId = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/pages/${tempPageId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Restore it
      return request(app.getHttpServer())
        .post(`/api/pages/${tempPageId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(tempPageId);
        });
    });

    it('should fail to restore non-deleted page', () => {
      return request(app.getHttpServer())
        .post(`/api/pages/${pageId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('DELETE /api/pages/:id', () => {
    let pageToDelete: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/pages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Page to Delete',
        });

      pageToDelete = res.body.data.id;
    });

    it('should delete page as author', () => {
      return request(app.getHttpServer())
        .delete(`/api/pages/${pageToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Page deleted successfully');
        });
    });

    it('should not find deleted page', () => {
      return request(app.getHttpServer())
        .get(`/api/pages/${pageToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/pages/${pageId}`)
        .expect(401);
    });
  });

  describe('Search Pages', () => {
    it('should search pages by title', () => {
      return request(app.getHttpServer())
        .get('/api/pages/search?q=Updated')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          if (res.body.data.length > 0) {
            expect(res.body.data[0].title).toContain('Updated');
          }
        });
    });

    it('should return empty array for no results', () => {
      return request(app.getHttpServer())
        .get('/api/pages/search?q=NonExistentPageXYZ123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual([]);
        });
    });

    it('should search within workspace', () => {
      return request(app.getHttpServer())
        .get(`/api/pages/search?q=Workspace&workspaceId=${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          res.body.data.forEach((page: any) => {
            expect(page.workspaceId).toBe(workspaceId);
          });
        });
    });
  });
});
