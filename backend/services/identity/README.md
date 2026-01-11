# Identity Service

## Overview

This directory contains the source code for the **Identity Service**.

The primary responsibility of this service is to manage user authentication, authorization, and core user profiles.

For a complete overview of how this service fits into the larger system, please see the main **[Technical Architecture Document](../../../docs/architecture/technical_architecture.md)**.

## Core Responsibilities

-   User registration and onboarding.
-   Handling user login and issuing JSON Web Tokens (JWTs).
-   Password management (hashing, reset flows).
-   Managing user profile information (name, contact details).
-   Enforcing authentication policies.

## API Endpoints

*(A brief description of the main API endpoints (e.g., `/auth/register`, `/auth/login`) will be added here, along with a link to the full OpenAPI/Swagger documentation for this service.)*

## Data Model

*(A brief overview of the primary data entities (e.g., `User`, `Credential`) managed by this service will be added here.)*

## Events

*(A list of events that this service publishes (e.g., `user.registered`) and subscribes to on the event bus (Kafka) will be added here.)*
