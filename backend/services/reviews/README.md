# Reviews Service

This service manages the rating and review system for professionals on the platform. It's a critical component for building trust and providing social proof.

## Responsibilities

-   **Creating Reviews**: Allows authenticated users to submit reviews and ratings for professionals they have hired.
-   **Reading Reviews**: Provides endpoints to retrieve all reviews for a specific professional.
-   **Updating and Deleting Reviews**: Users can update or delete their own reviews.
-   **Moderation**: (Future) Will include a system for flagging and moderating inappropriate or fake reviews.
-   **Review Verification**: Implements a mechanism to verify that a review is from a genuine customer.

## API Endpoints

-   `POST /api/reviews`: Submit a new review for a professional.
-   `GET /api/reviews?professionalId=:id`: Get all reviews for a specific professional.
-   `GET /api/reviews/:id`: Get a single review by its ID.
-   `PUT /api/reviews/:id`: Update a review.
-   `DELETE /api/reviews/:id`: Delete a review.

## Data Model (`reviews`)

-   `id` (SERIAL PRIMARY KEY)
-   `professional_id` (INTEGER, FOREIGN KEY to `professionals`)
-   `user_id` (INTEGER, FOREIGN KEY to `users`)
-   `overall_rating` (INTEGER, 1-5)
-   `review_text` (TEXT)
-   `is_verified` (BOOLEAN)
-   `created_at` (TIMESTAMP)
-   `updated_at` (TIMESTAMP)
