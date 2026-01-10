# Screens Directory

This directory contains all the main screens of the mobile application. Each screen is a React component that represents a full-screen view in the app.

## Organization

The `screens` directory is organized by the major sections of the application, which typically correspond to the navigators defined in the `navigation` directory.

-   **`auth/`**: This subdirectory contains all the screens related to authentication, such as `LoginScreen.tsx`, `RegisterScreen.tsx`, and `ForgotPasswordScreen.tsx`.

-   **`main/`**: This subdirectory holds the main screens that are accessible to authenticated users. This might include:
    -   `HomeScreen.tsx` (the main search and discovery screen)
    -   `MapScreen.tsx` (the interactive map view)
    -   `AppointmentsScreen.tsx` (a list of the user's upcoming and past appointments)
    -   `ProfileScreen.tsx` (the user's own profile)
    -   `ProfessionalDetailScreen.tsx` (the detailed view of a professional's profile)
    -   `SettingsScreen.tsx` (app settings)

## Screen Components

Each screen component is responsible for:

-   **Fetching and displaying data**: Screens interact with the Redux store and RTK Query to fetch the data they need.
-   **Handling user input**: They manage user interactions, such as button presses, form submissions, and gestures.
-   **Navigating to other screens**: They use the `navigation` prop provided by React Navigation to navigate to other screens in the app.
-   **Composing UI components**: Screens are primarily composed of smaller, reusable components from the `components` directory. This keeps the screen components themselves relatively simple and focused on their specific role.
