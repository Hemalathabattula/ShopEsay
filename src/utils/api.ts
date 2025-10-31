// API utility for making requests to the backend
const API_BASE_URL = 'http://localhost:5000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status}`, data);
        return {
          success: false,
          message: data.message || `HTTP ${response.status}`,
          errors: data.errors
        };
      }

      console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);
      return data;
    } catch (error) {
      console.error(`❌ Network Error:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // HTTP Methods
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth specific methods
  async login(email: string, password: string) {
    return this.post('/api/auth/login', { email, password });
  }

  async sellerLogin(email: string, password: string) {
    return this.post('/api/auth/seller/login', { email, password });
  }

  async adminLogin(adminId: string, password: string) {
    return this.post('/api/admin/login', { adminId, password });
  }

  async register(userData: any) {
    return this.post('/api/auth/register', userData);
  }

  async sellerRegister(userData: any) {
    return this.post('/api/auth/seller/register', userData);
  }

  async getCurrentUser() {
    return this.get('/api/auth/me');
  }

  async getCustomerProfile() {
    return this.get('/api/customer/profile');
  }

  async updateCustomerProfile(data: any) {
    return this.put('/api/customer/profile', data);
  }

  async getSellerProfile() {
    return this.get('/api/seller/profile');
  }

  async updateSellerProfile(data: any) {
    return this.put('/api/seller/profile', data);
  }

  async logout() {
    return this.post('/api/auth/logout');
  }

  async forgotPassword(email: string) {
    return this.post('/api/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string) {
    return this.post('/api/auth/reset-password', { token, password });
  }

  // Seller Product methods
  async getSellerProducts() {
    return this.get('/api/seller/products');
  }

  async createSellerProduct(productData: any) {
    return this.post('/api/seller/products', productData);
  }

  async updateSellerProduct(productId: string, productData: any) {
    return this.put(`/api/seller/products/${productId}`, productData);
  }

  async deleteSellerProduct(productId: string) {
    return this.delete(`/api/seller/products/${productId}`);
  }

  // Seller Order methods
  async getSellerOrders() {
    return this.get('/api/seller/orders');
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.put(`/api/seller/orders/${orderId}/status`, { status });
  }

  // Product methods
  async getProducts(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.get(`/api/products${queryString}`);
  }

  async getProduct(id: string) {
    return this.get(`/api/products/${id}`);
  }

  // Cart methods
  async getCart() {
    return this.get('/api/cart');
  }

  async addToCart(productId: string, quantity: number, variant?: any) {
    return this.post('/api/cart/add', { productId, quantity, variant });
  }

  async updateCartItem(itemId: string, quantity: number) {
    return this.patch(`/api/cart/items/${itemId}`, { quantity });
  }

  async removeFromCart(itemId: string) {
    return this.delete(`/api/cart/items/${itemId}`);
  }

  // Wishlist methods
  async getWishlist() {
    return this.get('/api/wishlist');
  }

  async addToWishlist(productId: string) {
    return this.post('/api/wishlist/add', { productId });
  }

  async removeFromWishlist(productId: string) {
    return this.delete(`/api/wishlist/remove/${productId}`);
  }

  // Order methods
  async getOrders() {
    return this.get('/api/orders');
  }

  async getOrder(id: string) {
    return this.get(`/api/orders/${id}`);
  }

  async createOrder(orderData: any) {
    return this.post('/api/orders', orderData);
  }

  // Payment methods
  async createPayPalOrder(orderData: any) {
    return this.post('/api/payments/paypal/create-order', { orderData });
  }

  async capturePayPalOrder(orderId: string) {
    return this.post('/api/payments/paypal/capture', { orderId });
  }
}

// Create and export a singleton instance
export const api = new ApiClient();

// Export the class for custom instances if needed
export { ApiClient };

// Export types
export type { ApiResponse };
