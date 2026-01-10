# Navigation Directory

This directory is responsible for managing all aspects of navigation and routing within the mobile application. A well-structured navigation system is crucial for creating a user experience that is both intuitive and scalable.

## Core Technology

We use **React Navigation** as our primary navigation library. It's a powerful, flexible, and widely-used solution for routing in React Native applications.

## Structure

The navigation is typically broken down into several navigator files, each responsible for a specific part of the application's flow:

-   **`AppNavigator.tsx`**: This is the root navigator of the application. It's responsible for conditionally rendering the `AuthNavigator` or the `MainTabNavigator` based on the user's authentication status.

-   **`AuthNavigator.tsx`**: This navigator handles the authentication flow, including screens for logging in, registering, and resetting a password. Once the user is authenticated, they are redirected to the main part of the app.

-   **`MainTabNavigator.tsx`**: This is the main navigator for the authenticated user experience. It's typically a tab navigator with different tabs for the primary features of the app, such as:
    -   Home (Search)
    -   Map
    -   Appointments
    -   Profile

-   **`HomeStackNavigator.tsx` (and other stack navigators)**: Each tab in the `MainTabNavigator` can have its own stack navigator. This allows for nested navigation within each tab. For example, the "Home" tab might have a stack for the main search screen and a separate screen for viewing a professional's profile.

## Deep Linking

React Navigation provides built-in support for deep linking, which allows users to open the app to a specific screen from a URL. We will configure deep linking to enable features like push notifications that navigate to a specific appointment or review.
