# Appointments Service

This service is dedicated to managing the entire lifecycle of appointments between users and professionals.

## Responsibilities

-   **Booking**: Allows users to request appointments with professionals for specific services and time slots.
-   **Confirmation/Cancellation**: Enables professionals to confirm or cancel appointment requests. Users can also cancel their own appointments.
-   **Reminders**: Automatically sends reminders to both users and professionals via SMS and email before an appointment.
-   **Availability Management**: (Future) Will integrate with a professional's calendar to show real-time availability.

## API Endpoints

-   `POST /api/appointments`: Create a new appointment request.
-   `GET /api/appointments`: Get a list of appointments for the current user or professional.
-   `GET /api/appointments/:id`: Get the details of a specific appointment.
-   `PUT /api/appointments/:id`: Update the status of an appointment (e.g., confirm, cancel).
-   `DELETE /api/appointments/:id`: Delete an appointment.

## Data Model (`appointments`)

-   `id` (SERIAL PRIMARY KEY)
-   `professional_id` (INTEGER, FOREIGN KEY to `professionals`)
-   `user_id` (INTEGER, FOREIGN KEY to `users`)
-   `service_id` (INTEGER, FOREIGN KEY to `services`)
-   `appointment_date` (DATE)
-   `start_time` (TIME)
-   `end_time` (TIME)
-   `status` (VARCHAR, e.g., 'pending', 'confirmed', 'cancelled')
-   `notes` (TEXT)
-   `created_at` (TIMESTAMP)
-   `updated_at` (TIMESTAMP)
