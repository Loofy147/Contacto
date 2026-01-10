# Frontend

This directory contains the frontend code for the Contacto platform, built with Next.js 14+ and TypeScript. It follows the latest best practices for building modern, performant, and scalable web applications.

## Key Principles

-   **Component-Based Architecture**: The UI is built as a hierarchy of reusable components.
-   **Server-Side Rendering (SSR) and Static Site Generation (SSG)**: We leverage Next.js's rendering capabilities to optimize for performance and SEO.
-   **Mobile-First Design**: The application is designed to be fully responsive, with a focus on the mobile experience first.
-   **Accessibility**: We strive to make the platform accessible to all users by following WCAG guidelines.

## Tech Stack

-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS with shadcn/ui
-   **State Management**: Zustand (global) and TanStack Query (server state)
-   **Forms**: React Hook Form
-   **Testing**: Jest, React Testing Library, and Playwright

## Directory Structure

-   **`app/`**: The core of the application, using the Next.js App Router. Contains all routes, pages, and layouts.
-   **`components/`**: Shared, reusable UI components used throughout the application.
-   **`constants/`**: Application-wide constants, such as navigation links, form validation schemas, etc.
-.  **`contexts/`**: React Context providers for managing global state that doesn't fit well into Zustand or TanStack Query.
-   **`hooks/`**: Custom React hooks that encapsulate reusable logic.
-   **`lib/`**: Utility functions and helper modules that are specific to the frontend.
-   **`public/`**: Static assets that are publicly accessible, such as images, fonts, and favicons.
-   **`styles/`**: Global styles and Tailwind CSS configuration.
-   **`utils/`**: General-purpose utility functions that can be used anywhere in the application.
