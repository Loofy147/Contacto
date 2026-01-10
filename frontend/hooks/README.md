# Hooks Directory

This directory contains custom React hooks that are used to encapsulate and reuse stateful logic across different components. By extracting component logic into hooks, we can keep our components lean and focused on rendering UI.

## When to Create a Custom Hook

You should consider creating a custom hook whenever you find yourself repeating the same logic (e.g., `useState`, `useEffect`, `useContext`) in multiple components. A good custom hook should be focused on a single piece of functionality.

## Naming Convention

Custom hooks should always start with the word `use`, for example, `useDebounce` or `useMediaQuery`. This is a convention that is enforced by the React linter.

## Examples of Custom Hooks

-   **`useDebounce`**: A hook that takes a value and a delay, and returns a debounced version of that value. This is useful for things like search inputs where you don't want to fire off a request on every keystroke.
-   **`useMediaQuery`**: A hook that listens to a CSS media query and returns a boolean indicating whether the query matches. This is useful for creating responsive components that need to adapt their behavior based on the screen size.
-   **`useLocalStorage`**: A hook that provides a `useState`-like interface for storing state in the browser's local storage.
-   **`useOnClickOutside`**: A hook that triggers a callback when the user clicks outside of a specified element. This is useful for closing modals and dropdowns.
-   **`useAuth`**: A hook that provides easy access to the current user's authentication status and profile from the `AuthContext`.

By creating a library of custom hooks, we can significantly reduce code duplication and make our components more readable and maintainable.
