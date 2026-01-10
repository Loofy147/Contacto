# Components Directory

This directory is the home for all the shared, reusable UI components that make up the user interface of the Contacto platform. The goal is to create a comprehensive component library that ensures a consistent look and feel across the entire application.

## Principles

-   **Atomic Design**: We loosely follow the principles of Atomic Design, where we build small, reusable "atoms" (like buttons and inputs) and then compose them into larger "molecules" and "organisms."
-   **Dumb vs. Smart Components**: We strive to keep our components as "dumb" as possible, meaning they are primarily responsible for rendering UI based on the props they receive. "Smart" components, which manage state and data fetching, are typically found in the `app` directory.
-   **Storybook**: (Future) We will use Storybook to develop and document our components in isolation, creating a living style guide for the project.

## Structure

-   **`ui/`**: This subdirectory contains the low-level, reusable UI components that are styled with Tailwind CSS and are part of our design system (e.g., `Button.tsx`, `Input.tsx`, `Card.tsx`). These are the building blocks of our application's UI.
-   **`dashboard/`**: This directory will house all the components specifically related to the Business Dashboard. Given the complexity of the dashboard, it will be further subdivided by feature. For a detailed breakdown of the dashboard's modules, see the **[Dashboard Architecture Document](../docs/DASHBOARD_ARCHITECTURE.md)**.
    -   `dashboard/overview/`: Components for the main overview dashboard (e.g., `SalesChart.tsx`, `KpiCard.tsx`).
    -   `dashboard/sales/`: Components for the POS and sales management interface (e.g., `TransactionForm.tsx`, `SalesHistoryTable.tsx`).
    -   `dashboard/inventory/`: Components for managing products, stock, and suppliers (e.g., `ProductList.tsx`, `StockAdjustmentModal.tsx`).
    -   `dashboard/crm/`: Components for the customer relationship management section (e.g., `CustomerProfile.tsx`, `LoyaltyProgramSettings.tsx`).
    -   `dashboard/reports/`: Components for displaying and building reports.
-   **`shared/`**: This directory is for more complex components that are used in multiple parts of the application, but are not as generic as the `ui` components (e.g., `Header.tsx`, `Footer.tsx`, `ProfessionalCard.tsx`).

By organizing our components in this way, we can easily find, reuse, and maintain them as the application grows.
