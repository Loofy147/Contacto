# Contacto Backend - Microservices Architecture

This directory contains the source code for the entire backend of the Contacto platform. The backend is designed as a distributed system of microservices, following an event-driven architecture pattern. This approach ensures high scalability, resilience, and maintainability.

For a complete and detailed explanation of the architecture, including the event bus (Kafka), data models, and security patterns, please refer to the main **[Technical Architecture Document](../../docs/architecture/technical_architecture.md)**.

## Directory Structure

The backend is organized into two primary components:

### 1. [`api-gateway/`](./api-gateway/)

The **API Gateway** is the single entry point for all incoming requests from client applications (web and mobile). Its primary responsibilities include:

- **Request Routing:** Directing incoming requests to the appropriate microservice.
- **Authentication & Authorization:** Verifying JWTs and ensuring clients have the necessary permissions.
- **Rate Limiting:** Protecting the system from abuse and ensuring fair usage.
- **Load Balancing:** Distributing traffic across instances of the microservices.

### 2. [`services/`](./services/)

This directory contains the individual **microservices**. Each service is an independent application with its own database and a well-defined set of responsibilities. This separation of concerns allows for independent development, deployment, and scaling.

Each subdirectory within `services/` represents a single microservice (e.g., `identity`, `payments`, `professionals`).

## Getting Started

*(Instructions for setting up the local development environment, running services, and testing will be added here.)*
