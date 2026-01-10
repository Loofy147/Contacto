# Users Service

The Users Service is responsible for managing all aspects of user accounts and authentication on the Contacto platform.

## Responsibilities

-   **User Registration**: Creating new user accounts, including password hashing and validation.
-   **Authentication**: Handling user login, issuing JSON Web Tokens (JWTs), and managing sessions.
-   **User Profiles**: Storing and managing user profile information, such as name, email, and contact details.
-   **Password Management**: Providing functionality for users to reset their passwords.
-   **Authorization**: Defining and managing user roles and permissions.

## API Endpoints

-   `POST /api/users/register`: Register a new user.
-   `POST /api/users/login`: Log in a user and get a JWT.
-   `GET /api/users/me`: Get the profile of the currently logged-in user.
-   `PUT /api/users/me`: Update the profile of the currently logged-in user.
-   `POST /api/users/forgot-password`: Initiate the password reset process.
-   `POST /api/users/reset-password`: Reset a user's password.

## Data Model (`users`)

-   `id` (SERIAL PRIMARY KEY)
-   `email` (VARCHAR, UNIQUE, NOT NULL)
-   `password` (VARCHAR, NOT NULL)
-   `full_name` (VARCHAR)
-   `phone_number` (VARCHAR)
-   `role` (VARCHAR, e.g., 'citizen', 'professional', 'admin')
-   `created_at` (TIMESTAMP)
-   `updated_at` (TIMESTAMP)
