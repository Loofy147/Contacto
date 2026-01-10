# Phase 3: Contacto Digital Wallet System Specification

This document provides a complete and detailed breakdown of the architecture, features, and capabilities of the Contacto Digital Wallet system.

---

## **1. System Architecture**

The wallet's architecture is built around a central core that manages the ledger, transactions, and compliance, ensuring a secure and scalable system.

```
Contacto Wallet System Architecture:

┌────────────────────────────────────────────────────────────┐
│                    CONTACTO WALLET CORE                     │
│            (Central wallet management system)                │
└────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  Balance Mgmt  │  │  Transaction    │  │   Settlement    │
│  & Ledger      │  │  Processing     │  │   & Clearing    │
└────────────────┘  └─────────────────┘  └─────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Compliance &     │
                    │   Fraud Detection  │
                    └────────────────────┘
```

---

## **2. Wallet Features & Capabilities**

### **2.1 Account Structure**
-   **Wallet Types**:
    -   **Personal Wallet**: For individual users (KYC Level 1 minimum), with limits based on verification level.
    -   **Business Wallet**: For merchants (KYC Level 2 required), featuring higher limits, multi-user team access, and fund segregation (operating, reserve, pending balances).
-   **Multi-Currency Support**:
    -   **Primary**: Algerian Dinar (DZD).
    -   **Future (Phase 4)**: EUR, USD for international transactions, subject to forex regulations.
-   **Hierarchy**: Wallets can have optional sub-wallets (e.g., "Sales," "Taxes") for better financial organization.

### **2.2 Funding Methods (Top-Up)**
-   **Bank Transfer**: Users can add funds via bank transfer. The system uses unique reference codes for automatic reconciliation. (Processing: 2-48 hours).
-   **Card Payment**: Instant top-up using local CIB and EDAHABIA cards via the SATIM network. (Fee: ~2%).
-   **Mobile Payment**: Instant top-up via deep links to local mobile wallets like BaridiMob. (Fee: ~1.5%).
-   **Future Methods**: Cash deposits via an agent network (Phase 4) and voucher redemptions.

### **2.3 Spending & Withdrawals**
-   **Merchant Payments**:
    -   **Online**: "Pay with Contacto Wallet" option at checkout.
    -   **In-Store**: Scan merchant-presented QR codes for instant, contactless payments.
    -   **Fees**: Free for customers; 1-1.5% for merchants.
-   **Peer-to-Peer (P2P) Transfers**:
    -   Instantly send money to other Contacto users via phone number, email, or username.
    -   **Fees**: First 5 transfers/month are free, then a small flat fee.
-   **Withdrawal to Bank Account**:
    -   Users can withdraw their balance to a verified Algerian bank account (RIB).
    -   **Processing**: Standard (1-3 business days, free) or Express (same day, fee-based).

### **2.4 Transaction Management**
-   **Full History**: A detailed, searchable, and filterable transaction history is available to all users.
-   **Receipts**: Automatic generation of digital PDF receipts for every transaction.
-   **Dispute Resolution**: An integrated system for users to request refunds and escalate disputes to Contacto support if a merchant is unresponsive.
-   **Future Features**: Recurring and scheduled payments.

### **2.5 Security Features**
-   **Account Protection**:
    -   Enforces strong passwords.
    -   Mandatory Two-Factor Authentication (2FA) for sensitive actions (withdrawals, new device login) via SMS or authenticator apps.
    -   Support for Biometric Login (Fingerprint/Face ID).
-   **Transaction Security**:
    -   Real-time fraud detection engine that scores every transaction.
    -   User-configurable transaction limits.
    -   Multi-step confirmations for large or unusual payments.
-   **Alerts**: Real-time push, SMS, and email notifications for all account activity.
-   **Account Recovery**: Secure, multi-step processes for recovering access in case of a lost password or 2FA device.

### **2.6 Wallet Integration & APIs**
-   **Merchant APIs**: Simple JavaScript SDK for a "Pay with Contacto" button and a hosted checkout flow.
-   **Third-Party Apps**: OAuth 2.0 support will allow users to grant permission to trusted third-party apps (e.g., budgeting tools) to access their wallet information securely.
-   **Developer Portal**: A sandbox environment and detailed documentation will be available for developers.

### **2.7 User Experience**
-   **Dashboard**: A clean, responsive web dashboard and mobile app interface designed for clarity and ease of use.
-   **Key Actions**: "Send," "Request," "Add Funds," and "Withdraw" are always prominently accessible.
-   **Offline Mode**: The mobile app will have a cached mode to view balance and transaction history without an internet connection.
-   **Accessibility**: The interface will support screen readers, high-contrast modes, and multiple languages (Arabic, French, English).

### **2.8 Compliance & Regulatory**
-   **KYC Integration**: Wallet limits and capabilities are directly tied to the user's KYC verification level.
-   **AML Monitoring**: All wallet transactions are subject to the same rigorous AML monitoring and reporting rules as card payments.
-   **Fund Segregation**: All customer funds are held in a segregated account at a licensed bank, entirely separate from Contacto's operational funds, ensuring they are protected.
-   **Audit Trail**: An immutable ledger logs every balance change, ensuring a complete and verifiable audit trail for regulatory inspection.

---

## **3. Advanced Technical Implementation**

### **3.1 Ledger System (Double-Entry Bookkeeping)**
The core of the wallet is a custom-built, immutable ledger based on the principles of double-entry bookkeeping, ensuring financial integrity and auditability.
-   **System Accounts**: In addition to user wallets, the system maintains internal accounts (e.g., Omnibus for customer funds, Fee Revenue, Settlement, Suspense for reconciliation).
-   **Atomic Transactions**: Every financial event creates at least two ledger entries (a debit and a credit). These are wrapped in a database transaction to ensure atomicity (ACID compliance); all entries succeed, or all fail, preventing partial updates and ensuring the books are always balanced.
-   **Balance Locking**: The system will use optimistic locking (via a version number on each wallet) to prevent race conditions during concurrent transactions, which offers better performance than pessimistic locking.
-   **Reconciliation**: Automated hourly and daily reconciliation jobs will run to verify that the sum of all user wallet balances matches the balance of the Omnibus account and the statements from our partner bank. Any discrepancy will trigger an immediate alert for manual investigation.

### **3.2 Database Schema (PostgreSQL)**
```sql
-- Wallets table: Stores the current state of each wallet.
CREATE TABLE wallets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_type VARCHAR(20) NOT NULL, -- 'personal', 'business'
    currency VARCHAR(3) NOT NULL DEFAULT 'DZD',
    available_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    pending_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_balance DECIMAL(15,2) GENERATED ALWAYS AS
        (available_balance + pending_balance) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'frozen', 'closed'
    version INTEGER NOT NULL DEFAULT 1, -- For optimistic locking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT positive_balance CHECK (available_balance >= 0)
);

-- Ledger entries: The immutable, double-entry log of all financial events.
CREATE TABLE ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    transaction_id UUID NOT NULL,
    debit_amount DECIMAL(15,2),
    credit_amount DECIMAL(15,2),
    balance_after DECIMAL(15,2) NOT NULL,
    description TEXT,
    entry_type VARCHAR(50) NOT NULL,

    CONSTRAINT debit_xor_credit CHECK (
        (debit_amount IS NOT NULL AND credit_amount IS NULL) OR
        (debit_amount IS NULL AND credit_amount IS NOT NULL)
    )
);

-- Wallet transactions: A logical grouping of ledger entries for a specific operation.
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL, -- 'p2p', 'deposit', 'withdrawal', 'payment'
    from_wallet_id UUID REFERENCES wallets(id),
    to_wallet_id UUID REFERENCES wallets(id),
    amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    description TEXT,
    metadata JSONB,
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Beneficiaries: Saved recipient wallets or bank accounts for easy access.
CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY,
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    beneficiary_type VARCHAR(20) NOT NULL, -- 'wallet', 'bank_account'
    beneficiary_wallet_id UUID REFERENCES wallets(id),
    account_holder_name VARCHAR(200),
    bank_name VARCHAR(100),
    account_number VARCHAR(20), -- RIB
    nickname VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE
);
```

### **3.3 Real-time Balance Updates & Notifications**
-   **Event-Driven Architecture**: The wallet service will use a message queue (like RabbitMQ or Kafka) to publish events for every transaction. Other services can subscribe to these events for asynchronous processing (e.g., a notification service).
-   **WebSockets**: The frontend and mobile apps will maintain a WebSocket connection to receive real-time updates on wallet balances and transaction statuses, providing a dynamic user experience without the need for constant polling.

### **3.4 Performance & Scalability**
-   **Database Optimization**: The `ledger_entries` table will be partitioned by date (e.g., monthly) to keep queries fast, even as it grows to billions of rows. Read replicas will be used for analytical and reporting queries to avoid impacting the primary database.
-   **Caching**: Redis will be used extensively to cache "hot" data like current user balances and recent transaction lists, reducing database load and speeding up response times.
-   **Asynchronous Processing**: Non-critical operations like bank statement reconciliation, sending email notifications, and generating monthly statements will be handled by background workers, keeping the main API fast and responsive.
