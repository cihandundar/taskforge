import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set up the same configuration as the main app
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors();

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Clean database before tests
    await prismaService.session.deleteMany();
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    // Clean up after tests
    await prismaService.session.deleteMany();
    await prismaService.user.deleteMany();

    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
      };

      return supertest(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data).toHaveProperty('tokens');
          expect(res.body.data.user.email).toBe(registerData.email);
          expect(res.body.data.user).not.toHaveProperty('password');

          // Store tokens and userId for later tests
          accessToken = res.body.data.tokens.accessToken;
          refreshToken = res.body.data.tokens.refreshToken;
          userId = res.body.data.user.id;
        });
    });

    it('should throw error for duplicate email', () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Another User',
      };

      return supertest(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(409)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should validate email format', () => {
      const registerData = {
        email: 'invalid-email',
        password: 'Test123!',
        name: 'Test User',
      };

      return supertest(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);
    });

    it('should validate password strength', () => {
      const registerData = {
        email: 'test2@example.com',
        password: 'weak',
        name: 'Test User',
      };

      return supertest(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test123!',
      };

      return supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data).toHaveProperty('tokens');
          expect(res.body.data.user.email).toBe(loginData.email);

          // Update tokens
          accessToken = res.body.data.tokens.accessToken;
          refreshToken = res.body.data.tokens.refreshToken;
        });
    });

    it('should fail with invalid email', () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Test123!',
      };

      return supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });

    it('should fail with invalid password', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      return supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', () => {
      return supertest(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('email');
          expect(res.body.data).not.toHaveProperty('password');
        });
    });

    it('should fail without token', () => {
      return supertest(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return supertest(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', () => {
      return supertest(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');

          // Update tokens
          accessToken = res.body.data.accessToken;
          refreshToken = res.body.data.refreshToken;
        });
    });

    it('should fail with invalid refresh token', () => {
      return supertest(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', () => {
      return supertest(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('Logout');
        });
    });

    it('should fail without authentication', () => {
      return supertest(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401);
    });

    it('should not be able to use refresh token after logout', () => {
      return supertest(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('Complete Auth Flow', () => {
    it('should handle complete registration, login, and logout flow', async () => {
      const newUserEmail = 'flowtest@example.com';

      // Register
      const registerResponse = await supertest(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: newUserEmail,
          password: 'FlowTest123!',
          name: 'Flow Test User',
        })
        .expect(201);

      expect(registerResponse.body.data.user.email).toBe(newUserEmail);

      const { accessToken, refreshToken } = registerResponse.body.data.tokens;

      // Get profile
      await supertest(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.email).toBe(newUserEmail);
        });

      // Logout
      await supertest(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Verify logged out (refresh token should be invalid)
      await supertest(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });
});
