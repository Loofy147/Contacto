# Business Management Service (Professionals)

This service manages the core business information for professionals and merchants on the platform. It handles the CRUD operations for business profiles and provides access to high-level analytics and reports.

## Responsibilities

-   **Business Profile Management**: Creating, retrieving, updating, and deleting the core profile of a business or professional.
-   **Business Analytics**: Providing aggregated statistics and analytics about the business's performance.
-   **Reporting**: Generating structured reports (e.g., daily sales, financial summaries).

## API Endpoints (v1)

-   `GET /api/v1/business`: Retrieve the detailed information for the authenticated user's business.
-   `PUT /api/v1/business`: Update the business's information.
-   `GET /api/v1/business/stats`: Get general statistics for the business (e.g., total sales, number of customers).
-   `GET /api/v1/business/analytics`: Access advanced analytics with query parameters for date ranges and specific metrics.
-   `GET /api/v1/business/reports`: Generate and retrieve pre-defined reports, such as daily sales or monthly financial summaries, in PDF or Excel format.
