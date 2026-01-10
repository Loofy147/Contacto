# API Guidelines

These guidelines are to be followed by all developers when designing, building, and maintaining APIs for the Contacto platform. The goal is to ensure that our APIs are consistent, predictable, and easy to use.

## General Principles

-   **RESTful**: We follow the principles of REST (Representational State Transfer) for our API design. This means using standard HTTP methods, status codes, and a resource-oriented URL structure.
-   **JSON**: All API responses should be in JSON format. The `Content-Type` header should be set to `application/json`.
-   **Versioning**: All APIs should be versioned to ensure that changes do not break existing clients. The version should be included in the URL, e.g., `/api/v1/users`.
-   **Authentication**: All API endpoints that require authentication must be protected. We use JSON Web Tokens (JWTs) for authentication. The token should be passed in the `Authorization` header with the `Bearer` scheme.

## URL Structure

-   URLs should be resource-oriented and use nouns, not verbs.
    -   Good: `/api/v1/professionals`
    -   Bad: `/api/v1/getProfessionals`
-   Use plural nouns for collections, e.g., `/professionals`.
-   Use the resource ID for specific items, e.g., `/professionals/123`.
-   For nested resources, follow a logical path, e.g., `/professionals/123/services`.

## HTTP Methods

-   `GET`: Retrieve a resource or a collection of resources.
-   `POST`: Create a new resource.
-   `PUT`: Update an existing resource (replaces the entire resource).
-   `PATCH`: Partially update an existing resource.
-   `DELETE`: Delete a resource.

## Status Codes

-   **2xx (Success)**
    -   `200 OK`: The request was successful.
    -   `201 Created`: A new resource was created successfully.
    -   `204 No Content`: The request was successful, but there is no content to return (e.g., for a DELETE request).
-   **4xx (Client Error)**
    -   `400 Bad Request`: The request was invalid (e.g., missing parameters, invalid JSON).
    -   `401 Unauthorized`: The request requires authentication.
    -   `403 Forbidden`: The authenticated user does not have permission to access the resource.
    -   `404 Not Found`: The requested resource could not be found.
-   **5xx (Server Error)**
    -   `500 Internal Server Error`: An unexpected error occurred on the server.

## Response Format

All API responses should follow a consistent format:

```json
{
  "success": true,
  "data": {
    // ... the actual data
  },
  "message": "The request was successful."
}
```

For error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "The email address is already in use."
  }
}
```

## Pagination, Sorting, and Filtering

-   **Pagination**: Use query parameters `page` and `limit` to paginate collections, e.g., `/professionals?page=2&limit=20`.
-   **Sorting**: Use a `sort` parameter, e.g., `/professionals?sort=-rating` (descending) or `/professionals?sort=rating` (ascending).
-   **Filtering**: Use query parameters to filter collections, e.g., `/professionals?category=plumber&wilaya=Algiers`.
