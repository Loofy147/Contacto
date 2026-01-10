# Payment Service

## Purpose

This service acts as the central Payment Hub for the Contacto platform. It is responsible for orchestrating and processing all payment transactions, integrating with external payment gateways, and providing a secure and reliable interface for all payment-related operations.

It is a high-security, PCI-DSS compliant service that handles the flow of money into, within, and out of the Contacto ecosystem.

## Core Responsibilities

-   **Payment Processing**: Manages the end-to-end lifecycle of a payment, from initiation to settlement and reconciliation.
-   **Gateway Integration**: Contains the integration logic for connecting to the national payment switch (SATIM) to process CIB and EDAHABIA card payments.
-   **Transaction Routing**: Routes payment requests to the appropriate gateway or internal service (e.g., the Wallet service).
-   **Fraud Detection**: Integrates with the fraud detection engine to score every transaction in real-time and take appropriate action (approve, challenge, block).
-   **Merchant Payouts**: Manages the settlement process, calculating merchant balances and initiating payouts to their bank accounts.
-   **Refunds & Chargebacks**: Provides the functionality to handle both merchant-initiated refunds and bank-initiated chargebacks.

## Tech Stack

-   **Runtime**: Node.js 20+
-   **Framework**: Express.js / Fastify
-   **Language**: TypeScript
-   **Database**: PostgreSQL (for transaction records, settlement batches)
-   **Integrations**:
    -   Connects directly to the SATIM payment gateway.
    -   Communicates with the `wallet` service for wallet-based payments.
    -   Communicates with the `identity` service to verify merchant status before enabling payouts.
    -   Uses Redis for rate limiting and managing the state of in-flight transactions.

## Full Technical & Business Specification

For a complete and detailed breakdown of the payment architecture, transaction lifecycle, fraud prevention systems, and supported payment methods that this service will implement, please refer to the main specification document:

➡️ **[../../../docs/PHASE_3_PAYMENT_SYSTEM.md](../../../docs/PHASE_3_PAYMENT_SYSTEM.md)**
