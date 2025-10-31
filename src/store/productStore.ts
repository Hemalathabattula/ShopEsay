import { create } from 'zustand';
import { api } from '../utils/api';

// Mock products for fallback
const getMockProducts = (): Product[] => [
  {
    id: '1',
    name: 'Classic Cotton T-Shirt',
    title: 'Classic Cotton T-Shirt',
    price: 29.99,
    basePrice: 29.99,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
    category: 'clothing',
    description: 'Comfortable cotton t-shirt perfect for everyday wear',
    rating: 4.5,
    ratingCount: 128,
    variants: [
      { size: 'S', color: 'White', stock: 10, price: 29.99 },
      { size: 'M', color: 'White', stock: 15, price: 29.99 },
      { size: 'L', color: 'Black', stock: 8, price: 29.99 }
    ]
  },
  {
    id: '2',
    name: 'Denim Jacket',
    title: 'Denim Jacket',
    price: 79.99,
    basePrice: 79.99,
    images: ['https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400'],
    category: 'clothing',
    description: 'Stylish denim jacket for a casual look',
    rating: 4.2,
    ratingCount: 89,
    variants: [
      { size: 'M', color: 'Blue', stock: 12, price: 79.99 },
      { size: 'L', color: 'Blue', stock: 6, price: 79.99 }
    ]
  },
  {
    id: '3',
    name: 'Sneakers',
    title: 'Sneakers',
    price: 99.99,
    basePrice: 99.99,
    images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'],
    category: 'shoes',
    description: 'Comfortable sneakers for daily activities',
    rating: 4.7,
    ratingCount: 203,
    variants: [
      { size: '9', color: 'White', stock: 20, price: 99.99 },
      { size: '10', color: 'Black', stock: 15, price: 99.99 }
    ]
  },
  {
    id: '4',
    name: 'Leather Handbag',
    title: 'Leather Handbag',
    price: 149.99,
    basePrice: 149.99,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
    category: 'bags',
    description: 'Elegant leather handbag for professional use',
    rating: 4.8,
    ratingCount: 156,
    variants: [
      { size: 'One Size', color: 'Brown', stock: 8, price: 149.99 },
      { size: 'One Size', color: 'Black', stock: 12, price: 149.99 }
    ]
  }
];

export interface Product {
  id: string;
  name: string;
  title?: string;
  price: number;
  basePrice?: number;
  images: string[] | Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  category: string;
  description: string;
  sizes?: string[];
  colors?: string[];
  rating?: number;
  ratingCount?: number;
  seller?: {
    id: string;
    storeName: string;
  };
  variants?: Array<{
    size: string;
    color: string;
    stock: number;
    price: number;
  }>;
}

interface ProductState {
  products: Product[];
  allProducts: Product[];
  featuredProducts: Product[];
  searchQuery: string;
  filters: {
    category: string;
    priceRange: [number, number];
    sizes: string[];
    colors: string[];
    rating: number;
  };
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<ProductState['filters']>) => void;
  fetchAllProducts: () => Promise<void>;
  fetchSellerProducts: () => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  addProduct: (productData: any) => Promise<void>;
  updateProduct: (productId: string, productData: any) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}

export const useProductStore = create<ProductState>()(
  (set, get) => ({
    products: [],
    allProducts: [],
    featuredProducts: [],
    searchQuery: '',
    filters: {
      category: '',
      priceRange: [0, 500],
      sizes: [],
      colors: [],
      rating: 0,
    },
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilters: (newFilters) =>
      set((state) => ({ filters: { ...state.filters, ...newFilters } })),
    fetchAllProducts: async () => {
      try {
        const response = await api.getProducts();
        if (response.success && response.data) {
          const products = (response.data.products || response.data).map((product: any) => ({
            ...product,
            id: product._id || product.id,
            name: product.title || product.name,
            price: product.basePrice || product.price
          }));
          set({ allProducts: products });
        } else {
          // Fallback to mock data if API fails
          set({ allProducts: getMockProducts() });
        }
      } catch (error) {
        console.error('Failed to fetch all products:', error);
        // Fallback to mock data
        set({ allProducts: getMockProducts() });
      }
    },
    fetchFeaturedProducts: async () => {
      try {
        const response = await api.getProducts({ limit: 4, sort: 'popularity' });
        if (response.success && response.data) {
          const products = (response.data.products || response.data).map((product: any) => ({
            ...product,
            id: product._id || product.id,
            name: product.title || product.name,
            price: product.basePrice || product.price
          }));
          set({ featuredProducts: products });
        } else {
          // Fallback to mock data if API fails
          set({ featuredProducts: getMockProducts() });
        }
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
        // Fallback to mock data
        set({ featuredProducts: getMockProducts() });
      }
    },
    fetchSellerProducts: async () => {
      try {
        const response = await api.getSellerProducts();
        if (response.success && response.data) {
          set({ products: response.data });
        } else {
          console.warn('Failed to fetch seller products:', response.message);
          set({ products: [] });
        }
      } catch (error) {
        console.error('Error fetching seller products:', error);
        set({ products: [] });
      }
    },
    addProduct: async (productData) => {
      const response = await api.createSellerProduct(productData);
      if (response.success) {
        get().fetchSellerProducts();
        return response;
      } else {
        throw new Error(response.message || 'Failed to create product');
      }
    },
    updateProduct: async (productId, productData) => {
      const response = await api.updateSellerProduct(productId, productData);
      if (response.success) {
        get().fetchSellerProducts();
      }
    },
    deleteProduct: async (productId) => {
      const response = await api.deleteSellerProduct(productId);
      if (response.success) {
        get().fetchSellerProducts();
      }
    },
  })
);
