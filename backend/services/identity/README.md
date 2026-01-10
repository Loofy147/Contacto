# Identity Service

## Purpose

This service is responsible for managing all aspects of user and business identity verification, including Know Your Customer (KYC), Know Your Business (KYB), and ongoing compliance checks. It acts as the central authority for determining the verification level and trust score of any entity on the Contacto platform.

It is a critical component for ensuring the security, integrity, and regulatory compliance of the entire ecosystem.

## Core Responsibilities

-   **Onboarding Verification**: Manages the multi-step process of verifying new users and businesses, from document upload to final approval.
-   **Risk Assessment**: Implements the risk-scoring engine to assign a risk level to each entity.
-   **Liveness & Biometrics**: Handles biometric verification, including liveness checks and face matching against identity documents.
-   **Compliance Screening**: Performs continuous screening against international and national sanctions lists, as well as Politically Exposed Persons (PEP) databases.
-   **Manual Review Interface**: Provides the necessary APIs to support the compliance team's manual review dashboard.
-   **Verification Status Management**: Maintains the current verification status (e.g., Level 0, 1, 2, 3) for all users and businesses.

## Tech Stack

-   **Runtime**: Node.js 20+
-   **Framework**: Express.js / Fastify
-   **Language**: TypeScript
-   **Database**: PostgreSQL (for storing verification data, audit logs)
-   **Integrations**:
    -   Connects to third-party services for OCR (Google Vision), Biometrics (Onfido/iProov), and Sanctions Screening (Refinitiv/Dow Jones).
    -   Communicates with the `users` and `merchants` services to update verification status.
    -   Uses Redis for caching and managing verification session state.

## Full Technical & Business Specification

For a complete and detailed breakdown of the entire identity verification architecture, verification levels, risk-scoring engine, and technology stack that this service will implement, please refer to the main specification document:

➡️ **[../../../docs/PHASE_3_KYC_AML_SYSTEM.md](../../../docs/PHASE_3_KYC_AML_SYSTEM.md)**
