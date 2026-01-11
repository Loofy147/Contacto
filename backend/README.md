# Contacto Backend

This directory contains all the backend services for the Contacto platform. It follows a microservices architecture, with each service being a separate, independently deployable application.

## Architecture

The backend is built on an event-driven microservices architecture. Services communicate with each other asynchronously via an event bus (Apache Kafka), and an API Gateway (Kong) provides a single entry point for all client requests.

For a detailed explanation of the architecture, please see the [Technical Architecture document](../../docs/architecture/technical_architecture.md).

## Services

The following microservices are planned for the Contacto platform:

*   **API Gateway:** The single entry point for all client applications.
*   **Users & Auth:** Manages user registration, authentication, and authorization.
*   **Business/Professionals:** Handles professional profiles, service listings, and business analytics.
*   **Payments Hub:** Orchestrates payments and manages transaction lifecycles.
*   **Inventory:** Manages product catalogs, stock tracking, and supplier information.
*   **Appointments:** Handles scheduling and management of appointments.
*   **Reviews:** Manages user reviews and ratings.
*   **Notifications:** Sends notifications to users via email, SMS, and push notifications.
*   **And many more...** A complete list of planned services can be found in the `services` directory.

## Getting Started

Currently, the backend is in a pre-implementation phase. The directory structure for each microservice has been scaffolded, but the code has not yet been written.

Once the services are implemented, each will contain its own `package.json` file with instructions on how to build, test, and run the service.

## Tech Stack

*   **Language:** TypeScript
*   **Framework:** Node.js with Express/Fastify
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Event Bus:** Apache Kafka
*   **API Gateway:** Kong
