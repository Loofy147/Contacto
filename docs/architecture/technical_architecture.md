# 🏗️ CONTACTO PLATFORM: TECHNICAL ARCHITECTURE v2.0
## State-of-the-Art Architecture (January 2026)

---

## 📐 ARCHITECTURAL PRINCIPLES

### 1. **Event-Driven First**
All state changes are events. Services communicate asynchronously through events rather than direct API calls.

### 2. **Defense in Depth**
Security at every layer: network, application, data, and organizational.

### 3. **Observability by Design**
Comprehensive logging, metrics, and tracing built in from day one.

### 4. **Offline-First Mobile**
Mobile apps work seamlessly without connectivity, sync when available.

### 5. **Cost-Optimized**
Smart technology choices that balance performance with budget constraints.

---

## 🎯 SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  Next.js 15  │  │   Flutter    │  │   React Native     │    │
│  │  Web App     │  │  POS Tablet  │  │   Mobile App       │    │
│  │  (SSR/PPR)   │  │  (Offline)   │  │   (Offline-First)  │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘    │
│         │                  │                   │                 │
└─────────┼──────────────────┼───────────────────┼─────────────────┘
          │                  │                   │
┌─────────▼──────────────────▼───────────────────▼─────────────────┐
│                      EDGE/CDN LAYER                               │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Cloudflare Pro (DDoS + WAF + Caching + Rate Limiting)  │     │
│  └─────────────────────────────────────────────────────────┘     │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Kong Gateway (Open Source)                              │     │
│  │  • Authentication (JWT/OAuth2)                           │     │
│  │  • Rate Limiting (per user/tier)                         │     │
│  │  • Request Transformation                                │     │
│  │  • Analytics & Logging                                   │     │
│  └─────────────────────────────────────────────────────────┘     │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                    MICROSERVICES LAYER                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐          │
│  │  Users   │ │ Business │ │ Payments │ │ Inventory  │          │
│  │ Service  │ │ Service  │ │   Hub    │ │  Service   │  ...     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘          │
│       │            │            │             │                  │
│       └────────────┴────────────┴─────────────┘                  │
│                          │                                        │
└──────────────────────────┼────────────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────────┐
│                    EVENT BUS (Apache Kafka)                       │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Topics: user.*, transaction.*, inventory.*, payment.*  │     │
│  │  • Guaranteed ordering per partition                    │     │
│  │  • Event replay capability                              │     │
│  │  • Dead letter queue for failed events                  │     │
│  └─────────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────────┐
│                       DATA LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │ PostgreSQL   │  │    Redis     │  │    MinIO (S3)      │     │
│  │ (Partitioned)│  │  (Cache)     │  │  (File Storage)    │     │
│  │ • Master     │  │ • Sessions   │  │  • Images          │     │
│  │ • Replicas   │  │ • Rate Limit │  │  • Documents       │     │
│  │ • PgBouncer  │  │ • Job Queue  │  │  • Backups         │     │
│  └──────────────┘  └──────────────┘  └────────────────────┘     │
└───────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────────┐
│              OBSERVABILITY & MONITORING                           │
│  ┌───────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐      │
│  │Prometheus │  │  Grafana   │  │  Sentry  │  │ ELK Stack│      │
│  │ (Metrics) │  │(Dashboard) │  │ (Errors) │  │  (Logs)  │      │
│  └───────────┘  └────────────┘  └──────────┘  └──────────┘      │
└───────────────────────────────────────────────────────────────────┘
```

---

## 💾 DATABASE ARCHITECTURE

The definitive guide to our database schema, algorithms, and optimization strategies can be found in the following documents:

- **[./database/contacto_database_schema.sql](./database/contacto_database_schema.sql):** The complete, production-ready SQL schema with detailed comments, indexing, and partitioning strategies.
- **[./database/contacto_db_algorithms.md](./database/contacto_db_algorithms.md):** A comprehensive guide to the algorithms and query optimization techniques used in the Contacto platform.

---

## 🔧 BACKEND ARCHITECTURE (Microservices)

### Core Services

#### 1. **Users & Auth Service**
**Responsibilities:**
- User registration, login, password reset
- JWT token generation & validation
- OAuth2 integration (Google, Facebook)
- API key management
- Role-based access control (RBAC)

**Tech Stack:**
- Node.js 20 + Express/Fastify
- Passport.js (authentication strategies)
- bcrypt (password hashing)
- jsonwebtoken (JWT)

**Database:**
```sql
-- Users table with proper indexing
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Audit fields
  created_ip INET,
  last_login_ip INET,
  login_count INTEGER DEFAULT 0,

  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_role (role)
);

-- Sessions table (JWT blacklist for logout)
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_token_hash (token_hash),
  INDEX idx_expires (expires_at)
);
```

**API Endpoints:**
```typescript
POST   /v1/auth/register          // Register new user
POST   /v1/auth/login             // Login (returns JWT)
POST   /v1/auth/logout            // Logout (blacklist token)
POST   /v1/auth/refresh           // Refresh token
POST   /v1/auth/forgot-password   // Send reset email
POST   /v1/auth/reset-password    // Reset with token
GET    /v1/auth/me                // Get current user
PUT    /v1/auth/me                // Update profile
POST   /v1/api-keys               // Create API key
GET    /v1/api-keys               // List user's keys
DELETE /v1/api-keys/:id           // Revoke key
```

---

#### 2. **Business/Professionals Service**
**Responsibilities:**
- Professional profile CRUD
- Service listings management
- Portfolio management
- Business analytics
- Search & filtering

**Tech Stack:**
- Node.js 20 + Fastify (for performance)
- Prisma ORM
- Meilisearch (for fast search)
- Sharp (image processing)

**Database Schema:**
```sql
-- Professionals with full-text search
CREATE TABLE professionals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  category_id UUID REFERENCES categories(id),

  -- Basic info
  business_name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  bio TEXT,
  logo_url VARCHAR(255),
  cover_url VARCHAR(255),

  -- Contact
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(255),

  -- Location (PostGIS)
  address TEXT,
  wilaya VARCHAR(50),
  commune VARCHAR(50),
  location GEOGRAPHY(POINT, 4326),

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_level INTEGER DEFAULT 0, -- 0-3

  -- Stats (denormalized for performance)
  total_reviews INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  response_rate NUMERIC(5,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  INDEX idx_category (category_id),
  INDEX idx_location USING GIST(location),
  INDEX idx_verified (is_verified),
  INDEX idx_rating (average_rating DESC)
);

-- Enable full-text search
CREATE INDEX idx_professional_search ON professionals
  USING gin(to_tsvector('simple', business_name || ' ' || COALESCE(bio, '')));
```

**Search Implementation:**
```typescript
// Meilisearch index configuration
const professionalIndex = client.index('professionals');

// Configure searchable attributes
await professionalIndex.updateSettings({
  searchableAttributes: [
    'businessName',
    'bio',
    'services',
    'wilaya',
    'commune'
  ],

  filterableAttributes: [
    'categoryId',
    'wilaya',
    'isVerified',
    'averageRating'
  ],

  sortableAttributes: [
    'averageRating',
    'totalReviews',
    'createdAt'
  ],

  // Typo tolerance for Arabic/French
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: {
      oneTypo: 4,
      twoTypos: 8
    }
  },

  // Ranking rules (order matters!)
  rankingRules: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
    'averageRating:desc' // Custom rule
  ]
});

// Search API
async function searchProfessionals(query: string, filters: SearchFilters) {
  const results = await professionalIndex.search(query, {
    filter: [
      filters.categoryId && `categoryId = ${filters.categoryId}`,
      filters.wilaya && `wilaya = "${filters.wilaya}"`,
      filters.minRating && `averageRating >= ${filters.minRating}`,
      filters.verifiedOnly && 'isVerified = true'
    ].filter(Boolean).join(' AND '),

    sort: [`${filters.sortBy}:${filters.sortOrder}`],
    limit: filters.limit || 20,
    offset: filters.offset || 0,

    // Geo-search (if location provided)
    ...(filters.location && {
      filter: `_geoRadius(${filters.location.lat}, ${filters.location.lng}, ${filters.radius || 10000})`
    })
  });

  return results;
}
```

---

#### 3. **Payment Hub Service** (Phase 3)
**Responsibilities:**
- Payment orchestration (SATIM, Chargily, Wallet)
- Transaction lifecycle management
- Fraud detection & prevention
- Settlement & reconciliation
- Refunds & chargebacks

**Tech Stack:**
- Node.js 20 + TypeScript
- Event Sourcing for transactions
- Redis (transaction state cache)
- PostgreSQL (event store)

**Architecture:**
```typescript
// Event Sourcing Pattern

interface PaymentEvent {
  eventId: string;
  eventType: 'INITIATED' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  aggregateId: string; // transactionId
  timestamp: Date;
  payload: {
    amount: number;
    currency: string;
    method: string;
    metadata: Record<string, any>;
  };
  version: number;
}

class PaymentAggregate {
  private events: PaymentEvent[] = [];
  private state: PaymentState;

  // Build current state from events
  static async load(transactionId: string): Promise<PaymentAggregate> {
    const events = await db.query(
      'SELECT * FROM payment_events WHERE aggregate_id = $1 ORDER BY version ASC',
      [transactionId]
    );

    const aggregate = new PaymentAggregate(transactionId);
    events.forEach(event => aggregate.apply(event));
    return aggregate;
  }

  // Process command
  async authorize(amount: number, method: string) {
    // Validate state
    if (this.state.status !== 'INITIATED') {
      throw new Error('Cannot authorize non-initiated payment');
    }

    // Create event
    const event: PaymentEvent = {
      eventId: uuid(),
      eventType: 'AUTHORIZED',
      aggregateId: this.id,
      timestamp: new Date(),
      payload: { amount, method },
      version: this.events.length + 1
    };

    // Persist event (atomic)
    await this.saveEvent(event);

    // Apply to in-memory state
    this.apply(event);

    // Publish to event bus
    await kafka.publish('payment.authorized', event);
  }

  private apply(event: PaymentEvent) {
    this.events.push(event);

    // Update state based on event type
    switch (event.eventType) {
      case 'INITIATED':
        this.state = { status: 'INITIATED', ...event.payload };
        break;
      case 'AUTHORIZED':
        this.state = { ...this.state, status: 'AUTHORIZED' };
        break;
      // ... other cases
    }
  }

  private async saveEvent(event: PaymentEvent) {
    // Outbox pattern (ensures event is never lost)
    await db.transaction(async (tx) => {
      // 1. Save event
      await tx.query(`
        INSERT INTO payment_events
        (event_id, aggregate_id, event_type, payload, version)
        VALUES ($1, $2, $3, $4, $5)
      `, [event.eventId, event.aggregateId, event.eventType, event.payload, event.version]);

      // 2. Insert into outbox
      await tx.query(`
        INSERT INTO outbox (aggregate_type, aggregate_id, event_type, payload)
        VALUES ('Payment', $1, $2, $3)
      `, [event.aggregateId, event.eventType, event]);
    });
  }
}

// Background job publishes events from outbox
async function publishOutboxEvents() {
  const unpublished = await db.query(`
    SELECT * FROM outbox
    WHERE published_at IS NULL
    ORDER BY created_at ASC
    LIMIT 100
    FOR UPDATE SKIP LOCKED
  `);

  for (const event of unpublished.rows) {
    try {
      await kafka.publish(event.event_type, event.payload);

      await db.query(
        'UPDATE outbox SET published_at = NOW() WHERE id = $1',
        [event.id]
      );
    } catch (error) {
      // Log and retry later
      console.error('Failed to publish event', event.id, error);
    }
  }
}

// Run every 5 seconds
setInterval(publishOutboxEvents, 5000);
```

**Fraud Detection:**
```typescript
interface FraudScore {
  score: number; // 0-100
  factors: {
    velocityCheck: number;
    amountAnomaly: number;
    locationRisk: number;
    deviceFingerprint: number;
    behavioralAnomaly: number;
  };
  recommendation: 'APPROVE' | 'REVIEW' | 'DECLINE';
}

class FraudDetectionEngine {
  async score(transaction: Transaction): Promise<FraudScore> {
    const factors = await Promise.all([
      this.velocityCheck(transaction),
      this.amountAnomaly(transaction),
      this.locationRisk(transaction),
      this.deviceFingerprint(transaction),
      this.behavioralAnomaly(transaction)
    ]);

    // Weighted scoring
    const score =
      factors[0] * 0.3 + // Velocity (most important)
      factors[1] * 0.25 +
      factors[2] * 0.2 +
      factors[3] * 0.15 +
      factors[4] * 0.1;

    let recommendation: 'APPROVE' | 'REVIEW' | 'DECLINE';
    if (score < 30) recommendation = 'APPROVE';
    else if (score < 70) recommendation = 'REVIEW';
    else recommendation = 'DECLINE';

    return {
      score,
      factors: {
        velocityCheck: factors[0],
        amountAnomaly: factors[1],
        locationRisk: factors[2],
        deviceFingerprint: factors[3],
        behavioralAnomaly: factors[4]
      },
      recommendation
    };
  }

  private async velocityCheck(tx: Transaction): Promise<number> {
    // Check for unusual transaction frequency
    const recentTxCount = await redis.get(`tx:count:${tx.userId}:1h`);

    if (recentTxCount > 10) return 80; // Very suspicious
    if (recentTxCount > 5) return 50;  // Somewhat suspicious
    return 10; // Normal
  }

  private async amountAnomaly(tx: Transaction): Promise<number> {
    // Check if amount is unusual for this user
    const avgAmount = await db.query(`
      SELECT AVG(amount) FROM transactions
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
    `, [tx.userId]);

    const deviation = Math.abs(tx.amount - avgAmount) / avgAmount;

    if (deviation > 5) return 90; // 5x above average
    if (deviation > 2) return 60;
    return 20;
  }

  // ... other risk factors
}
```

---

#### 4. **Inventory Service** (Phase 2)
**Responsibilities:**
- Product catalog management
- Stock tracking & alerts
- Supplier management
- Stock movements & audit trail

**Tech Stack:**
- Node.js + TypeScript
- Prisma ORM
- Redis (stock cache)
- PostgreSQL (partitioned tables)

**Optimized Schema:**
```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),

  -- Pricing
  cost_price NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 19.00, -- TVA

  -- Inventory
  current_stock INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 10,
  reorder_quantity INTEGER DEFAULT 50,

  -- Metadata
  barcode VARCHAR(50),
  image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_merchant (merchant_id),
  INDEX idx_sku (sku),
  INDEX idx_barcode (barcode),
  INDEX idx_category (category_id),

  -- Check constraint
  CONSTRAINT positive_stock CHECK (current_stock >= 0)
);

-- Stock movements (partitioned by month for performance)
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  movement_type VARCHAR(20) NOT NULL, -- IN, OUT, ADJUSTMENT, TRANSFER
  quantity INTEGER NOT NULL,
  reference VARCHAR(100), -- PO number, sale ID, etc.
  notes TEXT,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE stock_movements_2026_01 PARTITION OF stock_movements
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Trigger to update product stock
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type IN ('IN', 'ADJUSTMENT') THEN
    UPDATE products
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.movement_type = 'OUT' THEN
    UPDATE products
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_movement_trigger
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION update_product_stock();
```

**Redis Caching Strategy:**
```typescript
class InventoryService {
  async getProduct(id: string): Promise<Product> {
    // Try cache first
    const cached = await redis.get(`product:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss, fetch from DB
    const product = await db.product.findUnique({ where: { id } });

    // Cache for 1 hour
    await redis.setex(`product:${id}`, 3600, JSON.stringify(product));

    return product;
  }

  async updateStock(productId: string, quantity: number, type: string) {
    // Pessimistic locking to prevent race conditions
    await db.transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        // Lock for update
        lock: 'FOR UPDATE'
      });

      // Record movement
      await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          movementType: type
        }
      });

      // Invalidate cache
      await redis.del(`product:${productId}`);

      // Check for low stock alert
      if (product.current_stock <= product.reorder_point) {
        await this.sendLowStockAlert(product);
      }
    });
  }

  // Real-time stock via WebSocket
  setupStockSubscription(merchantId: string, socket: WebSocket) {
    // Subscribe to Redis pub/sub
    const subscriber = redis.duplicate();
    subscriber.subscribe(`stock:${merchantId}`);

    subscriber.on('message', (channel, message) => {
      socket.send(JSON.stringify({
        type: 'STOCK_UPDATE',
        data: JSON.parse(message)
      }));
    });
  }
}
```

---

## 🌐 FRONTEND ARCHITECTURE (Next.js 15)

### File Structure
```
frontend/
├── app/                          # App Router (Next.js 15)
│   ├── (auth)/                  # Route group (no URL segment)
│   │   ├── login/
│   │   │   └── page.tsx         # /login
│   │   └── register/
│   │       └── page.tsx         # /register
│   ├── (marketing)/             # Public pages
│   │   ├── page.tsx             # / (homepage)
│   │   └── about/
│   │       └── page.tsx
│   ├── professionals/
│   │   ├── page.tsx             # /professionals (list)
│   │   ├── [id]/
│   │   │   ├── page.tsx         # /professionals/:id
│   │   │   └── reviews/
│   │   │       └── page.tsx     # /professionals/:id/reviews
│   │   └── loading.tsx          # Loading UI
│   ├── dashboard/               # Business dashboard
│   │   ├── layout.tsx           # Dashboard layout
│   │   ├── page.tsx             # /dashboard (overview)
│   │   ├── sales/
│   │   ├── inventory/
│   │   └── customers/
│   ├── api/                     # API routes
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts
│   ├── layout.tsx               # Root layout
│   ├── error.tsx                # Error boundary
│   ├── not-found.tsx            # 404 page
│   └── global-error.tsx         # Global error handler
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── dashboard/               # Dashboard-specific
│   │   ├── overview/
│   │   ├── sales/
│   │   └── ...
│   └── shared/                  # Shared components
│       ├── header.tsx
│       ├── footer.tsx
│       └── ...
├── lib/
│   ├── api.ts                   # API client
│   ├── utils.ts                 # Utilities
│   └── validations.ts           # Zod schemas
├── hooks/
│   ├── use-debounce.ts
│   ├── use-media-query.ts
│   └── ...
└── stores/
    ├── use-auth-store.ts        # Zustand store
    └── use-cart-store.ts
```

### Best Practices

```typescript
// ✅ Server Component (default)
// app/professionals/page.tsx
export default async function ProfessionalsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const params = await searchParams; // Next.js 15: params is Promise

  // Fetch data directly (no useEffect!)
  const professionals = await api.professionals.search({
    query: params.q,
    category: params.category
  });

  return (
    <div>
      <SearchBar defaultValue={params.q} />

      {/* Suspense for non-critical data */}
      <Suspense fallback={<Skeleton />}>
        <ProfessionalList professionals={professionals} />
      </Suspense>
    </div>
  );
}

// ✅ Client Component (only when needed)
// components/SearchBar.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    router.replace(`/professionals?${params.toString()}`);
  }, 300);

  return (
    <input
      type="search"
      defaultValue={defaultValue}
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search professionals..."
    />
  );
}

// ✅ Parallel Data Fetching
export default async function ProfessionalPage({ params }: Props) {
  const { id } = await params;

  // Fetch in parallel
  const [professional, reviews, services] = await Promise.all([
    api.professionals.get(id),
    api.reviews.list({ professionalId: id }),
    api.services.list({ professionalId: id })
  ]);

  return (
    <div>
      <ProfileHeader professional={professional} />
      <ServicesList services={services} />
      <ReviewsList reviews={reviews} />
    </div>
  );
}

// ✅ Streaming with Suspense
export default function DashboardPage() {
  return (
    <div>
      {/* Shows immediately */}
      <QuickStats />

      {/* Streams in when ready */}
      <Suspense fallback={<ChartSkeleton />}>
        <SalesChart />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <RecentTransactions />
      </Suspense>
    </div>
  );
}

async function SalesChart() {
  // Expensive query
  const data = await db.query('...');
  return <Chart data={data} />;
}
```

### Performance Optimization

```typescript
// Image Optimization
import Image from 'next/image';

<Image
  src="/professional-avatar.jpg"
  alt="Professional"
  width={200}
  height={200}
  quality={85}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQ..." // Low-res placeholder
/>

// Font Optimization
import { Inter, Cairo } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const cairo = Cairo({ subsets: ['arabic'] });

// Metadata API (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const professional = await api.professionals.get(id);

  return {
    title: `${professional.businessName} | Contacto`,
    description: professional.bio,
    openGraph: {
      title: professional.businessName,
      description: professional.bio,
      images: [professional.logoUrl]
    },
    // Structured data
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: professional.businessName,
        image: professional.logoUrl,
        address: {
          '@type': 'PostalAddress',
          addressLocality: professional.wilaya,
          addressCountry: 'DZ'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: professional.averageRating,
          reviewCount: professional.totalReviews
        }
      })
    }
  };
}

// Partial Prerendering (PPR)
export const experimental_ppr = true;

export default async function Page() {
  return (
    <>
      {/* Static shell (prerendered) */}
      <StaticHeader />

      {/* Dynamic hole (rendered on-demand) */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />
      </Suspense>
    </>
  );
}
```

---

## 📱 MOBILE ARCHITECTURE (React Native + Expo)

### Offline-First Strategy

```typescript
// WatermelonDB Setup
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { Product, Transaction, Customer } from './models';

const adapter = new SQLiteAdapter({
  schema,
  // Encryption (recommended for POS data)
  dbName: 'contacto',
  jsi: true, // Use JSI for better performance
  onSetUpError: error => {
    console.error('Database setup error', error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [Product, Transaction, Customer]
});

// Sync Engine
class SyncEngine {
  private lastSyncTime: Date | null = null;

  async sync() {
    try {
      // 1. Push local changes
      await this.pushChanges();

      // 2. Pull server changes
      await this.pullChanges();

      // 3. Update sync timestamp
      this.lastSyncTime = new Date();
      await AsyncStorage.setItem('lastSync', this.lastSyncTime.toISOString());

    } catch (error) {
      console.error('Sync failed', error);
      // Schedule retry with exponential backoff
      this.scheduleRetry();
    }
  }

  private async pushChanges() {
    const changes = await database.adapter.getLocalChanges();

    if (changes.length === 0) return;

    const response = await api.sync.push({
      changes,
      lastPulledAt: this.lastSyncTime
    });

    // Handle conflicts
    for (const conflict of response.conflicts) {
      await this.resolveConflict(conflict);
    }

    // Mark as synced
    await database.adapter.markLocalChangesAsSynced(changes);
  }

  private async pullChanges() {
    const { changes, timestamp } = await api.sync.pull({
      lastPulledAt: this.lastSyncTime
    });

    await database.write(async () => {
      for (const change of changes) {
        await this.applyServerChange(change);
      }
    });
  }

  private async resolveConflict(conflict: Conflict) {
    // Last-Write-Wins strategy
    if (conflict.server.updatedAt > conflict.local.updatedAt) {
      await this.applyServerChange(conflict.server);
    } else {
      // Force push local version
      await api.sync.forcePush(conflict.local);
    }
  }
}

// Transaction Queue (for critical operations)
class TransactionQueue {
  async enqueue(transaction: Transaction) {
    await database.write(async () => {
      await queueCollection.create(q => {
        q.transactionId = transaction.id;
        q.data = JSON.stringify(transaction);
        q.status = 'pending';
        q.attempts = 0;
      });
    });

    // Try immediate sync
    this.processQueue();
  }

  async processQueue() {
    const pending = await queueCollection
      .query(Q.where('status', 'pending'))
      .fetch();

    for (const item of pending) {
      try {
        await api.transactions.submit(JSON.parse(item.data));

        await database.write(async () => {
          await item.update(q => {
            q.status = 'completed';
            q.completedAt = new Date();
          });
        });
      } catch (error) {
        await database.write(async () => {
          await item.update(q => {
            q.attempts += 1;
            q.lastError = error.message;

            if (q.attempts > 5) {
              q.status = 'failed';
            }
          });
        });
      }
    }
  }
}
```

### Hardware Integration

```typescript
// Barcode Scanner
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';

function BarcodeScannerScreen() {
  const devices = useCameraDevices();
  const device = devices.back;

  const [frameProcessor, barcodes] = useScanBarcodes([
    BarcodeFormat.EAN_13,
    BarcodeFormat.QR_CODE
  ]);

  useEffect(() => {
    if (barcodes.length > 0) {
      const barcode = barcodes[0].displayValue;
      handleBarcodeScanned(barcode);
    }
  }, [barcodes]);

  async function handleBarcodeScanned(barcode: string) {
    // Lookup product
    const product = await database.get('products')
      .query(Q.where('barcode', barcode))
      .fetch();

    if (product.length > 0) {
      // Add to cart
      cartStore.addItem(product[0]);
    } else {
      // Show not found
      Alert.alert('Product not found');
    }
  }

  return (
    <Camera
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
      style={StyleSheet.absoluteFill}
    />
  );
}

// Thermal Printer
import ThermalPrinter from 'react-native-thermal-receipt-printer';

async function printReceipt(transaction: Transaction) {
  try {
    await ThermalPrinter.printText(`
      ================================
      ${business.name}
      ${business.address}
      Tel: ${business.phone}
      ================================

      Date: ${formatDate(transaction.createdAt)}
      Receipt #: ${transaction.id.slice(0, 8)}

      ${transaction.items.map(item => `
        ${item.name}
        ${item.quantity} x ${item.price} DZD
        Total: ${item.quantity * item.price} DZD
      `).join('\n')}

      --------------------------------
      Subtotal: ${transaction.subtotal} DZD
      TVA (19%): ${transaction.tax} DZD
      TOTAL: ${transaction.total} DZD
      --------------------------------

      Payment: ${transaction.paymentMethod}

      Thank you for your business!



    `);

    await ThermalPrinter.printQrCode(transaction.id, 200);

  } catch (error) {
    console.error('Print failed', error);
    // Save to queue for retry
    await printQueue.enqueue(transaction);
  }
}
```

---

## 🔐 SECURITY ARCHITECTURE

### Defense in Depth

```
┌─────────────────────────────────────────────────────┐
│ LAYER 1: NETWORK (Cloudflare + Nginx)               │
│ • DDoS protection (10 Tbps capacity)                │
│ • WAF rules (OWASP Top 10)                          │
│ • Rate limiting (per IP/endpoint)                   │
│ • SSL/TLS 1.3 only                                  │
└─────────────────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│ LAYER 2: API GATEWAY (Kong)                         │
│ • JWT validation                                    │
│ • API key verification                              │
│ • Request size limits                               │
│ • IP whitelisting                                   │
└─────────────────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│ LAYER 3: APPLICATION                                │
│ • Input validation (Zod schemas)                    │
│ • Output encoding (prevent XSS)                     │
│ • Parameterized queries (prevent SQL injection)     │
│ • CSRF tokens                                       │
└─────────────────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│ LAYER 4: DATA                                       │
│ • Encryption at rest (AES-256)                      │
│ • Encryption in transit (TLS 1.3)                   │
│ • Database access control (least privilege)         │
│ • Audit logging (immutable)                         │
└─────────────────────────────────────────────────────┘
```

### Security Checklist

```markdown
## Infrastructure Security
- [ ] All servers behind private network
- [ ] Bastion host for SSH access only
- [ ] SSH key-based auth (no passwords)
- [ ] Firewall rules (deny all, allow specific)
- [ ] Fail2Ban installed and configured
- [ ] Auto-update security patches

## Application Security
- [ ] All dependencies up-to-date (Dependabot)
- [ ] SAST scanning (Snyk/SonarQube)
- [ ] DAST scanning (OWASP ZAP)
- [ ] Secret management (Vault/AWS Secrets Manager)
- [ ] Environment variables never in code
- [ ] Security headers configured
- [ ] CORS properly configured

## Data Security
- [ ] Passwords hashed with bcrypt (cost 12+)
- [ ] PII encrypted in database
- [ ] Backups encrypted
- [ ] Backups tested monthly
- [ ] RBAC implemented
- [ ] Audit logs for sensitive operations

## Compliance
- [ ] GDPR/Law 18-07 compliant
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie consent banner
- [ ] Data retention policy enforced
- [ ] Right to deletion implemented

## Monitoring
- [ ] SIEM configured (ELK Stack)
- [ ] Real-time alerts for anomalies
- [ ] Failed login attempts tracked
- [ ] Privilege escalation monitored
- [ ] File integrity monitoring (AIDE)
- [ ] Log retention (1 year min)

## Incident Response
- [ ] IR plan documented
- [] IR team designated
- [ ] Contact list maintained
- [ ] Runbooks for common incidents
- [ ] Post-mortem template
- [ ] Annual DR drill
```

---

## 📊 MONITORING & OBSERVABILITY

### The Three Pillars

```
1. METRICS (Prometheus + Grafana)
   What is happening right now?

2. LOGS (ELK Stack)
   What happened in detail?

3. TRACES (Jaeger/OpenTelemetry)
   How did a request flow through the system?
```

### Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'contacto-api'
    static_configs:
      - targets: ['localhost:3000']

  - job_name: 'contacto-db'
    static_configs:
      - targets: ['localhost:9187'] # postgres_exporter

  - job_name: 'contacto-redis'
    static_configs:
      - targets: ['localhost:9121'] # redis_exporter

# Alert rules
groups:
  - name: contacto_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseDown
        expr: up{job="contacto-db"} == 0
        for: 1m
        annotations:
          summary: "Database is down"

      - alert: HighCPU
        expr: cpu_usage > 80
        for: 10m
        annotations:
          summary: "CPU usage above 80%"
```

### Application Instrumentation

```typescript
// Express middleware for metrics
import promClient from 'prom-client';

const register = new promClient.Registry();

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);

// Middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    }, duration);

    httpRequestTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Distributed Tracing

```typescript
// OpenTelemetry setup
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const provider = new NodeTracerProvider();

provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new JaegerExporter({
      endpoint: 'http://localhost:14268/api/traces'
    })
  )
);

provider.register();

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new PrismaInstrumentation()
  ]
});

// Now all HTTP/Express/Prisma calls are automatically traced!
```

---

## 💡 CONCLUSION

This architecture represents the **state-of-the-art** for building a production-ready platform in 2026. Key takeaways:

1. **Event-Driven** - Scalable, resilient, auditable
2. **Security First** - Defense in depth at every layer
3. **Observability** - Know what's happening always
4. **Offline-First Mobile** - Works without internet
5. **Cost-Optimized** - Smart choices that save money

**Next Steps:**
1. Review and approve this architecture
2. Create detailed implementation roadmap
3. Set up development environment
4. Begin Phase 1 implementation

**Questions?** Contact the architecture team.