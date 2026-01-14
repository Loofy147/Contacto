# 📋 Contacto CRM Service

Production-ready Customer Relationship Management (CRM) microservice for the Contacto platform.

## 🎯 Overview

The CRM service manages customer relationships, sales pipeline, activities, and tasks for Algerian professionals on the Contacto platform. It provides comprehensive contact management, deal tracking, activity logging, and sales analytics.

## ✨ Features

### Core Capabilities
- **Contact Management**: Full CRUD for leads, customers, partners, and vendors
- **Deal Pipeline**: Track opportunities from prospecting to close
- **Activity Tracking**: Log calls, emails, meetings, and tasks
- **Task Management**: Create and manage follow-up tasks
- **Lead Scoring**: Automatic lead scoring based on engagement
- **Sales Analytics**: Pipeline metrics, conversion rates, and revenue tracking
- **Multi-tenancy**: Isolated data per professional/business

### Technical Features
- **TypeScript**: Full type safety throughout the codebase
- **Prisma ORM**: Type-safe database access with migrations
- **Zod Validation**: Runtime type checking for all inputs
- **REST API**: Clean, RESTful endpoints
- **Soft Deletes**: Data is never permanently lost
- **Pagination**: Efficient data retrieval with cursor/offset pagination
- **Filtering**: Advanced search and filter capabilities
- **Audit Trail**: Track all changes with timestamps
- **Error Handling**: Comprehensive error handling with clear messages

## 🏗️ Architecture

```
contacto-crm-service/
├── src/
│   ├── index.ts              # Express server setup
│   ├── routes.ts             # API route definitions
│   ├── types.ts              # TypeScript interfaces
│   ├── validation.ts         # Zod schemas
│   └── services/
│       ├── contact.service.ts    # Contact business logic
│       ├── deal.service.ts       # Deal business logic
│       └── activity.service.ts   # Activity & Task logic
├── prisma/
│   └── schema.prisma         # Database schema
├── tests/
│   └── *.test.ts             # Unit and integration tests
└── docs/
    ├── API.md                # API documentation
    └── DEPLOYMENT.md         # Deployment guide
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd contacto-crm-service
npm install
```

2. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup database:**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. **Start development server:**
```bash
npm run dev
```

The service will start on `http://localhost:3001`

### Verify Installation
```bash
curl http://localhost:3001/api/v1/crm/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "crm-service",
  "timestamp": "2026-01-11T..."
}
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1/crm
```

### Authentication
All endpoints require authentication. Include the professional ID in headers:
```
X-Professional-Id: prof-123
X-User-Id: user-123
```

*(In production, this would be extracted from JWT tokens)*

### Contacts Endpoints

#### Create Contact
```http
POST /contacts
Content-Type: application/json

{
  "firstName": "Ahmed",
  "lastName": "Benali",
  "email": "ahmed.benali@example.dz",
  "phone": "0555123456",
  "company": "Benali Construction",
  "type": "LEAD",
  "source": "WEBSITE"
}
```

#### List Contacts
```http
GET /contacts?page=1&limit=20&type=LEAD&search=Ahmed
```

Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `type` (enum): Filter by contact type
- `status` (enum): Filter by status
- `search` (string): Search across name, email, phone, company
- `minLeadScore` / `maxLeadScore` (number): Score range filter
- `sortBy` (string): Field to sort by
- `sortOrder` (asc|desc): Sort direction

#### Get Contact by ID
```http
GET /contacts/:id
```

#### Update Contact
```http
PUT /contacts/:id
Content-Type: application/json

{
  "phone": "0555999888",
  "leadScore": 85,
  "nextFollowUpDate": "2026-01-15"
}
```

#### Delete Contact
```http
DELETE /contacts/:id
```

#### Get Follow-Up Contacts
```http
GET /contacts/follow-up
```
Returns contacts where `nextFollowUpDate` ≤ today.

#### Get Contact Metrics
```http
GET /contacts/metrics
```
Returns aggregated metrics:
```json
{
  "totalContacts": 150,
  "byType": {
    "LEAD": 80,
    "CUSTOMER": 60,
    "PARTNER": 10
  },
  "bySource": {
    "WEBSITE": 50,
    "REFERRAL": 40,
    "DIRECTORY": 30
  },
  "averageLeadScore": 65,
  "conversionRate": 40.5
}
```

### Deals Endpoints

#### Create Deal
```http
POST /deals
Content-Type: application/json

{
  "contactId": "contact-123",
  "title": "Office Renovation Project",
  "amount": 500000,
  "probability": 70,
  "stage": "PROPOSAL",
  "priority": "HIGH",
  "expectedCloseDate": "2026-02-15"
}
```

#### List Deals
```http
GET /deals?stage=PROPOSAL&minAmount=100000
```

#### Update Deal
```http
PUT /deals/:id
Content-Type: application/json

{
  "stage": "NEGOTIATION",
  "probability": 80
}
```

#### Move Deal to Next Stage
```http
POST /deals/:id/advance
```
Automatically advances deal through pipeline:
PROSPECTING → QUALIFICATION → PROPOSAL → NEGOTIATION → CLOSED_WON

#### Get Pipeline Metrics
```http
GET /deals/pipeline/metrics
```
Returns:
```json
{
  "totalDeals": 25,
  "totalValue": 5000000,
  "averageDealSize": 200000,
  "winRate": 45.5,
  "averageSalesCycle": 45,
  "byStage": [
    {
      "stage": "PROSPECTING",
      "count": 10,
      "value": 2000000
    },
    ...
  ]
}
```

### Activities Endpoints

#### Create Activity
```http
POST /activities
Content-Type: application/json

{
  "contactId": "contact-123",
  "type": "CALL",
  "subject": "Follow-up call about proposal",
  "description": "Discussed project timeline and budget",
  "priority": "HIGH",
  "scheduledAt": "2026-01-12T14:00:00Z",
  "duration": 30
}
```

#### List Activities
```http
GET /activities?status=PENDING&fromDate=2026-01-01
```

#### Complete Activity
```http
PUT /activities/:id
Content-Type: application/json

{
  "status": "COMPLETED",
  "outcome": "Client agreed to move forward with proposal"
}
```

#### Get Upcoming Activities
```http
GET /activities/upcoming
```
Returns activities scheduled within next 7 days.

#### Get Overdue Activities
```http
GET /activities/overdue
```

### Tasks Endpoints

#### Create Task
```http
POST /tasks
Content-Type: application/json

{
  "contactId": "contact-123",
  "title": "Send proposal document",
  "description": "Email updated proposal with pricing",
  "priority": "HIGH",
  "dueDate": "2026-01-15"
}
```

#### List Tasks
```http
GET /tasks?status=PENDING
```

#### Complete Task
```http
PUT /tasks/:id
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

#### Get Overdue Tasks
```http
GET /tasks/overdue
```

## 📊 Data Models

### Contact
```typescript
{
  id: string;              // UUID
  firstName: string;       // Required
  lastName: string;        // Required
  fullName: string;        // Auto-computed
  email?: string;          // Validated email
  phone?: string;          // Algerian format
  company?: string;
  jobTitle?: string;
  type: ContactType;       // LEAD | CUSTOMER | PARTNER | VENDOR
  status: ContactStatus;   // ACTIVE | INACTIVE | BLOCKED
  source?: LeadSource;     // WEBSITE | REFERRAL | etc.
  tags: string[];          // Custom tags
  leadScore: number;       // 0-100
  lifetimeValue: number;   // DZD
  totalDeals: number;
  totalRevenue: number;    // DZD
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  customFields?: JSON;     // Flexible additional data
  createdAt: Date;
  updatedAt: Date;
}
```

### Deal
```typescript
{
  id: string;
  contactId: string;
  title: string;
  description?: string;
  amount: number;          // DZD
  currency: string;        // Default: "DZD"
  probability: number;     // 0-100
  expectedRevenue: number; // amount × probability
  stage: DealStage;        // Pipeline stage
  priority: Priority;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  lostReason?: string;
  winReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Activity
```typescript
{
  id: string;
  contactId?: string;
  dealId?: string;
  type: ActivityType;      // CALL | EMAIL | MEETING | etc.
  subject: string;
  description?: string;
  status: ActivityStatus;  // PENDING | COMPLETED | CANCELLED
  priority: Priority;
  scheduledAt?: Date;
  completedAt?: Date;
  duration?: number;       // Minutes
  outcome?: string;
  createdAt: Date;
}
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm run test:watch

# Integration tests
npm run test:integration
```

### Test Coverage Goals
- Overall: 80%+
- Business Logic: 90%+
- Critical Paths: 95%+

### Example Test
```typescript
describe('ContactService', () => {
  it('should create a contact successfully', async () => {
    const data = {
      firstName: 'Ahmed',
      lastName: 'Benali',
      email: 'ahmed@example.dz'
    };

    const result = await contactService.create(data, context);

    expect(result.fullName).toBe('Ahmed Benali');
    expect(result.leadScore).toBe(0);
  });
});
```

## 🔒 Security

### Implemented Security Measures
- **Helmet.js**: Security headers (XSS, clickjacking protection)
- **CORS**: Configurable allowed origins
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection**: Protected by Prisma ORM
- **Soft Deletes**: Data retention for audit compliance
- **Multi-tenancy**: Data isolation by professionalId

### Algerian-Specific Validations
- **Phone Numbers**: Validates Algerian format (00213 or 0 + 5/6/7 + 8 digits)
- **Wilaya**: Validates against 48 Algerian wilayas
- **Currency**: Defaults to DZD (Algerian Dinar)

## 📈 Performance

### Optimization Strategies
- **Database Indexes**: On frequently queried fields
- **Pagination**: Prevents large result sets
- **Soft Deletes**: Filtered by `deletedAt IS NULL` in indexes
- **Computed Fields**: `fullName`, `expectedRevenue` pre-calculated
- **Selective Loading**: Only fetch needed fields

### Performance Targets
- API Response Time (P95): <300ms
- Database Query Time (P95): <50ms
- Concurrent Users: 1,000+

## 🐳 Deployment

### Docker
```bash
# Build image
docker build -t contacto-crm-service .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  contacto-crm-service
```

### Environment Variables
See `.env.example` for all configuration options.

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT validation (production)

Optional:
- `PORT`: Service port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging verbosity
- `ALLOWED_ORIGINS`: CORS origins

## 🔧 Development

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: For code quality
- **Prettier**: For code formatting
- **Naming**: camelCase for variables, PascalCase for types

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/add-email-campaigns

# Commit with conventional commits
git commit -m "feat(campaigns): add email campaign support"

# Run tests before pushing
npm test
npm run lint

# Push and create PR
git push origin feature/add-email-campaigns
```

### Database Migrations
```bash
# Create migration
npm run prisma:migrate dev --name add_custom_fields

# Apply migrations
npm run prisma:migrate deploy

# View database
npm run prisma:studio
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure tests pass and coverage is maintained
5. Submit a pull request

## 📄 License

Proprietary - Contacto Platform

## 👥 Support

For questions or issues:
- Technical: dev@contacto.dz
- Documentation: docs.contacto.dz/crm-service
- Slack: #crm-service

## 🎯 Roadmap

### Phase 2 Enhancements
- [ ] Email campaign management
- [ ] SMS integration
- [ ] Advanced lead scoring algorithms
- [ ] Sales forecasting
- [ ] Team collaboration features
- [ ] Custom dashboards
- [ ] Webhook support
- [ ] API rate limiting per user
- [ ] Real-time notifications
- [ ] Export to Excel/PDF

---

**Built with ❤️ for the Contacto Platform**
