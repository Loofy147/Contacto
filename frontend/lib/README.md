# Lib Directory

The `lib` directory contains various helper functions, utility modules, and third-party library configurations that are specific to the frontend application. It's a place for code that doesn't fit neatly into the other directories, but is essential for the application's functionality.

## Common Modules

-   **`api.ts`**: A module for making requests to the backend API. This could be a wrapper around `fetch` or a pre-configured `axios` instance. It might also include functions for handling authentication tokens and errors.
-   **`utils.ts`**: A collection of general-purpose utility functions that can be used throughout the application, such as functions for formatting dates, manipulating strings, or calculating values.
-   **`validations.ts`**: Contains validation schemas (e.g., using `zod`) that are used by React Hook Form to validate forms.
-   **`shadcn.ts`**: (If using shadcn/ui) A utility file for the `cn` function, which merges Tailwind CSS classes.
-   **`queryClient.ts`**: The configuration and instantiation of the TanStack Query client.
-   **`zustand.ts`**: The creation of the Zustand store for global state management.

By keeping these modules in a dedicated `lib` directory, we can maintain a clear separation of concerns and make our code easier to navigate and understand.
