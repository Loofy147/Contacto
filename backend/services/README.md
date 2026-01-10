# Services

This directory houses the core business logic of the application, organized into a microservices architecture. Each subdirectory within `services` represents a distinct microservice, responsible for a specific domain of the platform.

## Architecture

Each service is designed to be a self-contained unit with its own:

- **`controllers/`**: These handle the incoming HTTP requests from the client. They are responsible for parsing the request, calling the appropriate business logic in the models (or service layer), and sending a response back to the client.
- **`models/`**: This layer contains the data models and business logic for the service. It interacts with the database, performs data validation, and implements the core functionality of the service.
- **`routes/`**: This is where the API endpoints for the service are defined. Each route maps a specific URL and HTTP method to a controller function.

## Communication Between Services

Services communicate with each other asynchronously using an event bus (e.g., RabbitMQ or Redis Pub/Sub). When a service needs to notify another service of an event, it publishes a message to a specific channel. Other services can then subscribe to that channel to receive and process the event. This decoupled approach improves scalability and resilience.

## Current Services

- **`users/`**: Manages user accounts, authentication, and profiles.
- **`professionals/`**: Handles the profiles of professionals, including their services, portfolios, and contact information.
- **`appointments/`**: Manages the booking and scheduling of appointments.
- **`reviews/`**: Manages ratings and reviews for professionals.
