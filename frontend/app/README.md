# App Directory

This directory is the heart of our Next.js application, utilizing the **App Router** introduced in Next.js 13. This paradigm shift from the traditional `pages` directory allows for a more intuitive and powerful way to structure the application's routes and UI.

## Key Concepts

-   **File-system Based Routing**: Each folder inside the `app` directory represents a route segment. For example, `app/professionals/[id]/` maps to the URL `/professionals/:id`.
-   **Special Files**: Next.js uses a set of special files to create UI for each route segment:
    -   `page.tsx`: The main UI for a route.
    -   `layout.tsx`: A shared UI that wraps a segment and its children.
    -   `loading.tsx`: A loading indicator that is shown while a page's content is loading.
    -   `error.tsx`: An error boundary that is shown when an error occurs in a segment.
    -   `template.tsx`: Similar to a layout, but it re-mounts on navigation.
    -   `route.ts`: For creating API endpoints within the `app` directory.
-   **Server Components**: By default, all components in the `app` directory are React Server Components. This allows us to fetch data directly in our components, improving performance and reducing the amount of client-side JavaScript.
-   **Client Components**: Components that require interactivity (e.g., using hooks like `useState` or `useEffect`) must be explicitly marked as client components with the `"use client";` directive at the top of the file.

## Structure

The `app` directory is organized by routes. For example, a typical structure might look like this:

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── professionals/
│   ├── [id]/
│   │   └── page.tsx
│   └── page.tsx
├── layout.tsx
└── page.tsx
```

-   **`(auth)`**: This is a route group, which allows us to organize our routes without affecting the URL.
-   **`[id]`**: This is a dynamic route segment, which allows us to create pages for individual professionals.

By embracing the App Router, we can build a more robust, performant, and maintainable frontend.
