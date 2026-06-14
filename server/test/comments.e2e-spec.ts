import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Comments API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  let authToken: string;
  let userId: string;
  let workspaceId: string;
  let pageId: string;
  let commentId: string;

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
    await prismaService.comment.deleteMany({});
    await prismaService.page.deleteMany({});
    await prismaService.workspaceMember.deleteMany({});
    await prismaService.workspace.deleteMany({});
    await prismaService.session.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.comment.deleteMany({});
    await prismaService.page.deleteMany({});
    await prismaService.workspaceMember.deleteMany({});
    await prismaService.workspace.deleteMany({});
    await prismaService.session.deleteMany({});
    await prismaService.user.deleteMany({});

    await prismaService.$disconnect();
    await app.close();
  });

  describe('Setup', () => {
    it('should register a test user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'comments-test@example.com',
          password: 'Test123!',
          name: 'Comments Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          authToken = res.body.data.tokens.accessToken;
          userId = res.body.data.user.id;
        });
    });

    it('should create a test workspace', () => {
      return request(app.getHttpServer())
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace for Comments',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          workspaceId = res.body.data.id;
        });
    });

    it('should create a test page', () => {
      return request(app.getHttpServer())
        .post('/api/pages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Page for Comments',
          workspaceId: workspaceId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          pageId = res.body.data.id;
        });
    });
  });

  describe('POST /api/comments', () => {
    it('should create a comment', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a test comment',
          pageId: pageId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.content).toBe('This is a test comment');
          expect(res.body.data.pageId).toBe(pageId);
          expect(res.body.data.authorId).toBe(userId);
          expect(res.body.data.resolved).toBe(false);
          commentId = res.body.data.id;
        });
    });

    it('should fail to create comment without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .send({
          content: 'Unauthorized comment',
          pageId: pageId,
        })
        .expect(401);
    });

    it('should fail to create comment without pageId', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Comment without page',
        })
        .expect(400);
    });

    it('should fail to create comment on non-existent page', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Comment on non-existent page',
          pageId: 'non-existent-page-id',
        })
        .expect(404);
    });

    it('should validate content length', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '',
          pageId: pageId,
        })
        .expect(400);
    });
  });

  describe('GET /api/comments?pageId=xxx', () => {
    it('should get all comments for a page', () => {
      return request(app.getHttpServer())
        .get(`/api/comments?pageId=${pageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should return empty array for page without comments', async () => {
      // Create a new page
      const newPageRes = await request(app.getHttpServer())
        .post('/api/pages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Empty Comments Page',
          workspaceId: workspaceId,
        });

      const newPageId = newPageRes.body.data.id;

      return request(app.getHttpServer())
        .get(`/api/comments?pageId=${newPageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual([]);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/comments?pageId=${pageId}`)
        .expect(401);
    });
  });

  describe('GET /api/comments/:id', () => {
    it('should get a specific comment', () => {
      return request(app.getHttpServer())
        .get(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(commentId);
          expect(res.body.data).toHaveProperty('author');
        });
    });

    it('should fail to get non-existent comment', () => {
      return request(app.getHttpServer())
        .get('/api/comments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/comments/${commentId}`)
        .expect(401);
    });
  });

  describe('PUT /api/comments/:id', () => {
    it('should update comment as author', () => {
      return request(app.getHttpServer())
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated comment content',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.content).toBe('Updated comment content');
        });
    });

    it('should fail to update comment without authentication', () => {
      return request(app.getHttpServer())
        .put(`/api/comments/${commentId}`)
        .send({ content: 'Hacked content' })
        .expect(401);
    });

    it('should fail to update comment as non-author', async () => {
      // Create another user
      const otherUserRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'other-comments@example.com',
          password: 'Test123!',
          name: 'Other User',
        });

      const otherToken = otherUserRes.body.data.tokens.accessToken;

      return request(app.getHttpServer())
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          content: 'Unauthorized update',
        })
        .expect(403);
    });
  });

  describe('POST /api/comments/:id/resolve', () => {
    it('should resolve comment as page author', () => {
      return request(app.getHttpServer())
        .post(`/api/comments/${commentId}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.resolved).toBe(true);
        });
    });

    it('should fail to resolve comment without authentication', () => {
      return request(app.getHttpServer())
        .post(`/api/comments/${commentId}/resolve`)
        .expect(401);
    });

    it('should fail to resolve comment as non-page-author', async () => {
      const otherUserRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'other-resolve@example.com',
          password: 'Test123!',
          name: 'Other Resolve User',
        });

      const otherToken = otherUserRes.body.data.tokens.accessToken;

      return request(app.getHttpServer())
        .post(`/api/comments/${commentId}/resolve`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('POST /api/comments/:id/unresolve', () => {
    it('should unresolve comment as page author', () => {
      return request(app.getHttpServer())
        .post(`/api/comments/${commentId}/unresolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.resolved).toBe(false);
        });
    });

    it('should fail to unresolve comment without authentication', () => {
      return request(app.getHttpServer())
        .post(`/api/comments/${commentId}/unresolve`)
        .expect(401);
    });
  });

  describe('GET /api/comments/unresolved', () => {
    beforeAll(async () => {
      // Create an unresolved comment
      await request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Unresolved test comment',
          pageId: pageId,
        });
    });

    it('should get unresolved comments', () => {
      return request(app.getHttpServer())
        .get('/api/comments/unresolved')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
          // Check that all comments are unresolved
          res.body.data.forEach((comment: any) => {
            expect(comment.resolved).toBe(false);
          });
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/comments/unresolved')
        .expect(401);
    });
  });

  describe('DELETE /api/comments/:id', () => {
    let commentToDelete: string;

    it('should delete comment as author', async () => {
      // Create a comment to delete
      const createRes = await request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Comment to be deleted',
          pageId: pageId,
        })
        .expect(201);

      commentToDelete = createRes.body.data.id;

      // Delete it
      return request(app.getHttpServer())
        .delete(`/api/comments/${commentToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Comment deleted successfully');
        });
    });

    it('should not find deleted comment', () => {
      return request(app.getHttpServer())
        .get(`/api/comments/${commentToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail to delete comment without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/comments/${commentId}`)
        .expect(401);
    });

    it('should fail to delete comment as non-author', async () => {
      // Create a new comment
      const createRes = await request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Comment for delete test',
          pageId: pageId,
        })
        .expect(201);

      const testCommentId = createRes.body.data.id;

      // Create another user and try to delete
      const otherUserRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'other-delete@example.com',
          password: 'Test123!',
          name: 'Other Delete User',
        });

      const otherToken = otherUserRes.body.data.tokens.accessToken;

      return request(app.getHttpServer())
        .delete(`/api/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });
});
