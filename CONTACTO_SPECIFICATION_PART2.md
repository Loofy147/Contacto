# CONTACTO SPECIFICATION - PART 2: EXECUTION & MANAGEMENT

*This document continues from CONTACTO_COMPLETE_SPECIFICATION.md*

---

## 🧪 SECTION 7: TESTING STRATEGY & QUALITY ASSURANCE

### 7.1 Testing Pyramid

```
                    ┌──────────┐
                    │   E2E    │  5% (Critical user flows)
                    │  Tests   │
                    └──────────┘
                 ┌──────────────────┐
                 │  Integration     │  20% (API endpoints, DB)
                 │    Tests         │
                 └──────────────────┘
            ┌──────────────────────────┐
            │     Unit Tests           │  75% (Functions, components)
            │                          │
            └──────────────────────────┘
```

**Coverage Targets:**
- Overall: 80% minimum
- Critical paths (auth, payments): 95%
- Business logic: 90%
- UI components: 70%

### 7.2 Testing Stack

#### Backend Testing
```typescript
// Tech stack
{
  "unit": "Jest",
  "integration": "Supertest + Jest",
  "database": "testcontainers (PostgreSQL)",
  "mocking": "Jest mocks",
  "coverage": "Jest coverage (nyc)"
}

// Example: Unit test
// backend/services/__tests__/professional.service.test.ts
import { ProfessionalService } from '../professional.service';
import { prismaMock } from '../../../test/prisma-mock';

describe('ProfessionalService', () => {
  describe('create', () => {
    it('should create a professional with valid data', async () => {
      const mockData = {
        userId: 'user-123',
        businessName: 'Ahmed Plumbing',
        categoryId: 'cat-plumber',
        wilaya: 'Algiers'
      };

      prismaMock.professional.create.mockResolvedValue({
        id: 'prof-123',
        ...mockData,
        slug: 'ahmed-plumbing',
        createdAt: new Date()
      });

      const result = await ProfessionalService.create(mockData);

      expect(result.slug).toBe('ahmed-plumbing');
      expect(prismaMock.professional.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          businessName: 'Ahmed Plumbing',
          slug: 'ahmed-plumbing'
        })
      });
    });

    it('should throw error if business name already exists', async () => {
      prismaMock.professional.create.mockRejectedValue(
        new Error('Unique constraint failed')
      );

      await expect(
        ProfessionalService.create({ ... })
      ).rejects.toThrow('Business name already exists');
    });
  });

  describe('search', () => {
    it('should return professionals matching query', async () => {
      const mockResults = [
        { id: '1', businessName: 'Plumber Ali' },
        { id: '2', businessName: 'Plumber Ahmed' }
      ];

      prismaMock.professional.findMany.mockResolvedValue(mockResults);

      const results = await ProfessionalService.search({
        query: 'plumber',
        wilaya: 'Algiers'
      });

      expect(results).toHaveLength(2);
      expect(results[0].businessName).toContain('Plumber');
    });
  });
});

// Example: Integration test
// backend/routes/__tests__/professionals.integration.test.ts
import request from 'supertest';
import { app } from '../../app';
import { setupTestDB, teardownTestDB } from '../../../test/db-setup';

describe('POST /api/v1/professionals', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should create professional and return 201', async () => {
    const authToken = await getTestAuthToken();

    const response = await request(app)
      .post('/api/v1/professionals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        businessName: 'Test Business',
        categoryId: 'cat-123',
        wilaya: 'Algiers',
        email: 'test@business.dz',
        phone: '0555123456'
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      businessName: 'Test Business',
      slug: 'test-business',
      isVerified: false
    });

    // Verify database insertion
    const created = await db.professional.findUnique({
      where: { id: response.body.id }
    });
    expect(created).toBeTruthy();
  });

  it('should return 400 if required fields missing', async () => {
    const authToken = await getTestAuthToken();

    await request(app)
      .post('/api/v1/professionals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        businessName: 'Test Business'
        // Missing required fields
      })
      .expect(400);
  });

  it('should return 401 if not authenticated', async () => {
    await request(app)
      .post('/api/v1/professionals')
      .send({ ... })
      .expect(401);
  });
});
```

#### Frontend Testing
```typescript
// Tech stack
{
  "unit": "Jest + React Testing Library",
  "integration": "Playwright",
  "e2e": "Playwright",
  "visual": "Percy (optional)"
}

// Example: Component test
// frontend/components/__tests__/ProfessionalCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProfessionalCard } from '../ProfessionalCard';

describe('ProfessionalCard', () => {
  const mockProfessional = {
    id: '1',
    businessName: 'Ahmed Plumbing',
    slug: 'ahmed-plumbing',
    bio: 'Expert plumber in Algiers',
    averageRating: 4.5,
    totalReviews: 23,
    wilaya: 'Algiers',
    isVerified: true,
    logoUrl: '/images/logo.jpg'
  };

  it('should render professional information', () => {
    render(<ProfessionalCard professional={mockProfessional} />);

    expect(screen.getByText('Ahmed Plumbing')).toBeInTheDocument();
    expect(screen.getByText('Expert plumber in Algiers')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(23 reviews)')).toBeInTheDocument();
  });

  it('should display verified badge if professional is verified', () => {
    render(<ProfessionalCard professional={mockProfessional} />);

    const badge = screen.getByRole('img', { name: /verified/i });
    expect(badge).toBeInTheDocument();
  });

  it('should not display verified badge if not verified', () => {
    render(<ProfessionalCard professional={{ ...mockProfessional, isVerified: false }} />);

    const badge = screen.queryByRole('img', { name: /verified/i });
    expect(badge).not.toBeInTheDocument();
  });

  it('should navigate to profile on click', () => {
    const { container } = render(<ProfessionalCard professional={mockProfessional} />);

    const link = container.querySelector('a[href="/professionals/ahmed-plumbing"]');
    expect(link).toBeInTheDocument();
  });
});

// Example: E2E test
// e2e/tests/professional-registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Professional Registration Flow', () => {
  test('should allow user to register as professional', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill in user account details
    await page.fill('input[name="email"]', 'test@professional.dz');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="firstName"]', 'Ahmed');
    await page.fill('input[name="lastName"]', 'Benmoussa');
    await page.click('button[type="submit"]');

    // Wait for redirect to professional setup
    await expect(page).toHaveURL(/\/onboarding\/professional/);

    // Fill in business details
    await page.fill('input[name="businessName"]', 'Ahmed Expert Plumbing');
    await page.selectOption('select[name="category"]', 'Plumbing');
    await page.fill('textarea[name="bio"]', 'Professional plumber with 10 years experience');
    await page.selectOption('select[name="wilaya"]', 'Algiers');
    await page.fill('input[name="phone"]', '0555123456');

    // Upload logo
    await page.setInputFiles('input[type="file"]', './fixtures/test-logo.png');

    // Submit
    await page.click('button:has-text("Complete Registration")');

    // Verify success
    await expect(page.locator('.success-message')).toContainText('Registration successful');
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify profile created
    await page.goto('/professionals/ahmed-expert-plumbing');
    await expect(page.locator('h1')).toContainText('Ahmed Expert Plumbing');
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    await page.goto('/register');

    // Submit without filling fields
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('.error-message')).toContainText('Email is required');
    await expect(page.locator('.error-message')).toContainText('Password is required');
  });
});
```

### 7.3 Test Automation Strategy

#### CI Pipeline Tests
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/contacto_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true
          verbose: true

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run component tests
        run: npm run test:components

      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run type-check

      - name: Run Prettier check
        run: npm run format:check

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### 7.4 Performance Testing

#### Load Testing (Phase 2+)
```typescript
// k6 script for load testing
// tests/performance/api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% requests < 500ms
    'http_req_failed': ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  // Test search endpoint
  const searchRes = http.get('https://api.contacto.dz/v1/professionals?q=plumber&wilaya=Algiers');
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 300ms': (r) => r.timings.duration < 300,
    'results returned': (r) => JSON.parse(r.body).data.length > 0,
  });

  sleep(1);

  // Test professional detail
  const professionalRes = http.get('https://api.contacto.dz/v1/professionals/ahmed-plumbing');
  check(professionalRes, {
    'profile status is 200': (r) => r.status === 200,
    'profile response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(2);
}

// Run: k6 run tests/performance/api-load.js
```

**Load Testing Schedule:**
- **Phase 1:** Weekly (100 concurrent users)
- **Phase 2:** Weekly (500 concurrent users)
- **Phase 3:** Daily (1000 concurrent users)
- **Before Major Releases:** Full stress test (5000 concurrent users)

---

## 🔒 SECTION 8: SECURITY ARCHITECTURE & COMPLIANCE

### 8.1 Defense in Depth Layers

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: NETWORK SECURITY                                   │
│ • Cloudflare DDoS protection (10 Tbps capacity)             │
│ • WAF with OWASP Top 10 rules                               │
│ • Rate limiting (per IP: 100 req/min)                       │
│ • GeoIP blocking (block known malicious IPs)               │
│ • SSL/TLS 1.3 only (no legacy protocols)                    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: API GATEWAY SECURITY                               │
│ • JWT validation (HS256, 15min expiry)                      │
│ • API key verification (for public API)                     │
│ • Request size limits (10MB max)                            │
│ • Input sanitization (DOMPurify, SQL injection prevention)  │
│ • CORS policy (whitelist domains only)                      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: APPLICATION SECURITY                               │
│ • Parameterized queries (prevent SQL injection)             │
│ • Output encoding (prevent XSS)                             │
│ • CSRF tokens (SameSite cookies)                            │
│ • Password hashing (bcrypt, cost 12)                        │
│ • Session management (secure, HttpOnly cookies)             │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 4: DATA SECURITY                                      │
│ • Encryption at rest (AES-256)                              │
│ • Encryption in transit (TLS 1.3)                           │
│ • Database access control (least privilege)                 │
│ • PII masking in logs                                       │
│ • Audit trails (immutable, 10-year retention)               │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Security Implementation Examples

#### 8.2.1 Authentication & Authorization
```typescript
// backend/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'professional' | 'admin';
  iat: number;
  exp: number;
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Check if token is blacklisted (logout)
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        actual: req.user.role
      });
    }

    next();
  };
}

// Usage in routes
router.post('/professionals', 
  authenticateToken,
  requireRole(['user', 'admin']),
  createProfessional
);

router.delete('/professionals/:id',
  authenticateToken,
  requireRole(['admin']),
  deleteProfessional
);
```

#### 8.2.2 Input Validation & Sanitization
```typescript
// backend/validators/professional.validator.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const ProfessionalSchema = z.object({
  businessName: z.string()
    .min(3, 'Business name must be at least 3 characters')
    .max(200, 'Business name cannot exceed 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Business name contains invalid characters')
    .transform(str => DOMPurify.sanitize(str)),

  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .refine(
      email => !email.includes('+'),
      'Email aliases (+) are not allowed'
    )
    .refine(
      async (email) => {
        const exists = await db.professional.findUnique({ where: { email } });
        return !exists;
      },
      'Email already registered'
    ),

  phone: z.string()
    .regex(/^(00213|0)(5|6|7)[0-9]{8}$/, 'Invalid Algerian phone number')
    .transform(phone => {
      // Normalize to international format
      if (phone.startsWith('0')) {
        return '00213' + phone.slice(1);
      }
      return phone;
    }),

  bio: z.string()
    .max(1000, 'Bio cannot exceed 1000 characters')
    .transform(str => DOMPurify.sanitize(str, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    })),

  wilaya: z.enum([
    'Algiers', 'Oran', 'Constantine', // ... all 48 wilayas
  ]),

  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional()
});

export async function validateProfessional(data: unknown) {
  try {
    const validated = await ProfessionalSchema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    throw error;
  }
}

// Usage in route handler
export async function createProfessional(req: Request, res: Response) {
  const validation = await validateProfessional(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors
    });
  }

  // Proceed with validated & sanitized data
  const professional = await db.professional.create({
    data: validation.data
  });

  res.status(201).json(professional);
}
```

#### 8.2.3 SQL Injection Prevention
```typescript
// ❌ NEVER DO THIS
async function searchProfessionals(query: string) {
  // VULNERABLE TO SQL INJECTION
  const sql = `SELECT * FROM professionals WHERE business_name LIKE '%${query}%'`;
  return db.query(sql);
}

// ✅ ALWAYS USE PARAMETERIZED QUERIES
async function searchProfessionals(query: string) {
  // SAFE: Parameters are properly escaped
  return db.query(
    'SELECT * FROM professionals WHERE business_name LIKE $1',
    [`%${query}%`]
  );
}

// ✅ WITH PRISMA (AUTOMATICALLY SAFE)
async function searchProfessionals(query: string) {
  return prisma.professional.findMany({
    where: {
      businessName: {
        contains: query, // Prisma handles parameterization
        mode: 'insensitive'
      }
    }
  });
}
```

#### 8.2.4 XSS Prevention
```typescript
// backend/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'li'],
    ALLOWED_ATTR: []
  });
}

export function sanitizeForAttribute(dirty: string): string {
  // Remove all HTML tags
  return dirty.replace(/<[^>]*>/g, '');
}

// frontend/utils/sanitize.ts
import DOMPurify from 'dompurify';

export function renderUserContent(html: string) {
  return {
    __html: DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    })
  };
}

// Usage in React component
function ProfessionalBio({ bio }: { bio: string }) {
  return (
    <div
      dangerouslySetInnerHTML={renderUserContent(bio)}
      className="prose"
    />
  );
}
```

### 8.3 Security Headers (Nginx Configuration)
```nginx
# /etc/nginx/sites-available/contacto.dz
server {
  listen 443 ssl http2;
  server_name contacto.dz;

  # SSL Configuration
  ssl_certificate /etc/letsencrypt/live/contacto.dz/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/contacto.dz/privkey.pem;
  ssl_protocols TLSv1.3;
  ssl_ciphers 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256';
  ssl_prefer_server_ciphers on;

  # Security Headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "geolocation=(self), microphone=(), camera=()" always;

  # Content Security Policy (CSP)
  add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.contacto.dz;
    font-src 'self';
    object-src 'none';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  " always;

  # HSTS (Force HTTPS)
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

  # Hide server version
  server_tokens off;

  # Limit request size (prevent DoS)
  client_max_body_size 10M;
  client_body_buffer_size 128k;

  # Timeout settings
  client_body_timeout 12;
  client_header_timeout 12;
  keepalive_timeout 15;
  send_timeout 10;

  location / {
    proxy_pass http://web_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### 8.4 Compliance Requirements

#### 8.4.1 Algerian Law 18-07 (Data Protection)
**Key Requirements:**
- Data must be hosted in Algeria (OVH Oran datacenter ✓)
- User consent required for data collection
- Right to access, modify, delete personal data
- Data breach notification within 72 hours
- Minimum 1-year audit trail retention

**Implementation:**
```typescript
// backend/services/privacy.service.ts
export class PrivacyService {
  // Right to access (GDPR Article 15 equivalent)
  async exportUserData(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        professional: {
          include: {
            services: true,
            reviews: true,
            portfolio: true
          }
        },
        reviews: true,
        transactions: true
      }
    });

    return {
      personal_data: {
        email: user.email,
        phone: user.phone,
        created_at: user.createdAt
      },
      professional_data: user.professional,
      activity: {
        reviews_written: user.reviews,
        transactions: user.transactions
      },
      exported_at: new Date().toISOString()
    };
  }

  // Right to deletion (GDPR Article 17 equivalent)
  async deleteUserData(userId: string) {
    await db.transaction(async (tx) => {
      // Anonymize reviews (can't delete due to business need)
      await tx.review.updateMany({
        where: { userId },
        data: {
          userDisplayName: 'Anonymous User',
          userId: null
        }
      });

      // Delete professional profile
      await tx.professional.delete({
        where: { userId }
      });

      // Delete user account
      await tx.user.delete({
        where: { id: userId }
      });

      // Log deletion (audit trail)
      await tx.auditLog.create({
        data: {
          action: 'USER_DELETED',
          userId,
          timestamp: new Date(),
          details: 'User exercised right to deletion'
        }
      });
    });
  }
}
```

#### 8.4.2 PCI-DSS Compliance (Phase 3)
**Applicable When:**
- Storing, processing, or transmitting cardholder data
- Handling online payments via SATIM

**Requirements Summary:**
1. **Build and Maintain Secure Network**
   - Firewall configuration
   - No default passwords

2. **Protect Cardholder Data**
   - Encryption at rest (AES-256)
   - Encryption in transit (TLS 1.3)
   - Never store CVV/CVC

3. **Maintain Vulnerability Management**
   - Up-to-date antivirus
   - Secure code development
   - Regular security updates

4. **Implement Strong Access Control**
   - Unique IDs per user
   - Physical access restrictions
   - Need-to-know data access

5. **Monitor and Test Networks**
   - Log all access to cardholder data
   - Regular security testing
   - Penetration testing quarterly

6. **Maintain Information Security Policy**
   - Annual security policy review
   - Security awareness training

**Cost:** ~10M DZD for full compliance (Phase 3)

---

## 🚀 SECTION 9: DEPLOYMENT & DEVOPS

### 9.1 CI/CD Pipeline

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run tests
        run: |
          npm ci
          npm run test:all
          npm run lint
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker images
        run: |
          docker build -t contacto-web:${GITHUB_SHA} ./frontend
          docker build -t contacto-api:${GITHUB_SHA} ./backend
      
      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push contacto-web:${GITHUB_SHA}
          docker push contacto-api:${GITHUB_SHA}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/contacto
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T api npm run migrate
            
      - name: Health check
        run: |
          sleep 30
          curl -f https://contacto.dz/health || exit 1
          curl -f https://api.contacto.dz/health || exit 1
      
      - name: Notify team
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 9.2 Database Migration Strategy

```typescript
// Using Prisma Migrate
// prisma/migrations/20260111_add_reviews_table/migration.sql

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "professional_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "overall_rating" INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    "review_text" TEXT,
    "is_approved" BOOLEAN DEFAULT false,
    "fraud_score" NUMERIC(5,2) DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reviews_user_professional_unique" UNIQUE ("user_id", "professional_id")
);

-- CreateIndex
CREATE INDEX "idx_reviews_professional" ON "reviews"("professional_id", "is_approved");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_professional_id_fkey" 
  FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

// Run migration
// $ npx prisma migrate deploy

// Rollback strategy (if needed)
// $ npx prisma migrate resolve --rolled-back 20260111_add_reviews_table
```

### 9.3 Monitoring & Alerting

#### Prometheus Metrics
```typescript
// backend/metrics.ts
import promClient from 'prom-client';

const register = new promClient.Registry();

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom business metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['query_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

export const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  labelNames: ['user_type']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(dbQueryDuration);
register.registerMetric(activeUsers);

// Export metrics endpoint
export async function getMetrics() {
  return register.metrics();
}
```

#### Grafana Dashboards
```yaml
# dashboards/api-performance.json
{
  "dashboard": {
    "title": "Contacto API Performance",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{route}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "{{route}}"
          }
        ]
      },
      {
        "title": "Database Query Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))",
            "legendFormat": "{{query_type}}"
          }
        ]
      }
    ]
  }
}
```

#### Alert Rules
```yaml
# prometheus/alert_rules.yml
groups:
  - name: contacto_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected ({{ $value }})"
          description: "Error rate is above 5% for {{ $labels.route }}"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High response time (P95: {{ $value }}s)"
          description: "95th percentile response time exceeds 1 second"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "PostgreSQL database is unreachable"

      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space ({{ $value | humanizePercentage }})"
          description: "Disk usage is above 90%"

      - alert: HighMemoryUsage
        expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) < 0.1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Available memory is below 10%"
```

---

## 📋 SECTION 10: PROJECT MANAGEMENT & EXECUTION

### 10.1 Development Methodology

**Approach:** Scrum with 2-week sprints

**Sprint Structure:**
```
Sprint Duration: 2 weeks (10 working days)

Day 1 (Monday):
  - Sprint Planning (2 hours)
  - Story pointing (Planning Poker)
  - Task breakdown

Days 2-9 (Tuesday-Wednesday of Week 2):
  - Daily Standup (15 min at 10:00 AM)
  - Development work
  - Code reviews (same-day)
  - Testing

Day 10 (Thursday):
  - Sprint Review (1 hour with stakeholders)
  - Sprint Retrospective (1 hour - team only)
  - Sprint closing admin

Day 11 (Friday):
  - Documentation day
  - Technical debt tasks
  - Learning & improvement
```

### 10.2 Story Pointing Scale (Fibonacci)

| Points | Complexity | Time Estimate | Example |
|--------|-----------|---------------|---------|
| 1 | Trivial | 1-2 hours | Fix typo, update text |
| 2 | Simple | 2-4 hours | Add validation, simple API endpoint |
| 3 | Medium | 4-8 hours | New CRUD page, basic feature |
| 5 | Complex | 1-2 days | Search implementation, complex form |
| 8 | Very Complex | 2-3 days | Payment integration, data migration |
| 13 | Epic | 3-5 days | Dashboard module, authentication system |

**Rule:** Stories >8 points must be broken down into smaller tasks

### 10.3 Definition of Done (DoD)

A story is considered "Done" when:
- ✅ Code is written and follows style guide
- ✅ Unit tests written (>80% coverage)
- ✅ Integration tests pass
- ✅ Code reviewed by at least 1 other developer
- ✅ No critical or high-severity bugs
- ✅ Documentation updated (if applicable)
- ✅ Deployed to staging environment
- ✅ Tested by QA/Product Owner
- ✅ Accepted by Product Owner

### 10.4 Communication Protocols

#### Daily Standup (15 minutes)
**Format:** Each team member answers:
1. What did I complete yesterday?
2. What will I work on today?
3. Are there any blockers?

**Rules:**
- Start on time (10:00 AM sharp)
- Stand up (keeps it short)
- Technical discussions move to "parking lot"
- Blockers addressed immediately after standup

#### Weekly Status Report
**Every Friday 17:00:**
- Sprint progress (burndown chart)
- Completed stories
- Upcoming stories
- Risks/issues
- Budget status

**Recipients:** Stakeholders, investors

#### Monthly All-Hands
**First Monday of month:**
- Product roadmap update
- Metrics review (KPIs)
- Team achievements
- Upcoming challenges
- Q&A session

### 10.5 Risk Register & Mitigation

| Risk ID | Risk Description | Probability | Impact | Mitigation Strategy |
|---------|-----------------|-------------|--------|---------------------|
| R-001 | SATIM approval delays | High | High | Use Chargily as Plan B, start application early (Month 13) |
| R-002 | Key developer leaves | Medium | High | Knowledge sharing (pair programming), documentation, cross-training |
| R-003 | Server downtime | Low | Critical | HA architecture, automated failover, 24/7 monitoring |
| R-004 | Database corruption | Very Low | Critical | Daily backups, WAL archiving, monthly restore tests |
| R-005 | Security breach | Low | Critical | Penetration testing, bug bounty program, security audits |
| R-006 | Slow user adoption | Medium | High | Marketing campaign, free tier, referral program |
| R-007 | Regulatory changes | Low | Medium | Legal monitoring, flexible architecture, compliance advisor |
| R-008 | Competition launches first | Medium | Medium | Fast execution, unique features (offline POS), quality focus |
| R-009 | Funding gaps | Low | High | Multiple funding sources, revenue diversification, cost control |
| R-010 | Technology obsolescence | Low | Low | Use stable, proven tech, avoid bleeding edge, plan migrations |

### 10.6 Success Metrics (KPIs)

#### Phase 1 KPIs (Directory)
| Metric | Target (Month 6) | Measurement Frequency |
|--------|------------------|----------------------|
| Registered Professionals | 500+ | Daily |
| Monthly Active Users | 10,000+ | Weekly |
| Reviews Submitted | 200+ | Daily |
| Search Success Rate | >80% | Weekly |
| Page Load Time (P95) | <3s | Daily |
| API Uptime | 99.9% | Real-time |
| Customer Satisfaction (NPS) | >50 | Monthly |

#### Phase 2 KPIs (Business Tools)
| Metric | Target (Month 12) | Measurement Frequency |
|--------|------------------|----------------------|
| Active POS Users | 200+ | Daily |
| Transactions Processed | 10,000+/month | Weekly |
| API Developers | 50+ | Weekly |
| Gross Merchandise Value (GMV) | 50M DZD/month | Weekly |
| POS Uptime | 99.9% | Real-time |

#### Phase 3 KPIs (Payments)
| Metric | Target (Month 24) | Measurement Frequency |
|--------|------------------|----------------------|
| Payment Success Rate | >98% | Real-time |
| Wallet Users | 5,000+ | Daily |
| Transaction Volume | 100M DZD/month | Daily |
| Fraud Rate | <0.1% | Daily |
| Compliance Audits Passed | 100% | Quarterly |

### 10.7 Decision-Making Framework

**Decision Types:**
1. **Operational** (day-to-day): Tech Lead decides
2. **Tactical** (sprint/feature): Team votes, Product Owner breaks tie
3. **Strategic** (architecture/budget): Stakeholder meeting required

**RACI Matrix Example:**

| Task | Product Owner | Tech Lead | Developers | Stakeholders |
|------|--------------|-----------|------------|--------------|
| Feature prioritization | **A** | C | I | **R** |
| Architecture decisions | C | **AR** | C | I |
| Sprint planning | **R** | **A** | C | I |
| Code reviews | I | **R** | **A** | I |
| Budget approval | I | I | I | **AR** |

Legend:
- **R** = Responsible (does the work)
- **A** = Accountable (final authority)
- **C** = Consulted (provides input)
- **I** = Informed (kept in the loop)

---

## 📞 SECTION 11: SUPPORT & MAINTENANCE

### 11.1 Support Tiers

**Tier 1: Self-Service (24/7)**
- Knowledge base (50+ articles)
- Video tutorials (Arabic/French)
- FAQ section
- Community forum

**Tier 2: Email Support (Business Hours)**
- Response time: <24 hours
- Resolution time: <72 hours
- Languages: Arabic, French, English
- Email: support@contacto.dz

**Tier 3: Priority Support (Pro/Enterprise)**
- Response time: <4 hours
- Resolution time: <24 hours
- Phone support: +213 XXX XXX XXX
- Dedicated account manager

**Tier 4: Emergency (24/7 for Enterprise)**
- Response time: <1 hour
- Critical issues only (downtime, data loss)
- On-call engineer
- Hotline: +213 XXX XXX XXX

### 11.2 Maintenance Windows

**Regular Maintenance:**
- **When:** Every Sunday 02:00-06:00 AM (Algeria time)
- **Duration:** Up to 4 hours
- **Activities:** Database maintenance, security updates, backups verification
- **Notification:** 7 days advance notice

**Emergency Maintenance:**
- **When:** As needed (security patches, critical bugs)
- **Notification:** 24 hours advance (if possible)
- **Communication:** Email, SMS, in-app notification, status page

### 11.3 Incident Response Plan

**Severity Levels:**

| Severity | Description | Example | Response Time | Resolution Time |
|----------|-------------|---------|---------------|-----------------|
| P0 - Critical | Complete outage | Website down, database crash | <15 minutes | <4 hours |
| P1 - High | Major feature broken | Payment failing, login broken | <1 hour | <24 hours |
| P2 - Medium | Minor feature broken | Search slow, UI glitch | <4 hours | <72 hours |
| P3 - Low | Cosmetic issue | Typo, minor UI issue | <24 hours | <1 week |

**Incident Response Steps:**
1. **Detection** (<5 minutes)
   - Automated monitoring alerts
   - User reports via support
   - Team member discovery

2. **Assessment** (<15 minutes)
   - Determine severity
   - Identify affected systems
   - Assemble response team

3. **Communication** (<30 minutes)
   - Update status page
   - Notify affected users
   - Internal team communication (Slack)

4. **Resolution** (Varies by severity)
   - Implement fix or workaround
   - Test thoroughly
   - Deploy to production

5. **Verification** (<1 hour)
   - Confirm fix works
   - Monitor for recurrence
   - Update status page

6. **Post-Mortem** (Within 5 days)
   - Root cause analysis
   - Timeline of events
   - Lessons learned
   - Action items to prevent recurrence

---

## 🎓 CONCLUSION: IMPLEMENTATION CHECKLIST

### Pre-Launch Checklist (Phase 1)

#### Week -4: Final Preparation
- [ ] All MVP features complete and tested
- [ ] Load testing passed (100 concurrent users)
- [ ] Security audit completed
- [ ] Legal documents finalized (ToS, Privacy Policy)
- [ ] Marketing materials ready

#### Week -2: Soft Launch (Beta)
- [ ] Invite 50 beta testers
- [ ] Monitor for bugs
- [ ] Gather feedback
- [ ] Iterate on critical issues

#### Week -1: Launch Preparation
- [ ] Marketing campaign materials distributed
- [ ] Press releases sent
- [ ] Social media scheduled
- [ ] Support team trained

#### Launch Day: Go Live
- [ ] Deploy to production
- [ ] Monitoring active (24/7)
- [ ] Support available
- [ ] Celebrate! 🎉

---

## 📚 APPENDIX: ADDITIONAL RESOURCES

### A. Recommended Reading

**Technical:**
- "Designing Data-Intensive Applications" - Martin Kleppmann
- "Building Microservices" - Sam Newman
- "The Pragmatic Programmer" - Dave Thomas, Andy Hunt

**Business:**
- "The Lean Startup" - Eric Ries
- "Zero to One" - Peter Thiel
- "Crossing the Chasm" - Geoffrey Moore

### B. Useful Tools

**Development:**
- Visual Studio Code (IDE)
- Postman (API testing)
- Docker Desktop (containers)
- TablePlus (database client)

**Collaboration:**
- Slack (team communication)
- Notion (documentation)
- Figma (design)
- Linear (project management)

**Monitoring:**
- Sentry (error tracking)
- Uptime Robot (uptime monitoring)
- Google Analytics (web analytics)
- Hotjar (user behavior)

### C. Contact Information

**Technical Questions:**
- Email: dev@contacto.dz
- Slack: #tech-team

**Business Questions:**
- Email: business@contacto.dz

**Emergencies (24/7):**
- Phone: +213 XXX XXX XXX
- Email: emergency@contacto.dz

---

**Document Version:** 2.0  
**Last Updated:** January 11, 2026  
**Next Review:** February 11, 2026  

**End of Specification Document**
