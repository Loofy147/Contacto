# Notifications & Webhooks Service

This service manages all real-time and asynchronous notifications for the platform. It's the central hub for sending alerts and data to both end-users and third-party systems.

## Responsibilities

-   **Webhook Management**: Allowing developers to register, manage, and test webhook URLs.
-   **Event Publishing**: Sending real-time event notifications (e.g., `transaction.created`, `product.low_stock`) to registered webhooks.
-   **WebSocket API**: Providing a real-time WebSocket connection for live updates in the frontend dashboard.
-   **Push Notifications**: Sending push notifications to mobile devices for important events.

## API Endpoints (v1)

### Webhooks
-   `POST /api/v1/webhooks`: Register a new webhook URL for a specific event.
-   `GET /api/v1/webhooks`: List all registered webhooks.
-   `DELETE /api/v1/webhooks/{id}`: Delete a webhook.
-   `POST /api/v1/webhooks/test`: Send a test event to a webhook.

### Push Notifications
-   `POST /api/v1/notifications/send`: Send a push notification to a specific user or topic.

### WebSocket API
-   `wss://api.contacto.dz/v1/ws`: The endpoint for establishing a WebSocket connection. Clients can subscribe to topics to receive live updates.
