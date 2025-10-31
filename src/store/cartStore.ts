import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(
          (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
        );

        if (existingItem) {
          get().updateQuantity(existingItem.id, existingItem.quantity + item.quantity);
        } else {
          const newItem: CartItem = {
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          };
          set((state) => ({
            items: [...state.items, newItem],
            total: state.total + newItem.price * newItem.quantity,
          }));
        }
      },

      removeItem: (id) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          return {
            items: state.items.filter((i) => i.id !== id),
            total: state.total - (item ? item.price * item.quantity : 0),
          };
        });
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          const newItems = state.items.map((item) => {
            if (item.id === id) {
              return { ...item, quantity };
            }
            return item;
          });
          
          const newTotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          
          return {
            items: newItems,
            total: newTotal,
          };
        });
      },

      clearCart: () => {
        set({ items: [], total: 0 });
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);