# Contacto: The All-in-One Digital Ecosystem for Algerian Businesses 🚀

**Contacto is a comprehensive platform designed to empower Algerian businesses and professionals with a suite of digital tools, including a professional directory, an API-first CRM/POS system, and a complete financial services layer.**

## 🎯 The Strategic Vision (7 Identities)

Contacto is built and optimized using the **7 Strategic Identities** framework, ensuring every line of code contributes to technical excellence and business value:

-   🔧 **Tuber (Data Layer):** Automated query monitoring and performance tuning.
-   ⚡ **Bolt (Performance):** Aggressive multi-layer caching and low-latency execution.
-   💰 **Midas (Business Value):** Feature gating and monetization-ready architecture.
-   🔮 **Oracle (Architecture):** Event-driven microservices with robust decoupling via Kafka.
-   🎨 **Pallette (UX/Response):** Standardized API patterns and inclusive frontend experiences.
-   🛡️ **Sentinel (Security):** Defense-in-depth, strict validation, and proactive monitoring.
-   🎯 **Sun Tzu (Strategy):** Alignment with the 36-month roadmap for market dominance.

## 🏗️ Architecture Overview

The platform uses a distributed system of microservices, orchestrated via an API Gateway and communicating through an event bus (Kafka).

- **High Scalability:** Independent scaling for each service.
- **Resilience:** Fault-tolerant, event-driven design.
- **Compliance:** Full compliance with Algerian Law 18-07 (Data Sovereignty) and PCI-DSS.

For details, see the [Technical Architecture Document](docs/architecture/technical_architecture.md).

## 📁 Repository Structure

- **`backend/`**: Back-end microservices and API Gateway.
  - `identity`: Auth & User management.
  - `professionals`: Professional profiles & search.
  - `crm`: Customer Relationship Management.
  - ... and more.
- **`frontend/`**: Next.js 15 web application.
- **`mobile/`**: React Native + Expo mobile application.
- **`docs/`**: Comprehensive project documentation.
  - `docs/identities/`: Strategic identity definitions and reports.
  - `docs/roadmap/`: 36-month growth plan.

## 🚀 Project Roadmap

1.  **Phase 1: Directory Platform (Months 1-6)** - Current Phase.
2.  **Phase 2: CRM & POS Infrastructure (Months 7-12)**
3.  **Phase 3: Financial Layer & Payments (Months 13-24)**
4.  **Phase 4: Government & Ecosystem Integration (Months 25-36)**

See the [Project Roadmap Document](docs/roadmap/roadmap.md) for details.

## 🛠️ Development Standards

All services must implement:
- Standardized `Prisma` client with slow-query logging.
- Standardized `sendSuccess`/`sendError` API utilities.
- Standardized `authenticate` and `authorize` (RBAC) middleware.
- Redis-based caching for high-traffic read operations.

---
*Contacto: Empowering Algeria's Digital Future.*
