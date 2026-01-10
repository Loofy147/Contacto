# Users & Auth Service

The Users & Auth Service is responsible for managing all aspects of user accounts, authentication, and authorization on the Contacto platform. It handles user registration, login, API key management, and defining roles and permissions.

## Responsibilities

-   **User Registration & Authentication**: Creating new user accounts, handling logins (JWT), and managing sessions.
-   **API Key Management**: Generating, listing, and revoking API keys for programmatic access.
-   **Authorization**: Defining and managing user roles and permissions for access control across all services.
-   **Profile Management**: Storing and managing user profile information.

## API Endpoints (v1)

### Authentication
-   `POST /api/v1/auth/register`: Register a new user account.
-   `POST /api/v1/auth/login`: Log in a user and receive a JSON Web Token (JWT).
-   `POST /api/v1/auth/refresh`: Obtain a new JWT using a refresh token.
-   `POST /api/v1/auth/logout`: Log out the current user.
-   `GET /api/v1/auth/me`: Get the profile of the currently authenticated user.

### API Keys
-   `POST /api/v1/api-keys`: Create a new API key for a user.
-   `GET /api/v1/api-keys`: List all API keys for the current user.
-   `DELETE /api/v1/api-keys/{id}`: Revoke an API key.

### Security Features
-   Rate limiting per user and per API key.
-   IP whitelisting capabilities.
-   CORS configuration for frontend applications.
-   Webhook signature verification.
