# TaskForge - Authentication System

## 🔐 Authentication Overview

TaskForge uses JWT (JSON Web Token) based stateless authentication system. Access and refresh token strategy provides security and usability.

## 🏗️ Architecture

### Authentication Flow

```
┌─────────┐                  ┌─────────┐                  ┌─────────┐
│ Client  │                  │ Server  │                  │ Database│
└────┬────┘                  └────┬────┘                  └────┬────┘
     │                            │                            │
     │ 1. Register/Login Request │                            │
     ├───────────────────────────>│                            │
     │                            │ 2. Validate Credentials    │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │ 3. User Data               │
     │                            │<───────────────────────────┤
     │                            │                            │
     │                            │ 4. Generate Tokens         │
     │ 5. Tokens + User Data      │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │ 6. Store Tokens            │                            │
     ├──────────────────────────   │                            │
     │                            │                            │
     │ 7. Protected Request       │                            │
     │    (with Access Token)     │                            │
     ├───────────────────────────>│                            │
     │                            │ 8. Validate Token          │
     │ 9. Response                │                            │
     │<───────────────────────────┤                            │
```

### Token Strategy

**Access Token:**
- **Expiration:** 15 minutes
- **Usage:** API requests
- **Storage:** Memory (React Query)
- **Contains:** User ID, email, name

**Refresh Token:**
- **Expiration:** 7 days
- **Usage:** Get new access token
- **Storage:** HttpOnly cookie or secure storage
- **Database:** Stored in Session table

## 🔧 Implementation Details

### Backend (NestJS)

#### File Structure
```
server/src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt.strategy.spec.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── optional-auth.guard.ts
├── decorators/
│   └── current-user.decorator.ts
└── dto/
    ├── register.dto.ts
    ├── login.dto.ts
    └── refresh-token.dto.ts
```

#### Dependencies
```typescript
// package.json
{
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.6.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

#### Environment Variables
```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend (Next.js)

#### File Structure
```
client/
├── lib/
│   └── api-client.ts        # Axios instance with interceptors
├── hooks/
│   ├── useAuth.ts           # Authentication hooks
│   └── useRefreshToken.ts   # Token refresh logic
├── stores/
│   └── authStore.ts         # Auth state management
└── app/
    └── auth/
        ├── login/
        │   └── page.tsx
        └── register/
            └── page.tsx
```

## 📝 API Endpoints

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "clx123abc",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clx123abc",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## 🔒 Security Best Practices

### Password Requirements
```typescript
password: {
  minLength: 8,
  maxLength: 128,
  requiresUppercase: true,
  requiresLowercase: true,
  requiresNumber: true,
  requiresSpecialChar: true
}
```

### Token Security
- **Access Token:** Short-lived (15 min)
- **Refresh Token:** Single-use, rotated on refresh
- **Secret Key:** Strong, randomly generated
- **Transmission:** HTTPS only (production)

### Password Storage
```typescript
// Hashing with bcrypt
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Session Management
```typescript
// Refresh token storage in database
const session = await prisma.session.create({
  data: {
    userId: user.id,
    refreshToken: hashedRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
});

// Cleanup expired sessions
await prisma.session.deleteMany({
  where: { expiresAt: { lt: new Date() } }
});
```

## 🛡️ Guards & Decorators

### JWT Auth Guard
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

**Usage:**
```typescript
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  @Get()
  findAll(@Request() req) {
    // req.user contains decoded JWT payload
  }
}
```

### Optional Auth Guard
```typescript
@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // No error thrown if user is not authenticated
    return user;
  }
}
```

### Current User Decorator
```typescript
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  }
);
```

**Usage:**
```typescript
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

## 🔄 Token Refresh Strategy

### Client-Side Implementation
```typescript
// React Query interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken: getRefreshToken()
        });

        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);

        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## 📊 Validation Rules

### Email Validation
```typescript
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  name?: string;
}
```

### Login Validation
```typescript
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

## 🚀 Frontend Integration

### Auth Hook Example
```typescript
// client/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const { data } = await apiClient.get('/auth/me');
          setUser(data);
        }
      } catch (error) {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    setAccessToken(data.tokens.accessToken);
    setRefreshToken(data.tokens.refreshToken);
    setUser(data.user);
  };

  const logout = async () => {
    await apiClient.post('/auth/logout');
    clearTokens();
    setUser(null);
  };

  return { user, isLoading, login, logout };
}
```

## 🧪 Testing

### Unit Tests
```typescript
describe('AuthService', () => {
  it('should register a new user', async () => {
    const result = await authService.register({
      email: 'test@example.com',
      password: 'Test123!',
      name: 'Test User'
    });

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('tokens');
  });

  it('should validate credentials', async () => {
    const result = await authService.validateUser(
      'test@example.com',
      'Test123!'
    );

    expect(result).toBeTruthy();
    expect(result.email).toBe('test@example.com');
  });
});
```

### E2E Tests
```typescript
describe('AuthController (e2e)', () => {
  it('/api/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User'
      })
      .expect(201)
      .expect(res => {
        expect(res.body.data.user.email).toBe('test@example.com');
      });
  });
});
```

## 🔧 Troubleshooting

### Common Issues

**Token Expired:**
- Problem: Access token expires after 15 minutes
- Solution: Implement automatic token refresh

**Invalid Credentials:**
- Problem: User provides wrong password
- Solution: Return generic error message (security)

**Refresh Token Reuse:**
- Problem: Old refresh token reused
- Solution: Implement token rotation and blacklist

**Database Connection:**
- Problem: Prisma connection fails
- Solution: Check DATABASE_URL and PostgreSQL status

---

*For implementation details, see source code in `server/src/auth/`*
