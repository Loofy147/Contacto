# Wallet Service

## Overview

This directory contains the source code for the **Wallet Service**.

The primary responsibility of this service is to manage the digital wallets for users and businesses, including storing funds, processing top-ups, and handling transfers.

For a complete overview of how this service fits into the larger system, please see the main **[Technical Architecture Document](../../../docs/architecture/technical_architecture.md)**.

## Core Responsibilities

-   Managing wallet balances for users and businesses.
-   Processing deposits (top-ups) from various payment methods.
-   Handling withdrawals to bank accounts.
-   Facilitating peer-to-peer (P2P) and peer-to-business (P2B) transfers.
-   Maintaining a ledger of all wallet transactions.

## API Endpoints

*(A brief description of the main API endpoints (e.g., `/wallet`, `/wallet/transfer`, `/wallet/topup`) will be added here, along with a link to the full OpenAPI/Swagger documentation for this service.)*

## Data Model

*(A brief overview of the primary data entities (e.g., `Wallet`, `WalletTransaction`) managed by this service will be added here.)*

## Events

*(A list of events that this service publishes (e.g., `wallet.credited`, `wallet.debited`) and subscribes to on the event bus (Kafka) will be added here.)*
