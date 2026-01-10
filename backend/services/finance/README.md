# Financial & Accounting Service

This service manages all financial data and provides basic accounting functionalities for businesses. It's designed to help merchants track their financial health and simplify tax compliance.

## Responsibilities

-   **Financial Summaries**: Providing high-level summaries of revenue, expenses, and profit.
-   **Invoicing**: Creating and managing invoices.
-   **Expense Tracking**: Recording and categorizing business expenses.
-   **Tax Reporting**: Generating reports for common Algerian taxes (TVA, TAP, IRG/IBS).

## API Endpoints (v1)

-   `GET /api/v1/finance/summary`: Get a financial summary, including revenue, expenses, and profit.
-   `GET /api/v1/finance/invoices`: List all invoices.
-   `POST /api/v1/finance/invoices`: Create a new invoice.
-   `GET /api/v1/finance/expenses`: List all expenses.
-   `POST /api/v1/finance/expenses`: Record a new expense.
-   `GET /api/v1/finance/tax-reports`: Generate tax reports for TVA, TAP, etc.
-   `GET /api/v1/finance/balance-sheet`: Retrieve a simplified balance sheet.
