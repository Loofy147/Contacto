# Professionals Service

The Professionals Service is the core of the Contacto directory platform. It manages the profiles of all professionals, including their services, portfolios, and other business-related information.

## Responsibilities

-   **Profile Management**: Creating, updating, and deleting professional profiles.
-   **Service Listings**: Managing the services offered by each professional, including descriptions and pricing.
-   **Portfolio Management**: Handling the upload and management of portfolio items (images, videos, etc.).
-   **Verification**: Managing the verification status of professionals to build trust on the platform.
-   **Search and Discovery**: Providing robust search and filtering capabilities to help users find the right professional.

## API Endpoints

-   `GET /api/professionals`: Get a list of professionals with filtering and pagination.
-   `GET /api/professionals/:id`: Get the detailed profile of a specific professional.
-   `POST /api/professionals`: Create a new professional profile (requires user to be authenticated).
-   `PUT /api/professionals/:id`: Update a professional's profile.
-   `DELETE /api/professionals/:id`: Delete a professional's profile.
-   `POST /api/professionals/:id/services`: Add a new service to a professional's profile.
-   `PUT /api/professionals/:id/services/:serviceId`: Update a service.
-   `DELETE /api/professionals/:id/services/:serviceId`: Delete a service.
-   `POST /api/professionals/:id/portfolio`: Add a new item to a professional's portfolio.
-   `DELETE /api/professionals/:id/portfolio/:itemId`: Delete a portfolio item.

## Data Model (`professionals`)

Refer to the main `README.md` in the `database` directory for the detailed schema of the `professionals` table and its related tables (`services`, `portfolio_items`, etc.).
