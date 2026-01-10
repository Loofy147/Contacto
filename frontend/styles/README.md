# Styles Directory

This directory holds all the global styles and styling-related configuration for the application.

## Files

-   **`globals.css`**: This is the main global stylesheet for the application. It's where we define our base styles, custom CSS variables, and any other styles that need to be applied globally. We also import the base Tailwind CSS styles here.

-   **`tailwind.config.ts`**: This is the configuration file for Tailwind CSS. Here, we can customize the default theme (e.g., colors, fonts, spacing), add new plugins, and configure the `content` property to tell Tailwind which files to scan for classes.

## Styling Philosophy

We primarily use **Tailwind CSS** for styling our components. This utility-first approach allows us to build complex UIs without writing a lot of custom CSS. For more complex, reusable styles, we create custom utility classes or components.

Global styles are kept to a minimum to avoid unintended side effects. We prefer to style components individually using Tailwind's utility classes.
