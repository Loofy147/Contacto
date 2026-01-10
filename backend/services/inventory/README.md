# Inventory Management Service

This service is responsible for all aspects of inventory and stock management for merchants. It provides a comprehensive API for handling products, categories, stock adjustments, and suppliers.

## Responsibilities

-   **Product Management**: CRUD operations for products, including variants and bulk import capabilities.
-   **Category Management**: Organizing products into a hierarchical category structure.
-   **Stock Management**: Tracking stock levels, managing stock movements (in/out), and providing low-stock alerts.
-   **Supplier Management**: Maintaining a database of suppliers and linking them to products.

## API Endpoints (v1)

### Products
-   `GET /api/v1/products`: List all products with pagination, filtering, sorting, and search.
-   `POST /api/v1/products`: Create a new product.
-   `GET /api/v1/products/{id}`: Retrieve a single product's details.
-   `PUT /api/v1/products/{id}`: Update a product.
-   `DELETE /api/v1/products/{id}`: Soft delete a product.
-   `POST /api/v1/products/bulk`: Bulk import products from a CSV or Excel file.

### Categories
-   `GET /api/v1/categories`: List all product categories.
-   `POST /api/v1/categories`: Create a new category.
-   `PUT /api/v1/categories/{id}`: Update a category.
-   `DELETE /api/v1/categories/{id}`: Delete a category.

### Stock Management
-   `GET /api/v1/stock`: Get the current stock levels for all products.
-   `POST /api/v1/stock/adjust`: Adjust the stock level for a product (e.g., for new purchases, damages).
-   `GET /api/v1/stock/movements`: Get a log of all stock movements.
-   `GET /api/v1/stock/low-stock`: Get a list of products that are below their reorder point.
-   `POST /api/v1/stock/transfer`: Transfer stock between different business locations.

### Suppliers
-   `GET /api/v1/suppliers`: List all suppliers.
-   `POST /api/v1/suppliers`: Create a new supplier.
-   `GET /api/v1/suppliers/{id}/orders`: Get a list of purchase orders for a specific supplier.
