# Phase 3: Comprehensive KYC/AML System Specification

This document provides a complete and detailed breakdown of the Know Your Customer (KYC), Know Your Business (KYB), and Anti-Money Laundering (AML) system for the Contacto platform.

---

## **1. System Architecture & Workflow**

The system is designed around a central orchestrator that manages a multi-layered verification process, combining automated checks with manual oversight for high-risk cases.

```
KYC/AML System Architecture:

┌────────────────────────────────────────────────────────────┐
│              KYC VERIFICATION ORCHESTRATOR                  │
│  (Manages multi-level verification workflows)               │
└────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│   Document     │  │    Biometric    │  │    Database     │
│  Verification  │  │   Verification  │  │    Checks       │
└────────────────┘  └─────────────────┘  └─────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Risk Assessment   │
                    │  & Scoring Engine  │
                    └────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │ Compliance Officer │
                    │  Review (Manual)   │
                    └────────────────────┘
```

---

## **2. KYC/KYB Verification Levels**

The platform will implement a tiered verification system, allowing users greater access and higher transaction limits as they provide more comprehensive identity information.

### **Level 0: Anonymous (Unverified)**
-   **Allowed Actions**:
    -   Browse platform
    -   View products/services
    -   Search professionals
-   **Restrictions**:
    -   ✗ No transactions
    -   ✗ No wallet
    -   ✗ No saved data
-   **Use Case**: Initial browsing and discovery only.

### **Level 1: Basic Verification (Individual Users)**
-   **Required Information**:
    -   **Personal Details**: Full name, DOB, gender, nationality, verified phone number (OTP).
    -   **Email**: Verified via confirmation link.
    -   **Address**: Full address details.
    -   **Identity Document**: High-resolution photos of National ID Card, Passport, or Driver's License.
-   **Verification Process**:
    1.  **Document Upload**: User uploads images with automated quality checks.
    2.  **OCR Extraction**: Data is automatically extracted from the ID using services like Google Cloud Vision.
    3.  **Document Authentication**: AI-based checks for tampering, holograms, and watermarks.
    4.  **Liveness Check (Selfie Verification)**: A short video with random challenges (e.g., "smile," "turn head") to prevent spoofing. The user's face is matched against the ID photo with a >85% similarity threshold.
    5.  **Data Cross-Verification**: OTP for phone, link for email, and screening against sanctions lists.
    6.  **Manual Review**: Triggered for low-confidence scores (<80%), high-risk indicators, or random sampling (5%).
-   **Transaction Limits**:
    -   Daily: 50,000 DZD
    -   Monthly: 300,000 DZD
-   **Allowed Features**:
    -   ✓ Make purchases
    -   ✓ Basic wallet with a limited balance
    -   ✓ Limited peer-to-peer money sending
-   **Validity**: Re-verification is required every 2 years or upon ID expiration.

### **Level 2: Enhanced Verification (Merchants/High-Value Users)**
-   **Required (in addition to Level 1)**:
    -   **Business Registration**: Registre de Commerce (RC), NIF, and professional licenses.
    -   **Bank Certificate**: A recent RIB confirming the business bank account.
    -   **Beneficial Ownership**: Details of all owners with >25% stake (each must pass Level 1).
    -   **Source of Funds Declaration**: Supported by financial statements and bank statements.
-   **Enhanced Due Diligence (EDD) Checks**:
    -   **PEP Screening**: Checking against databases of Politically Exposed Persons.
    -   **Adverse Media Screening**: Searching for negative news related to financial crimes.
    -   **Sanctions & Watchlist Screening**: Real-time checks against UN, OFAC, EU, and national sanctions lists.
    -   **Company Verification**: Cross-referencing with the CNRC database and potential physical verification for high-risk businesses.
    -   **Industry Risk Assessment**: Applying extra scrutiny to high-risk industries like real estate or import/export.
-   **Ongoing Monitoring**:
    -   Automated transaction monitoring for unusual patterns.
    -   Periodic re-verification (every 12 months).
-   **Transaction Limits**:
    -   Daily: 500,000 DZD
    -   Monthly: 10,000,000 DZD
-   **Allowed Features**:
    -   ✓ Merchant account to accept payments
    -   ✓ API access
    -   ✓ Business dashboard and team management
-   **Approval Time**: 3-5 business days.

### **Level 3: Institutional (Large Enterprises/Corporations)**
-   **Required (in addition to Level 2)**:
    -   **Corporate Documents**: Articles of Association, shareholder register, board resolutions.
    -   **Compliance Documentation**: Internal AML/CFT policies.
    -   **Director Verification**: All directors and C-level executives must pass Level 1 verification and PEP screening.
-   **Enhanced Vetting**:
    -   In-person meetings and site visits.
    -   Bank and trade reference checks.
    -   In-depth financial analysis and credit checks.
-   **Transaction Limits**: Negotiated on a case-by-case basis, often with no fixed limit.
-   **Allowed Features**:
    -   ✓ Dedicated account manager
    -   ✓ Custom integrations
    -   ✓ Advanced reporting and bulk operations
-   **Approval Time**: 2-4 weeks due to intensive due diligence.

---

## **3. Risk-Based Approach**

A dynamic risk score is calculated for each customer based on their profile, industry, and transaction behavior.

-   **Customer Risk Rating (Low, Medium, High)**: Determined by factors like business age, industry, transaction volume, and PEP status.
-   **Verification Depth**: Low-risk customers are processed with high automation, while high-risk customers undergo mandatory enhanced due diligence.
-   **Monitoring Frequency**: High-risk customers are reviewed quarterly, medium-risk semi-annually, and low-risk annually.

---

## **4. Automated KYC Technology Stack**

The implementation will leverage a combination of third-party services and in-house tools.

### **1. Document Capture & OCR**
-   **SDKs**: React Native Camera for mobile, webcam capture for web.
-   **OCR Providers**: A hybrid approach using Google Cloud Vision for primary extraction and a self-hosted Tesseract model as a backup.
-   **Process**: The pipeline will detect document type, locate fields, extract text, validate formats, and assign a confidence score to each piece of data.

### **2. Liveness Detection & Face Matching**
-   **Liveness Solutions**: Integrate a proven third-party service like iProov or Onfido to ensure high security against spoofing.
-   **Face Matching**: Use a service like AWS Rekognition or Azure Face API to generate facial embeddings and calculate a similarity score between the ID photo and the liveness video.

### **3. Database & Sanctions Screening**
-   **Providers**: Integrate with a leading data provider like Refinitiv World-Check or Dow Jones Risk & Compliance for real-time PEP and sanctions screening.
-   **Matching**: Employ fuzzy matching algorithms to account for name variations and transliteration issues.
-   **Internal Lists**: Maintain an internal blocklist for known fraudsters and a duplicate detection system.

### **4. Risk Scoring Engine**
-   **Model**: A hybrid model combining a machine learning (e.g., XGBoost) engine with a set of hard-coded rules.
-   **Features**: The model will use dozens of inputs, including verification results, country/industry risk, device fingerprint, and transaction patterns.
-   **Logic**: The final score (0-100) and any hard rule violations will determine the outcome: auto-approve, send to manual review, or auto-reject.

### **5. Manual Review Queue & Dashboard**
-   **Interface**: A dedicated internal dashboard for the compliance team.
-   **Features**:
    -   Prioritized case queue (high-risk first).
    -   Side-by-side document and data comparison view.
    -   Integrated tools for external research.
    -   Clear actions: Approve, Reject, Request More Information, Escalate.
    -   Immutable audit trail for every action taken by a reviewer.
-   **QA**: Implement a quality assurance process with peer reviews and random sampling of automated approvals.

---

## **5. AML Compliance Program & Reporting**

This section outlines the comprehensive program for ensuring ongoing compliance with Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) regulations.

### **5.1 Suspicious Activity Monitoring & Reporting**
-   **Automated Red Flags**: The system will automatically monitor for and flag suspicious activities based on a set of rules:
    -   **Transaction-based**: Single transactions > 50,000 DZD, structuring (many small transactions), rapid fund turnover.
    -   **Account-based**: Dormant accounts becoming suddenly active, geographic anomalies.
    -   **Relationship-based**: Circular transactions (e.g., A→B→C→A).
-   **Manual Investigation**:
    -   Alerts are investigated by a compliance analyst.
    -   If suspicion is confirmed, a Suspicious Activity Report (SAR) is prepared and signed off by the MLRO.
    -   Actions may include enhanced monitoring, account limits, or account termination.
-   **SAR Filing**:
    -   Reports are filed with the Algerian Financial Intelligence Unit (CTRF) within 48 hours of suspicion.
    -   **Confidentiality is paramount**: The customer is never informed that a SAR has been filed ("tipping-off" is a criminal offense).
-   **Record Keeping**: All transaction records, KYC documents, and SARs must be retained for a minimum of 10 years and be easily retrievable.

### **5.2 Governance & Organization**
-   **MLRO (Money Laundering Reporting Officer)**: A senior, independent employee responsible for the entire AML/CFT program, acting as the main liaison with regulatory authorities.
-   **Compliance Team**: A dedicated team of officers and analysts responsible for KYC reviews, transaction monitoring, and alert investigation.
-   **Board Oversight**: The board of directors will receive quarterly compliance reports and must approve the AML policy annually.

### **5.3 Training & Awareness**
-   **Mandatory Training**: All staff will receive mandatory AML/CFT training upon onboarding and an annual refresher. This covers local laws, red flags, and internal reporting procedures.
-   **Specialized Training**: The compliance team will receive advanced, ongoing training in investigation techniques and regulatory updates.

### **5.4 Independent Testing & Audit**
-   **Annual AML Audit**: An independent external or internal audit will be conducted annually to test the effectiveness of all compliance controls (KYC, monitoring, reporting, training).
-   **Regulatory Examinations**: The program is designed to be ready for inspections by the Bank of Algeria and the CTRF at any time.
-   **Continuous Improvement**: Findings from audits and regulatory exams will be used to continuously strengthen the compliance program.
