# Settings Service

This service is responsible for managing all business-level settings and configurations. It acts as a central repository for preferences and configurations that affect how the business operates on the Contacto platform.

## Responsibilities

-   **Business Profile Management**: Storing and serving the core business profile information (name, logo, address, tax info).
-   **POS Configuration**: Managing settings for the Point-of-Sale system, such as receipt templates and payment methods.
-   **Integration Management**: Handling API keys for third-party integrations and webhook configurations.
-   **Subscription & Billing**: Managing the business's subscription plan, billing history, and payment methods.

## API Endpoints (v1)

### Business Profile
-   `GET /api/v1/settings/business`: Get the main business profile settings.
-   `PUT /api/v1/settings/business`: Update the business profile.

### POS Settings
-   `GET /api/v1/settings/pos`: Get the POS configuration.
-   `PUT /api/v1/settings/pos`: Update the POS configuration.

### Notification Settings
-   `GET /api/v1/settings/notifications`: Get the current notification preferences.
-   `PUT /api/v1/settings/notifications`: Update notification preferences.

### Subscription & Billing
-   `GET /api/v1/settings/subscription`: Get details about the current subscription plan and usage.
-   `GET /api/v1/settings/billing/history`: Get the billing history and invoices.
-   `PUT /api/v1/settings/billing/payment-method`: Update the payment method on file.
