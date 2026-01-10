# Contexts Directory

This directory holds all the React Context providers for the application. The React Context API is used to manage global state that needs to be accessible by many components at different levels of the component tree.

## When to Use Context

While we use Zustand for most of our global state management and TanStack Query for server state, there are still some cases where the Context API is a good fit:

-   **Theme**: Managing the current theme (e.g., light or dark mode) and making it available to all components.
-   **Authentication**: Storing the current user's authentication status and profile information.
-   **Localization**: Providing the current language and translation functions to the entire application.
-   **Simple, low-frequency updates**: Context is ideal for state that doesn't change often, as any update to the context will cause all consuming components to re-render.

## Example

A typical context file might look like this:

```typescript
// contexts/ThemeContext.tsx
"use client";

import { createContext, useContext, useState } from 'react';

type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

This context can then be used in any component by wrapping the application in the `ThemeProvider` and calling the `useTheme` hook.
