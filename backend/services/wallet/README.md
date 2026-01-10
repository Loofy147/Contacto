# Wallet Service

## Purpose

This service is the core engine for the Contacto Digital Wallet. It is responsible for securely managing user and business balances, processing all wallet-related transactions, and maintaining an immutable ledger of all operations.

It is a high-security, high-availability service that forms the financial backbone of the Contacto ecosystem.

## Core Responsibilities

-   **Ledger & Balance Management**: Securely maintains the balance for every user and business wallet. It uses a double-entry accounting model to ensure data integrity.
-   **Transaction Processing**: Handles all wallet-to-wallet (P2P) transfers, wallet-to-merchant payments, and internal fund movements.
-   **Funding & Withdrawals**: Manages the lifecycle of adding funds to a wallet (top-ups) and withdrawing funds to a user's external bank account.
-   **Security**: Implements transaction-level security, including PIN/biometric verification, 2FA checks for large operations, and velocity checks.
-   **Reconciliation**: Performs daily reconciliation of wallet balances against segregated bank account statements to ensure funds are always correctly accounted for.
-   **API for Clients**: Provides secure APIs for the frontend, mobile apps, and third-party integrators to interact with wallet functionalities.

## Tech Stack

-   **Runtime**: Node.js 20+
-   **Framework**: Express.js / Fastify
-   **Language**: TypeScript
-   **Database**: PostgreSQL (for the immutable ledger, transaction records)
-   **Integrations**:
    -   Communicates with the `payment` service to process card-based top-ups.
    -   Communicates with the `identity` service to check KYC levels and enforce transaction limits.
    -   Uses Redis for caching balances (for quick display) and for queueing withdrawal requests.

## Full Technical & Business Specification

For a complete and detailed breakdown of the wallet's architecture, features (including account structure, funding/withdrawal methods, security, and APIs) that this service will implement, please refer to the main specification document:

➡️ **[../../../docs/PHASE_3_WALLET_SYSTEM.md](../../../docs/PHASE_3_WALLET_SYSTEM.md)**
