# Mobile Application

This directory contains the source code for the Contacto mobile application, built with React Native and Expo. The app is designed to provide a seamless and intuitive user experience on both Android and iOS devices.

## Key Principles

-   **Cross-Platform**: We use React Native to write a single codebase that runs on both Android and iOS, maximizing code reuse and development speed.
-   **Native Performance**: We strive to achieve near-native performance by leveraging native components and optimizing our code.
-   **Offline-First**: The app is designed to be usable even with a poor or no internet connection, with data being synced to the server when a connection is available.
-   **User-Centric Design**: The user experience is our top priority, and we follow platform-specific design guidelines to ensure the app feels familiar and easy to use.

## Tech Stack

-   **Framework**: React Native with Expo
-   **Language**: TypeScript
-   **Navigation**: React Navigation
-   **UI Components**: React Native Paper or a custom component library
-   **State Management**: Redux Toolkit
-   **Data Fetching**: RTK Query
-   **Storage**: AsyncStorage

## Directory Structure

-   **`assets/`**: Static assets like images, fonts, and icons.
-   **`components/`**: Shared, reusable UI components.
-   **`constants/`**: Application-wide constants, such as colors, API endpoints, etc.
-   **`hooks/`**: Custom React hooks for reusable logic.
-   **`navigation/`**: Navigation logic, including stack and tab navigators.
-   **`screens/`**: The main screens of the application.
-   **`services/`**: Modules for interacting with external services, such as the backend API.
-   **`store/`**: Redux Toolkit store, slices, and other state management logic.
-   **`utils/`**: General-purpose utility functions.
