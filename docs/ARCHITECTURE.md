# Project Architecture

This document provides a high-level overview of the technical architecture of the Contacto platform.

## Guiding Principles

-   **Microservices**: The backend is built as a collection of independent, loosely-coupled services. This allows for better scalability, maintainability, and fault tolerance.
-   **API-First**: All services communicate through well-defined APIs. This enables parallel development and allows for different clients (web, mobile) to consume the same services.
-   **Cloud-Native**: The platform is designed to be deployed and run in a cloud environment, taking advantage of services like containerization and managed databases.
-   **Security by Design**: Security is a primary consideration at every layer of the architecture.

## Backend Architecture

The backend is a set of Node.js microservices written in TypeScript. Each service is responsible for a specific business domain. Services communicate with each other asynchronously via an event bus (e.g., RabbitMQ) and expose their functionality through a secure API Gateway.

### API Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    API GATEWAY (Kong/AWS)                │
│  - Rate Limiting  - Authentication  - Load Balancing    │
│  - Caching  - Analytics  - Request/Response Transform   │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼─────────┐ ┌──────▼────────┐ ┌────────▼────────┐
│  Auth Service   │ │ Business Svc  │ │  Payment Hub    │
│  - OAuth 2.0    │ │  - CRUD       │ │  - Orchestration│
│  - JWT          │ │  - Analytics  │ │  - Routing      │
│  - API Keys     │ │  - Reports    │ │  - KYC/AML      │
└────────┬────────┘ └───────┬───────┘ └────────┬────────┘
         │                  │                  │
┌────────▼─────────────────▼────────┐ ┌────────▼────────┐
│    Shared Services & Data Layer   │ │ SATIM Integration │
│ - PostgreSQL, Redis, RabbitMQ...  │ │ (National Switch) │
└───────────────────────────────────┘ └───────────────────┘
```

## Frontend Architecture

The frontend is a modern web application built with Next.js and React. It leverages Server-Side Rendering (SSR) and Static Site Generation (SSG) for optimal performance and SEO. The UI is built as a hierarchy of reusable components, and global state is managed with Zustand and TanStack Query.

## Mobile Architecture

The mobile application is built with React Native and Expo, allowing for a single codebase to be deployed on both Android and iOS. It follows a standard mobile architecture with a clear separation of concerns between UI (screens and components), business logic (services), and state management (Redux Toolkit).

## DevOps and Infrastructure

The entire platform is containerized using Docker and is designed to be deployed to a cloud provider (e.g., AWS, a local Algerian provider). The infrastructure is managed as code (IaC) using tools like Terraform. A CI/CD pipeline, built with GitHub Actions, automates the process of testing, building, and deploying the application.
