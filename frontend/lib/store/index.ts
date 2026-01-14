// lib/store/index.ts
/**
 * Global state management using Zustand
 * RED TEAM: Test state persistence, concurrent updates, memory leaks
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * UI State Interface
 */
interface UIState {
  // Sidebar
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;

  // Modals
  activeModal: string | null;
  modalData: Record<string, any>;

  // Notifications
  notifications: Notification[];

  // Loading states
  globalLoading: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: number;
}

interface UIActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebarCollapse: () => void;

  // Modal actions
  openModal: (modalId: string, data?: Record<string, any>) => void;
  closeModal: () => void;

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Loading actions
  setGlobalLoading: (isLoading: boolean) => void;

  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

/**
 * Cart State Interface
 */
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  taxRate?: number;
}

interface CartState {
  items: CartItem[];
  customerId?: string;
  discount: number;
  notes: string;
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  setCustomer: (customerId: string | undefined) => void;
  setCartDiscount: (discount: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getTotalTax: () => number;
}

/**
 * UI Store
 * RED TEAM: Test XSS in notifications, modal injection, state corruption
 */
export const useUIStore = create<UIState & UIActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        isSidebarOpen: true,
        isSidebarCollapsed: false,
        activeModal: null,
        modalData: {},
        notifications: [],
        globalLoading: false,
        theme: 'system',

        // Sidebar actions
        toggleSidebar: () =>
          set((state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
          }),

        setSidebarOpen: (isOpen) =>
          set((state) => {
            state.isSidebarOpen = isOpen;
          }),

        toggleSidebarCollapse: () =>
          set((state) => {
            state.isSidebarCollapsed = !state.isSidebarCollapsed;
          }),

        // Modal actions
        openModal: (modalId, data = {}) =>
          set((state) => {
            state.activeModal = modalId;
            state.modalData = data;
          }),

        closeModal: () =>
          set((state) => {
            state.activeModal = null;
            state.modalData = {};
          }),

        // Notification actions
        addNotification: (notification) =>
          set((state) => {
            const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const newNotification: Notification = {
              ...notification,
              id,
              timestamp: Date.now(),
              duration: notification.duration || 5000,
            };

            state.notifications.push(newNotification);

            // Auto-remove after duration
            if (newNotification.duration > 0) {
              setTimeout(() => {
                get().removeNotification(id);
              }, newNotification.duration);
            }
          }),

        removeNotification: (id) =>
          set((state) => {
            state.notifications = state.notifications.filter((n) => n.id !== id);
          }),

        clearNotifications: () =>
          set((state) => {
            state.notifications = [];
          }),

        // Loading actions
        setGlobalLoading: (isLoading) =>
          set((state) => {
            state.globalLoading = isLoading;
          }),

        // Theme actions
        setTheme: (theme) =>
          set((state) => {
            state.theme = theme;

            // Apply theme to document
            if (typeof window !== 'undefined') {
              const root = window.document.documentElement;
              root.classList.remove('light', 'dark');

              if (theme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                  ? 'dark'
                  : 'light';
                root.classList.add(systemTheme);
              } else {
                root.classList.add(theme);
              }
            }
          }),
      })),
      {
        name: 'contacto-ui-storage',
        partialize: (state) => ({
          isSidebarCollapsed: state.isSidebarCollapsed,
          theme: state.theme,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

/**
 * Cart Store
 * RED TEAM: Test negative quantities, price manipulation, calculation overflow
 */
export const useCartStore = create<CartState & CartActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        items: [],
        customerId: undefined,
        discount: 0,
        notes: '',

        // Add item to cart
        addItem: (item) =>
          set((state) => {
            const existingItem = state.items.find((i) => i.productId === item.productId);

            if (existingItem) {
              existingItem.quantity += 1;
            } else {
              state.items.push({ ...item, quantity: 1 });
            }
          }),

        // Remove item from cart
        removeItem: (productId) =>
          set((state) => {
            state.items = state.items.filter((item) => item.productId !== productId);
          }),

        // Update item quantity
        updateQuantity: (productId, quantity) =>
          set((state) => {
            const item = state.items.find((i) => i.productId === productId);
            if (item) {
              // Validate quantity
              const validQuantity = Math.max(0, Math.min(quantity, 9999));

              if (validQuantity === 0) {
                state.items = state.items.filter((i) => i.productId !== productId);
              } else {
                item.quantity = validQuantity;
              }
            }
          }),

        // Update item discount
        updateDiscount: (productId, discount) =>
          set((state) => {
            const item = state.items.find((i) => i.productId === productId);
            if (item) {
              // Validate discount (0-100%)
              item.discount = Math.max(0, Math.min(discount, 100));
            }
          }),

        // Set customer
        setCustomer: (customerId) =>
          set((state) => {
            state.customerId = customerId;
          }),

        // Set cart-wide discount
        setCartDiscount: (discount) =>
          set((state) => {
            // Validate discount (0-100%)
            state.discount = Math.max(0, Math.min(discount, 100));
          }),

        // Set notes
        setNotes: (notes) =>
          set((state) => {
            state.notes = notes;
          }),

        // Clear cart
        clearCart: () =>
          set((state) => {
            state.items = [];
            state.customerId = undefined;
            state.discount = 0;
            state.notes = '';
          }),

        // Calculate subtotal (before discounts and tax)
        getSubtotal: () => {
          const { items } = get();
          return items.reduce((total, item) => {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = item.discount ? (itemTotal * item.discount) / 100 : 0;
            return total + (itemTotal - itemDiscount);
          }, 0);
        },

        // Calculate total tax
        getTotalTax: () => {
          const { items } = get();
          return items.reduce((total, item) => {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = item.discount ? (itemTotal * item.discount) / 100 : 0;
            const afterDiscount = itemTotal - itemDiscount;
            const tax = item.taxRate ? (afterDiscount * item.taxRate) / 100 : 0;
            return total + tax;
          }, 0);
        },

        // Calculate final total
        getTotal: () => {
          const { discount } = get();
          const subtotal = get().getSubtotal();
          const cartDiscount = discount ? (subtotal * discount) / 100 : 0;
          const afterCartDiscount = subtotal - cartDiscount;
          const tax = get().getTotalTax();
          return afterCartDiscount + tax;
        },
      })),
      {
        name: 'contacto-cart-storage',
        partialize: (state) => ({
          items: state.items,
          customerId: state.customerId,
          discount: state.discount,
          notes: state.notes,
        }),
      }
    ),
    { name: 'CartStore' }
  )
);

/**
 * User Preferences Store
 */
interface UserPreferences {
  language: 'fr' | 'ar' | 'en';
  currency: 'DZD';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  receiptPrintMode: 'auto' | 'manual';
  lowStockAlerts: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
}

interface UserPreferencesActions {
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  language: 'fr',
  currency: 'DZD',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  receiptPrintMode: 'manual',
  lowStockAlerts: true,
  emailNotifications: true,
  soundEnabled: true,
};

export const usePreferencesStore = create<UserPreferences & UserPreferencesActions>()(
  persist(
    (set) => ({
      ...defaultPreferences,

      updatePreference: (key, value) =>
        set((state) => ({
          ...state,
          [key]: value,
        })),

      resetPreferences: () => set(defaultPreferences),
    }),
    {
      name: 'contacto-preferences-storage',
    }
  )
);