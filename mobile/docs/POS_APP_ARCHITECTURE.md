# POS Application (Mobile/Tablet) - Architecture & Features

This document provides the complete specifications for the Contacto Point-of-Sale (POS) mobile and tablet application.

---

## **Mobile POS App Architecture**

-   **Platform Support**:
    -   **Android (Priority 1)**: Min SDK 24 (Android 7.0), Target SDK 34 (Android 14). Optimized for phones and tablets.
    -   **iOS (Phase 2 - Q1 2027)**: Min iOS 14.0. Optimized for iPhone and iPad.
-   **Tablet Optimization**:
    -   Designed for 7-10 inch screens.
    -   Full support for landscape mode.

---

## **Core Features**

### **1. Quick Sale Interface**
-   **Product Search**: Barcode scanning (camera/Bluetooth), text search (name/SKU), and a visual grid.
-   **Cart Management**: Add/remove items, adjust quantities, apply item-level discounts.
-   **Customer Selection**: Search for existing customers or add new ones on the fly.
-   **Discounts & Coupons**: Apply percentage, fixed amount, or coupon code discounts to the entire cart.
-   **Payment**:
    -   Multiple payment methods (Cash, Card, Mobile).
    -   Split payment functionality.
    -   Cash drawer management with change calculation.
-   **Receipts**: Options to print (Bluetooth/USB), email, or SMS receipts.

### **2. Offline Mode (Critical Feature)**
-   **Local Database**: Uses an encrypted Realm database to store the product catalog, customer list, and pending transactions locally.
-   **Offline Capabilities**: Process sales, view products, and queue transactions while offline.
-   **Sync Mechanism**: Automatically syncs with the server when a connection is restored. Includes a manual sync trigger and conflict resolution.
-   **UI Indicators**: Clear visual cues for offline status and sync progress.

### **3. Product Management (Light)**
-   View product details in a grid or list view.
-   Quick-add new products with essential information and a photo.
-   Perform quick stock adjustments (in/out).

### **4. Hardware Integration**
-   **Barcode Scanners**: Supports the built-in camera, Bluetooth scanners (Zebra, Honeywell), and USB scanners.
-   **Receipt Printers**: Supports Bluetooth and USB thermal printers (58mm/80mm) from major brands like Epson and Star Micronics.
-   **Cash Drawers**: Can be connected via a receipt printer.
-   **Card Readers (Phase 3)**: Future support for EMV, NFC, and magnetic stripe readers.

### **5. End-of-Day Operations**
-   **Cash Reconciliation**: A guided process to count cash and identify any variance.
-   **Shift Reports**: Generate a summary of sales, payments, and transactions for the shift.
-   **Close Register**: Formal process to end the business day.

### **6. Settings & Configuration**
-   **Device Settings**: Pair printers and scanners.
-   **User Preferences**: Set default payment methods and receipt options.
-   **Security**: PIN lock, auto-logout timer, and biometric unlock.

---

## **Technical Specifications**

-   **Framework**: React Native (0.73+)
-   **State Management**: Redux Toolkit + Redux Persist
-   **Local Database**: Realm (encrypted)
-   **Networking**: Axios with an offline queue for pending requests.
-   **UI Components**: React Native Paper
-   **Navigation**: React Navigation
-   **Barcode Scanning**: `react-native-vision-camera` with Google ML Kit.
-   **Printing**: `react-native-thermal-printer` and similar libraries for Bluetooth/USB communication.
-   **Performance Goals**:
    -   Fast startup (<3s)
    -   Smooth 60 FPS scrolling
    -   Optimized images and code splitting.
