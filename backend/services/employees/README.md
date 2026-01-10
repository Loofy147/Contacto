# Employee & Team Management Service

This service is responsible for managing all aspects of a business's team, including employee profiles, role-based access control (RBAC), performance tracking, and activity logging.

## Responsibilities

-   **Employee Management**: Full CRUD operations for employee profiles.
-   **Role-Based Access Control (RBAC)**: Defining roles (e.g., Admin, Manager, Cashier) and assigning fine-grained permissions.
-   **Performance Tracking**: Providing endpoints to track employee sales performance.
-   **Activity Logging**: Tracking significant actions performed by employees for auditing purposes.
-   **Attendance & Scheduling**: Basic functionalities for time tracking and shift management.

## API Endpoints (v1)

### Employee Management
-   `GET /api/v1/employees`: List all employees (active, inactive, pending).
-   `POST /api/v1/employees`: Add a new employee and send an invitation.
-   `GET /api/v1/employees/{id}`: Retrieve a single employee's full details.
-   `PUT /api/v1/employees/{id}`: Update an employee's profile, role, or permissions.
-   `DELETE /api/v1/employees/{id}`: Deactivate an employee's account (soft delete).

### Roles & Permissions
-   `GET /api/v1/roles`: List all predefined and custom roles.
-   `POST /api/v1/roles`: Create a new custom role with specific permissions.
-   `GET /api/v1/roles/{id}`: Get details for a specific role.
-   `PUT /api/v1/roles/{id}`: Update a role's name or permissions.
-   `DELETE /api/v1/roles/{id}`: Delete a custom role.

### Performance & Activity
-   `GET /api/v1/employees/{id}/performance`: Get performance metrics for an employee (e.g., sales, transactions).
-   `GET /api/v1/employees/activity`: Get a filterable log of all employee activities across the business.

### Attendance
-   `POST /api/v1/attendance/clock-in`: Clock in an employee.
-   `POST /api/v1/attendance/clock-out`: Clock out an employee.
-   `GET /api/v1/attendance/history`: Get the attendance history for a specific employee or date range.
