import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../utils/api';

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  images?: string[] | Array<{ url: string; alt?: string; isPrimary?: boolean }>;
}

interface WishlistState {
  items: WishlistItem[];
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  addItem: (item: WishlistItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  isItemInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      fetchWishlist: async () => {
        try {
          const response = await api.getWishlist();
          if (response.success && response.data) {
            set({ items: response.data.products || response.data || [] });
          }
        } catch (error) {
          console.warn('Failed to fetch wishlist:', error);
          // Keep existing items on error
        }
      },
      addToWishlist: async (productId) => {
        try {
          const response = await api.addToWishlist(productId);
          if (response.success) {
            get().fetchWishlist();
          }
        } catch (error) {
          console.warn('Failed to add to wishlist:', error);
        }
      },
      removeFromWishlist: async (productId) => {
        try {
          const response = await api.removeFromWishlist(productId);
          if (response.success) {
            get().fetchWishlist();
          }
        } catch (error) {
          console.warn('Failed to remove from wishlist:', error);
        }
      },
      addItem: async (item) => {
        // Add item locally and sync with API
        const currentItems = get().items;
        if (!currentItems.some(existingItem => existingItem.productId === item.productId)) {
          set({ items: [...currentItems, item] });
          // Try to sync with API
          try {
            await api.addToWishlist(item.productId);
          } catch (error) {
            console.warn('Failed to sync wishlist with server:', error);
          }
        }
      },
      removeItem: async (productId) => {
        // Remove item locally and sync with API
        const currentItems = get().items;
        set({ items: currentItems.filter(item => item.productId !== productId) });
        // Try to sync with API
        try {
          await api.removeFromWishlist(productId);
        } catch (error) {
          console.warn('Failed to sync wishlist removal with server:', error);
        }
      },
      isInWishlist: (productId) => {
        return get().items.some((item) => item.productId === productId || item.id === productId);
      },
      isItemInWishlist: (productId) => {
        return get().items.some((item) => item.productId === productId || item.id === productId);
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
