# API Gateway

This directory contains the source code for the Contacto API Gateway.

## Overview

The API Gateway is the single entry point for all client requests to the Contacto platform. It acts as a reverse proxy, routing incoming requests from the web and mobile applications to the appropriate backend microservice. This pattern simplifies the client-side implementation and provides a centralized point for handling cross-cutting concerns.

For a complete overview of how the API Gateway fits into the larger system, please see the main **[Technical Architecture Document](../../docs/architecture/technical_architecture.md)**.

## Key Responsibilities

1.  **Request Routing**:
    Maps public HTTP endpoints to the internal services. For example, a request to `/api/v1/users` might be routed to the `identity-service`.

2.  **Authentication & Authorization**:
    - Verifies the authenticity of incoming requests, typically by validating a JSON Web Token (JWT).
    - Rejects any unauthenticated requests before they reach the internal services.
    - Can enrich requests with user context (e.g., user ID, roles) before forwarding them.

3.  **Rate Limiting & Throttling**:
    - Implements rules to limit the number of requests a client can make in a given time period.
    - Protects the backend services from being overwhelmed by traffic spikes or malicious attacks.

4.  **Load Balancing**:
    - For services that are scaled horizontally (i.e., have multiple running instances), the gateway distributes the load across them.

5.  **SSL Termination**:
    - Handles incoming HTTPS connections, decrypts the requests, and forwards them to the internal services over a secure private network.

6.  **CORS**:
    - Manages Cross-Origin Resource Sharing (CORS) policies in a central location.

## Technology Stack

*(The technology stack for the API Gateway (e.g., Kong, Express.js with custom middleware, etc.) will be detailed here.)*

## API Documentation

*(A link to the OpenAPI/Swagger documentation will be provided here.)*
