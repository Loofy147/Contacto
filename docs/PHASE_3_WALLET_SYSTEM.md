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
