# 📘 CRM Service API Documentation

Complete API reference with examples and use cases for the Contacto CRM Service.

## 🔗 Base URL

```
http://localhost:3001/api/v1/crm
```

## 🔐 Authentication

All API requests require authentication headers:

```http
X-Professional-Id: prof-abc123
X-User-Id: user-xyz789
```

*Note: In production, these are extracted from JWT tokens automatically.*

---

## 📋 Contacts API

### Use Case: Sales Representative Managing Leads

#### Scenario 1: Add New Lead from Website Inquiry

**Request:**
```http
POST /contacts
Content-Type: application/json

{
  "firstName": "Karim",
  "lastName": "Boumediene",
  "email": "karim.boumediene@gmail.com",
  "phone": "0555234567",
  "company": "Boumediene Plumbing Services",
  "type": "LEAD",
  "source": "WEBSITE",
  "wilaya": "Algiers",
  "notes": "Interested in commercial plumbing for new office building",
  "tags": ["commercial", "high-value"]
}
```

**Response: 201 Created**
```json
{
  "id": "contact-abc123",
  "fullName": "Karim Boumediene",
  "email": "karim.boumediene@gmail.com",
  "phone": "0555234567",
  "company": "Boumediene Plumbing Services",
  "type": "LEAD",
  "status": "ACTIVE",
  "source": "WEBSITE",
  "tags": ["commercial", "high-value"],
  "leadScore": 0,
  "lifetimeValue": 0,
  "totalDeals": 0,
  "totalRevenue": 0,
  "createdAt": "2026-01-11T10:30:00Z",
  "updatedAt": "2026-01-11T10:30:00Z"
}
```

#### Scenario 2: Search for High-Value Leads

**Request:**
```http
GET /contacts?type=LEAD&minLeadScore=70&tags=high-value&sortBy=leadScore&sortOrder=desc
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "contact-abc123",
      "fullName": "Karim Boumediene",
      "leadScore": 85,
      "company": "Boumediene Plumbing Services",
      "tags": ["commercial", "high-value"],
      ...
    },
    {
      "id": "contact-def456",
      "fullName": "Fatima Zerrouki",
      "leadScore": 78,
      "company": "Zerrouki Construction",
      "tags": ["high-value", "repeat-customer"],
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

#### Scenario 3: Update Lead Score After Engagement

**Request:**
```http
PUT /contacts/contact-abc123
Content-Type: application/json

{
  "leadScore": 85,
  "nextFollowUpDate": "2026-01-15",
  "notes": "Had great phone call. Very interested. Follow up next week."
}
```

**Response: 200 OK**
```json
{
  "id": "contact-abc123",
  "fullName": "Karim Boumediene",
  "leadScore": 85,
  "nextFollowUpDate": "2026-01-15T00:00:00Z",
  ...
}
```

#### Scenario 4: Get Contacts Needing Follow-Up

**Request:**
```http
GET /contacts/follow-up
```

**Response: 200 OK**
```json
[
  {
    "id": "contact-abc123",
    "fullName": "Karim Boumediene",
    "nextFollowUpDate": "2026-01-10T00:00:00Z",
    "phone": "0555234567",
    "company": "Boumediene Plumbing Services",
    ...
  }
]
```

---

## 💰 Deals API

### Use Case: Managing Sales Pipeline

#### Scenario 1: Create Deal from Qualified Lead

**Request:**
```http
POST /deals
Content-Type: application/json

{
  "contactId": "contact-abc123",
  "title": "Office Building Plumbing Installation",
  "description": "Complete plumbing system for 5-story office building",
  "amount": 850000,
  "probability": 60,
  "stage": "PROPOSAL",
  "priority": "HIGH",
  "expectedCloseDate": "2026-02-28"
}
```

**Response: 201 Created**
```json
{
  "id": "deal-xyz789",
  "contactId": "contact-abc123",
  "title": "Office Building Plumbing Installation",
  "amount": 850000,
  "currency": "DZD",
  "probability": 60,
  "expectedRevenue": 510000,
  "stage": "PROPOSAL",
  "priority": "HIGH",
  "expectedCloseDate": "2026-02-28T00:00:00Z",
  "createdAt": "2026-01-11T10:45:00Z",
  "updatedAt": "2026-01-11T10:45:00Z"
}
```

#### Scenario 2: View Pipeline by Stage

**Request:**
```http
GET /deals?stage=PROPOSAL&sortBy=amount&sortOrder=desc
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "deal-xyz789",
      "title": "Office Building Plumbing Installation",
      "amount": 850000,
      "probability": 60,
      "stage": "PROPOSAL",
      ...
    },
    {
      "id": "deal-abc456",
      "title": "Hotel Renovation Project",
      "amount": 620000,
      "probability": 45,
      "stage": "PROPOSAL",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

#### Scenario 3: Advance Deal Through Pipeline

**Request:**
```http
POST /deals/deal-xyz789/advance
```

**Response: 200 OK**
```json
{
  "id": "deal-xyz789",
  "stage": "NEGOTIATION",
  ...
}
```

#### Scenario 4: Close Deal as Won

**Request:**
```http
PUT /deals/deal-xyz789
Content-Type: application/json

{
  "stage": "CLOSED_WON",
  "winReason": "Client impressed with proposal and pricing. Signed contract.",
  "actualCloseDate": "2026-01-20"
}
```

**Response: 200 OK**
```json
{
  "id": "deal-xyz789",
  "stage": "CLOSED_WON",
  "actualCloseDate": "2026-01-20T00:00:00Z",
  ...
}
```

*Note: This automatically updates the contact's metrics:*
- `totalDeals` increments
- `totalRevenue` increases by deal amount
- `lifetimeValue` updates

#### Scenario 5: Get Pipeline Analytics

**Request:**
```http
GET /deals/pipeline/metrics
```

**Response: 200 OK**
```json
{
  "totalDeals": 45,
  "totalValue": 12500000,
  "averageDealSize": 277777.78,
  "winRate": 42.5,
  "averageSalesCycle": 38,
  "byStage": [
    {
      "stage": "PROSPECTING",
      "count": 12,
      "value": 3200000
    },
    {
      "stage": "QUALIFICATION",
      "count": 8,
      "value": 2100000
    },
    {
      "stage": "PROPOSAL",
      "count": 10,
      "value": 3500000
    },
    {
      "stage": "NEGOTIATION",
      "count": 5,
      "value": 1800000
    },
    {
      "stage": "CLOSED_WON",
      "count": 7,
      "value": 1500000
    },
    {
      "stage": "CLOSED_LOST",
      "count": 3,
      "value": 400000
    }
  ]
}
```

---

## 📅 Activities API

### Use Case: Tracking Customer Interactions

#### Scenario 1: Schedule Follow-Up Call

**Request:**
```http
POST /activities
Content-Type: application/json

{
  "contactId": "contact-abc123",
  "dealId": "deal-xyz789",
  "type": "CALL",
  "subject": "Follow-up on proposal questions",
  "description": "Client wants to discuss timeline and payment terms",
  "priority": "HIGH",
  "scheduledAt": "2026-01-15T14:00:00Z",
  "duration": 30
}
```

**Response: 201 Created**
```json
{
  "id": "activity-123",
  "contactId": "contact-abc123",
  "dealId": "deal-xyz789",
  "type": "CALL",
  "subject": "Follow-up on proposal questions",
  "status": "PENDING",
  "priority": "HIGH",
  "scheduledAt": "2026-01-15T14:00:00Z",
  "duration": 30,
  "createdAt": "2026-01-11T11:00:00Z"
}
```

#### Scenario 2: Complete Activity with Outcome

**Request:**
```http
PUT /activities/activity-123
Content-Type: application/json

{
  "status": "COMPLETED",
  "completedAt": "2026-01-15T14:35:00Z",
  "outcome": "Client satisfied with answers. Requested minor revisions to proposal. Will send updated version by EOD."
}
```

**Response: 200 OK**
```json
{
  "id": "activity-123",
  "status": "COMPLETED",
  "completedAt": "2026-01-15T14:35:00Z",
  "outcome": "Client satisfied with answers. Requested minor revisions to proposal...",
  ...
}
```

#### Scenario 3: View This Week's Schedule

**Request:**
```http
GET /activities/upcoming
```

**Response: 200 OK**
```json
[
  {
    "id": "activity-124",
    "type": "MEETING",
    "subject": "Site visit with client",
    "scheduledAt": "2026-01-12T10:00:00Z",
    "priority": "HIGH",
    ...
  },
  {
    "id": "activity-125",
    "type": "CALL",
    "subject": "Check-in call",
    "scheduledAt": "2026-01-13T15:30:00Z",
    "priority": "MEDIUM",
    ...
  }
]
```

#### Scenario 4: Log Completed Email

**Request:**
```http
POST /activities
Content-Type: application/json

{
  "contactId": "contact-abc123",
  "type": "EMAIL",
  "subject": "Sent updated proposal",
  "description": "Emailed revised proposal with updated timeline and payment terms",
  "status": "COMPLETED",
  "completedAt": "2026-01-15T18:30:00Z"
}
```

---

## ✅ Tasks API

### Use Case: Managing To-Do Items

#### Scenario 1: Create Task

**Request:**
```http
POST /tasks
Content-Type: application/json

{
  "contactId": "contact-abc123",
  "title": "Prepare site inspection report",
  "description": "Document all measurements and requirements from yesterday's visit",
  "priority": "HIGH",
  "dueDate": "2026-01-13"
}
```

**Response: 201 Created**
```json
{
  "id": "task-456",
  "contactId": "contact-abc123",
  "title": "Prepare site inspection report",
  "status": "PENDING",
  "priority": "HIGH",
  "dueDate": "2026-01-13T00:00:00Z",
  "createdAt": "2026-01-11T11:30:00Z"
}
```

#### Scenario 2: Get Overdue Tasks

**Request:**
```http
GET /tasks/overdue
```

**Response: 200 OK**
```json
[
  {
    "id": "task-789",
    "title": "Send contract to legal review",
    "dueDate": "2026-01-08T00:00:00Z",
    "priority": "URGENT",
    "status": "PENDING",
    ...
  }
]
```

#### Scenario 3: Complete Task

**Request:**
```http
PUT /tasks/task-456
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

**Response: 200 OK**
```json
{
  "id": "task-456",
  "status": "COMPLETED",
  "completedAt": "2026-01-12T16:45:00Z",
  ...
}
```

---

## 📊 Common Queries

### 1. Dashboard: Today's Overview

```bash
# Get today's activities
GET /activities?scheduledAt=2026-01-11

# Get overdue tasks
GET /tasks/overdue

# Get contacts needing follow-up
GET /contacts/follow-up

# Get deals close to expected close date
GET /deals?expectedCloseDate=2026-01-11
```

### 2. Weekly Sales Report

```bash
# Get pipeline metrics
GET /deals/pipeline/metrics

# Get completed activities this week
GET /activities?status=COMPLETED&fromDate=2026-01-06&toDate=2026-01-12

# Get won deals this week
GET /deals?stage=CLOSED_WON&actualCloseDate>=2026-01-06
```

### 3. Lead Management

```bash
# Get new leads from this month
GET /contacts?type=LEAD&createdAt>=2026-01-01

# Get high-score leads
GET /contacts?type=LEAD&minLeadScore=80&sortBy=leadScore&sortOrder=desc

# Get contact metrics
GET /contacts/metrics
```

---

## ⚠️ Error Responses

### Validation Error (400)
```json
{
  "error": "ValidationError",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "phone",
      "message": "Invalid Algerian phone number"
    }
  ]
}
```

### Not Found (404)
```json
{
  "error": "NOT_FOUND",
  "message": "Contact with id abc-123 not found"
}
```

### Duplicate (409)
```json
{
  "error": "DUPLICATE",
  "message": "Contact with this email already exists"
}
```

### Internal Server Error (500)
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred"
}
```

---

## 🔄 Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc` (default: `desc`)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 🎯 Best Practices

### 1. Always Set Lead Scores
Update lead scores based on engagement:
- Website visit: +10
- Email opened: +15
- Phone call: +25
- Meeting: +40

### 2. Use Tags for Organization
Common tags:
- `high-value`, `enterprise`, `small-business`
- `hot-lead`, `warm-lead`, `cold-lead`
- `needs-follow-up`, `negotiating`, `decision-maker`

### 3. Track Activities Consistently
Log every interaction:
- Calls
- Emails
- Meetings
- SMS

### 4. Review Pipeline Regularly
Weekly: Check pipeline metrics
Monthly: Review win/loss reasons
Quarterly: Analyze conversion rates

### 5. Set Follow-Up Dates
Always set `nextFollowUpDate` to:
- Keep leads warm
- Never miss opportunities
- Maintain professional relationships

---

## 📱 Integration Examples

### JavaScript/TypeScript
```typescript
const API_BASE = 'http://localhost:3001/api/v1/crm';

async function createContact(data) {
  const response = await fetch(`${API_BASE}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Professional-Id': 'prof-123',
      'X-User-Id': 'user-123'
    },
    body: JSON.stringify(data)
  });

  return response.json();
}
```

### cURL
```bash
curl -X POST http://localhost:3001/api/v1/crm/contacts \
  -H "Content-Type: application/json" \
  -H "X-Professional-Id: prof-123" \
  -H "X-User-Id: user-123" \
  -d '{
    "firstName": "Ahmed",
    "lastName": "Benali",
    "email": "ahmed@example.dz"
  }'
```

### Python
```python
import requests

API_BASE = 'http://localhost:3001/api/v1/crm'
HEADERS = {
    'X-Professional-Id': 'prof-123',
    'X-User-Id': 'user-123'
}

def create_contact(data):
    response = requests.post(
        f'{API_BASE}/contacts',
        json=data,
        headers=HEADERS
    )
    return response.json()
```

---

**For more information, see the [README.md](README.md)**
