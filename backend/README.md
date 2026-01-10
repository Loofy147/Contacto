# Backend

This directory contains all the server-side code for the Contacto platform. It's built on a microservices architecture using Node.js, Express.js, and TypeScript.

## Key Principles

- **API-First Design**: All services expose a well-defined REST or GraphQL API.
- **Security by Design**: Security is a primary consideration at all levels of the backend.
- **Data Sovereignty**: All data is stored and processed within Algeria.
- **Event-Driven**: Asynchronous communication between services is handled through an event bus.

## Directory Structure

- `config/`: Configuration files for different environments (development, staging, production).
- `database/`: Database schema, migrations, and seed scripts.
- `docs/`: API documentation (Swagger/OpenAPI).
- `middleware/`: Custom Express.js middleware for authentication, logging, etc.
- `services/`: Individual microservices, each with its own controllers, models, and routes.
- `utils/`: Shared utility functions and helper modules.
