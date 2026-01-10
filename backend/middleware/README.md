# Middleware

This directory contains custom Express.js middleware functions that are used across various services in the backend. Middleware functions are used to intercept and process requests before they reach their final route handlers.

## Common Middleware

- **`auth.ts`**: Handles authentication and authorization. It verifies JWTs, checks user roles and permissions, and attaches the user object to the request.
- **`logger.ts`**: Logs incoming requests and outgoing responses, providing valuable debugging information.
- **`errorHandler.ts`**: A centralized error-handling middleware that catches and processes errors from anywhere in the application, sending a standardized error response to the client.
- **`validator.ts`**: Contains middleware for validating and sanitizing request bodies, query parameters, and headers using a library like `express-validator`.
- **`rateLimiter.ts`**: Implements rate limiting to protect the API from abuse and denial-of-service attacks.

## Usage

Middleware can be applied at the application level (using `app.use()`) or at the route level. For example:

```typescript
import { auth } from './middleware/auth';
import { validator } from './middleware/validator';

// Apply auth middleware to all routes
app.use(auth);

// Apply validator middleware to a specific route
app.post('/api/users', validator('createUser'), (req, res) => {
  // ...
});
```
