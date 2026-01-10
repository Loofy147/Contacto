# Sales & Transactions Service (POS)

This service is the heart of the Point-of-Sale (POS) system. It manages all sales transactions, processes refunds, and generates receipts.

## Responsibilities

-   **Transaction Processing**: Creating new sales transactions, calculating totals, and applying discounts.
-   **Refund Management**: Handling full or partial refunds for existing transactions.
-   **Receipt Generation**: Creating and sending digital receipts (PDF) via email or SMS.
-   **Sales Analytics**: Providing real-time statistics on sales performance.

## API Endpoints (v1)

-   `POST /api/v1/transactions`: Create a new sales transaction.
    -   **Request Body:** Includes items, customer ID, discount, and payment method.
    -   **Response:** Includes transaction ID, total amount, and a URL to the PDF receipt.
-   `GET /api/v1/transactions`: Retrieve a paginated list of all transactions.
-   `GET /api/v1/transactions/{id}`: Get the details for a single transaction.
-   `POST /api/v1/transactions/{id}/refund`: Process a full or partial refund for a transaction.
-   `GET /api/v1/transactions/stats`: Get sales statistics (e.g., for today, this week, this month), including top-selling products.
-   `POST /api/v1/receipts/send`: Send a receipt to a customer via email or SMS.
