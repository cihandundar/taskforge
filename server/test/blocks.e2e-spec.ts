import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { BlockType } from '@prisma/client';

describe('Blocks API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  let authToken: string;
  let userId: string;
  let workspaceId: string;
  let pageId: string;
  let blockId: string;
  let childBlockId: string;

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
    await prismaService.block.deleteMany({});
    await prismaService.page.deleteMany({});
    await prismaService.workspaceMember.deleteMany({});
    await prismaService.workspace.deleteMany({});
    await prismaService.session.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.block.deleteMany({});
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
          email: 'blocks-test@example.com',
          password: 'Test123!',
          name: 'Blocks Test User',
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
          name: 'Test Workspace for Blocks',
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
          title: 'Test Page for Blocks',
          workspaceId: workspaceId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          pageId = res.body.data.id;
        });
    });
  });

  describe('POST /api/blocks', () => {
    it('should create a paragraph block', () => {
      return request(app.getHttpServer())
        .post('/api/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: BlockType.PARAGRAPH,
          content: { text: 'Hello, World!' },
          pageId: pageId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.type).toBe(BlockType.PARAGRAPH);
          expect(res.body.data.content).toEqual({ text: 'Hello, World!' });
          expect(res.body.data.position).toBe(0);
          blockId = res.body.data.id;
        });
    });

    it('should create a heading block', () => {
      return request(app.getHttpServer())
        .post('/api/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: BlockType.HEADING_1,
          content: { text: 'Introduction' },
          pageId: pageId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.type).toBe(BlockType.HEADING_1);
          expect(res.body.data.position).toBe(1);
        });
    });

    it('should create a nested block', () => {
      return request(app.getHttpServer())
        .post('/api/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: BlockType.BULLETED_LIST,
          content: { text: 'List item' },
          pageId: pageId,
          parentId: blockId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.parentId).toBe(blockId);
          expect(res.body.data.position).toBe(0);
          childBlockId = res.body.data.id;
        });
    });

    it('should create a block with props', () => {
      return request(app.getHttpServer())
        .post('/api/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: BlockType.CALLOUT,
          content: { text: 'Important note' },
          props: { emoji: '⚠️', color: 'yellow' },
          pageId: pageId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.props).toEqual({ emoji: '⚠️', color: 'yellow' });
        });
    });

    it('should fail to create block without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/blocks')
        .send({
          type: BlockType.PARAGRAPH,
          content: { text: 'Unauthorized' },
          pageId: pageId,
        })
        .expect(401);
    });

    it('should fail to create block with invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: BlockType.PARAGRAPH,
          // Missing pageId
        })
        .expect(400);
    });

    it('should fail to create block in non-accessible page', async () => {
      // Create another user
      const otherRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'other-blocks@example.com',
          password: 'Test123!',
          name: 'Other User',
        });

      const otherToken = otherRes.body.data.tokens.accessToken;

      return request(app.getHttpServer())
        .post('/api/blocks')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          type: BlockType.PARAGRAPH,
          content: { text: 'Unauthorized' },
          pageId: pageId,
        })
        .expect(403);
    });
  });

  describe('GET /api/blocks?pageId=xxx', () => {
    it('should get all blocks for a page', () => {
      return request(app.getHttpServer())
        .get(`/api/blocks?pageId=${pageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
          // Should return top-level blocks only
          const topLevelBlocks = res.body.data.filter((b: any) => !b.parentId);
          expect(topLevelBlocks.length).toBeGreaterThan(0);
        });
    });

    it('should return empty array for blocks query without pageId', () => {
      return request(app.getHttpServer())
        .get('/api/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual([]);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/blocks?pageId=${pageId}`)
        .expect(401);
    });
  });

  describe('GET /api/blocks/:id', () => {
    it('should get a specific block', () => {
      return request(app.getHttpServer())
        .get(`/api/blocks/${blockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(blockId);
          expect(res.body.data).toHaveProperty('children');
          expect(res.body.data).toHaveProperty('author');
        });
    });

    it('should fail to get non-existent block', () => {
      return request(app.getHttpServer())
        .get('/api/blocks/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/blocks/${blockId}`)
        .expect(401);
    });
  });

  describe('PUT /api/blocks/:id', () => {
    it('should update block content', () => {
      return request(app.getHttpServer())
        .put(`/api/blocks/${blockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: { text: 'Updated text' },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.content).toEqual({ text: 'Updated text' });
        });
    });

    it('should update block type', () => {
      return request(app.getHttpServer())
        .put(`/api/blocks/${blockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: BlockType.HEADING_2,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.type).toBe(BlockType.HEADING_2);
        });
    });

    it('should update block props', () => {
      return request(app.getHttpServer())
        .put(`/api/blocks/${blockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          props: { bold: true, italic: true },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.props).toEqual({ bold: true, italic: true });
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put(`/api/blocks/${blockId}`)
        .send({ content: { text: 'Hacked' } })
        .expect(401);
    });
  });

  describe('GET /api/blocks/:id/children', () => {
    it('should get block children', () => {
      return request(app.getHttpServer())
        .get(`/api/blocks/${blockId}/children`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(res.body.data[0].parentId).toBe(blockId);
        });
    });
  });

  describe('POST /api/blocks/:id/duplicate', () => {
    it('should duplicate a block', () => {
      return request(app.getHttpServer())
        .post(`/api/blocks/${blockId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.id).not.toBe(blockId);
          expect(res.body.data.type).toBe(BlockType.HEADING_2);
          expect(res.body.data.parentId).toBe(blockId.split('')[0] === blockId[0] ? null : null);
        });
    });
  });

  describe('POST /api/blocks/reorder', () => {
    it('should reorder blocks', async () => {
      // Get current blocks
      const getRes = await request(app.getHttpServer())
        .get(`/api/blocks?pageId=${pageId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const blocks = getRes.body.data;

      if (blocks.length < 2) {
        // Create another block if needed
        await request(app.getHttpServer())
          .post('/api/blocks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            type: BlockType.PARAGRAPH,
            content: { text: 'Another block' },
            pageId: pageId,
          });

        const newGetRes = await request(app.getHttpServer())
          .get(`/api/blocks?pageId=${pageId}`)
          .set('Authorization', `Bearer ${authToken}`);

        blocks.push(...newGetRes.body.data.slice(blocks.length));
      }

      // Reverse order
      const reversedBlocks = blocks.map((block: any, index: number) => ({
        id: block.id,
        position: blocks.length - 1 - index,
        parentId: null,
      }));

      return request(app.getHttpServer())
        .post('/api/blocks/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pageId: pageId,
          blocks: reversedBlocks,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });

    it('should fail to reorder without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/blocks/reorder')
        .send({
          pageId: pageId,
          blocks: [],
        })
        .expect(401);
    });
  });

  describe('DELETE /api/blocks/:id', () => {
    let blockToDelete: string;

    it('should delete block', async () => {
      // Create a block to delete
      const createRes = await request(app.getHttpServer())
        .post('/api/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: BlockType.PARAGRAPH,
          content: { text: 'To be deleted' },
          pageId: pageId,
        })
        .expect(201);

      blockToDelete = createRes.body.data.id;

      // Delete it
      return request(app.getHttpServer())
        .delete(`/api/blocks/${blockToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Block deleted successfully');
        });
    });

    it('should not find deleted block', () => {
      return request(app.getHttpServer())
        .get(`/api/blocks/${blockToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail to delete block with children', async () => {
      // Create a block with a child
      const parentRes = await request(app.getHttpServer())
        .post('/api/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: BlockType.PARAGRAPH,
          content: { text: 'Parent with children' },
          pageId: pageId,
        })
        .expect(201);

      const parentBlockId = parentRes.body.data.id;

      // Add a child
      await request(app.getHttpServer())
        .post('/api/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: BlockType.BULLETED_LIST,
          content: { text: 'Child block' },
          pageId: pageId,
          parentId: parentBlockId,
        })
        .expect(201);

      // Try to delete parent - should fail
      return request(app.getHttpServer())
        .delete(`/api/blocks/${parentBlockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/blocks/${blockToDelete}`)
        .expect(401);
    });
  });
});
