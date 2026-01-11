# Users Service

## Overview

This directory contains the source code for the **Users Service**.

The primary responsibility of this service is to manage the data for the end-users (clients) of the platform, distinct from their authentication information.

For a complete overview of how this service fits into the larger system, please see the main **[Technical Architecture Document](../../../docs/architecture/technical_architecture.md)**.

## Core Responsibilities

-   Managing client profiles and preferences.
-   Storing a user's history of appointments and transactions.
-   Managing lists of saved or favorite professionals.
-   Handling data related to the client-side experience.

## API Endpoints

*(A brief description of the main API endpoints (e.g., `/users/me`, `/users/me/appointments`) will be added here, along with a link to the full OpenAPI/Swagger documentation for this service.)*

## Data Model

*(A brief overview of the primary data entities (e.g., `User`, `UserActivity`) managed by this service will be added here.)*

## Events

*(This service subscribes to events like `user.registered` from the Identity service to create its own user record.)*
