# Utils

This directory contains shared utility functions and helper modules that are used across multiple services in the backend. The purpose of this directory is to promote code reuse and keep the codebase DRY (Don't Repeat Yourself).

## Common Utilities

-   **`apiResponse.ts`**: A standardized function for sending JSON responses, ensuring a consistent response format across the entire API.
-   **`asyncHandler.ts`**: A wrapper for Express route handlers that automatically catches asynchronous errors and passes them to the global error handler.
-   **`logger.ts`**: A shared logging utility (e.g., Winston) that can be used by any service to log messages and errors.
-   **`email.ts`**: A utility module for sending emails using a service like Nodemailer or SendGrid.
-   **`sms.ts`**: A utility for sending SMS messages via Twilio or another SMS gateway.
-   **`validation.ts`**: Contains common validation schemas or functions that can be reused in different services.

By centralizing these common functionalities, we can ensure consistency and make the code easier to maintain and test.
