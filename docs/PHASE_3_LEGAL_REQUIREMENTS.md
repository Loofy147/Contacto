# Phase 3: Detailed Legal & Regulatory Requirements

This document provides a comprehensive, in-depth analysis of the legal, regulatory, and compliance framework governing the implementation and operation of the Contacto financial services in Phase 3.

---

## **SECTION A: LICENSING & AUTHORIZATION**

### **1. Electronic Payment Institution License (EPE)**

-   **Regulator**: Bank of Algeria (Banque d'Algérie).
-   **Primary Legislation**:
    -   Regulation No. 18-02 (Nov 20, 2018) on payment systems.
    -   Instruction No. 05-2020 on Electronic Payment Institutions.
    -   Law No. 03-11 (Aug 26, 2003) on Money and Credit.

#### **Licensing Options & Strategy**

1.  **Full EPE License (Option A)**:
    -   **Scope**: Allows for issuing e-money, acquiring transactions, money transfers, and managing e-wallets.
    -   **Capital Requirement**: **100,000,000 DZD** (minimum), fully paid up in an escrow account.
    -   **Key Requirements**: Must be an SPA (joint-stock company), majority Algerian ownership, extensive technical and security infrastructure (local data center, PCI-DSS, ISO 27001), and a highly experienced management team.
    -   **Process**: A rigorous 12-18 month application process involving technical, financial, and legal audits by the Bank of Algeria.

2.  **Payment Agent (Option B)**:
    -   **Scope**: Act on behalf of a licensed EPE. Cannot hold funds independently.
    -   **Capital Requirement**: 10,000,000 DZD.
    -   **Constraint**: Heavily dependent on the licensed partner. Not suitable for an independent wallet.

3.  **Partnership with a Licensed Provider (Option C)**:
    -   **Mechanism**: Contacto acts as a technology provider, while a licensed partner (e.g., a major bank, Algérie Poste) handles the regulatory aspects.
    -   **Advantages**: Faster to market (3-6 months), significantly lower capital requirements, leverages partner's compliance expertise.
    -   **Disadvantages**: Lower profit margins (revenue sharing), less control over the product roadmap.

-   **Strategic Recommendation**:
    1.  **Phase 3**: Launch by partnering with a licensed entity **(Option C)** to accelerate market entry and build a user base.
    2.  **Phase 5-6**: Use the operational experience and financial data gathered to apply for a full EPE license **(Option A)** to achieve long-term independence and higher margins.

---

## **SECTION B: AML/CFT COMPLIANCE (IN-DEPTH)**

### **1. Legal Framework**

-   **Primary Law**: Law 05-01 (Feb 6, 2005) on the Prevention and Combating of Money Laundering and Terrorist Financing.
-   **Regulator**: CTRF (Cellule de Traitement du Renseignement Financier) - Algeria's Financial Intelligence Unit.
-   **International Standards**: The program must align with the 40 Recommendations of the Financial Action Task Force (FATF).

### **2. Core AML/CFT Program Components**

1.  **Governance**:
    -   **MLRO (Money Laundering Reporting Officer)**: A senior, independent, and certified (e.g., CAMS) employee must be appointed. The MLRO is responsible for the entire AML program and is the sole point of contact with the CTRF.
    -   **Board Oversight**: The Board of Directors must approve the AML policy annually and ensure the compliance function is adequately resourced.

2.  **Risk Assessment**:
    -   A comprehensive, enterprise-wide AML risk assessment must be conducted and updated annually.
    -   Each customer will be assigned a risk score (Low, Medium, High) based on factors like their industry, transaction patterns, and geographic location.

3.  **Customer Due Diligence (CDD)**:
    -   **Standard CDD**: For all customers, as detailed in the `PHASE_3_KYC_AML_SYSTEM.md` document.
    -   **Enhanced Due Diligence (EDD)**: Mandatory for high-risk customers, including:
        -   **Politically Exposed Persons (PEPs)**: Senior government officials, executives of state-owned enterprises, and their close family members.
        -   **High-Risk Industries**: Money exchange, real estate, precious metals dealers.
        -   **Procedure**: EDD requires verifying the customer's **Source of Wealth (SoW)** and the **Source of Funds (SoF)** for large transactions, and requires senior management approval to onboard.

4.  **Transaction Monitoring**:
    -   An automated system will monitor all transactions in real-time to detect suspicious activity.
    -   **Red Flags**:
        -   Structuring: Multiple small transactions just below reporting thresholds.
        -   Rapid Turnover: Funds deposited and withdrawn almost immediately.
        -   Transactions to/from high-risk jurisdictions.
        -   Activity inconsistent with the customer's profile.

5.  **Suspicious Activity Reporting (SAR)**:
    -   If an investigation concludes that a transaction is suspicious, the MLRO must file a SAR with the CTRF **within 48 hours**.
    -   **"Tipping Off" is a criminal offense**: The customer must **never** be informed that a SAR has been filed about them.

6.  **Sanctions Screening**:
    -   All customers must be screened against major international sanctions lists (UN, OFAC, EU) and any national lists, both at onboarding and on a continuous, daily basis.
    -   A "true positive" match requires an immediate account freeze and a report to the authorities.

7.  **Record Keeping**:
    -   All KYC documents, transaction records, and AML investigation files must be securely retained for a minimum of **10 years** after the business relationship ends.

8.  **Training & Audit**:
    -   All employees must undergo mandatory AML training upon hiring and annually thereafter.
    -   The entire AML program must be subjected to an independent audit on an annual basis.
