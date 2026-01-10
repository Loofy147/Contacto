# Customer Relationship Management (CRM) Service

This service is dedicated to managing all customer-related data and interactions. It provides a 360-degree view of the customer, tracks their purchase history, and manages a loyalty program.

## Responsibilities

-   **Customer Profiles**: CRUD operations for customer data.
-   **Purchase History**: Tracking all transactions associated with a customer.
-   **Customer Segmentation**: Grouping customers based on their behavior (e.g., high-spenders, frequent visitors).
-   **Loyalty Program**: Managing loyalty points, tiers, and rewards.

## API Endpoints (v1)

-   `GET /api/v1/customers`: List all customers.
-   `POST /api/v1/customers`: Add a new customer.
-   `GET /api/v1/customers/{id}`: Retrieve a single customer's details, including their purchase history and loyalty status.
-   `PUT /api/v1/customers/{id}`: Update a customer's information.
-   `GET /api/v1/customers/{id}/transactions`: Get a list of all transactions for a specific customer.
-   `POST /api/v1/customers/{id}/notes`: Add an internal note to a customer's profile.

### Loyalty Program
-   `GET /api/v1/loyalty/points/{customer_id}`: Get the current loyalty point balance for a customer.
-   `POST /api/v1/loyalty/redeem`: Redeem loyalty points for a reward.
-   `GET /api/v1/loyalty/tiers`: Get the defined loyalty tiers and their benefits.
