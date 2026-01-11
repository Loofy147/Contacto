# Notifications Service

## Overview

This directory contains the source code for the **Notifications Service**.

The primary responsibility of this service is to manage and send all user-facing notifications, such as email, SMS, and push notifications.

For a complete overview of how this service fits into the larger system, please see the main **[Technical Architecture Document](../../../docs/architecture/technical_architecture.md)**.

## Core Responsibilities

-   Providing a centralized service for sending communications.
-   Managing message templates for different notification types.
-   Handling user notification preferences (e.g., opt-in/opt-out).
-   Integrating with third-party providers for email (e.g., SendGrid) and SMS (e.g., Twilio).

## API Endpoints

*(This service is typically not exposed via the public API Gateway. It consumes events from the event bus.)*

## Data Model

*(A brief overview of the primary data entities (e.g., `NotificationLog`, `UserPreferences`) managed by this service will be added here.)*

## Events

*(A list of events that this service subscribes to (e.g., `user.registered`, `appointment.booked`, `payment.successful`) on the event bus (Kafka) will be added here.)*
