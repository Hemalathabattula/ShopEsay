import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

interface AdminRealtimeData {
  dashboardData: any;
  securityAlerts: any[];
  orderUpdates: any[];
  financialUpdates: any[];
  analyticsData: any;
  userActivity: any[];
  systemHealth: any;
  connectionStats: any;
}

interface UseAdminRealtimeReturn {
  data: AdminRealtimeData;
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => void;
  subscribeToAnalytics: () => void;
  subscribeToSecurity: () => void;
  subscribeToOrders: () => void;
  subscribeToFinances: () => void;
  requestDashboardUpdate: () => void;
}

export const useAdminRealtime = (): UseAdminRealtimeReturn => {
  const { user, token } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const [data, setData] = useState<AdminRealtimeData>({
    dashboardData: {
      totalUsers: 12847,
      totalOrders: 1284,
      totalRevenue: 89420,
      totalProducts: 2847
    },
    securityAlerts: [],
    orderUpdates: [],
    financialUpdates: [],
    analyticsData: {},
    userActivity: [],
    systemHealth: {},
    connectionStats: {}
  });

  const connectSocket = useCallback(() => {
    if (!user || !token || !user.role?.includes('ADMIN')) {
      return;
    }

    // Mock connection for demo purposes
    console.log('🔌 Mock admin connection established');
    setIsConnected(true);
    setConnectionError(null);
    reconnectAttempts.current = 0;

    // Simulate successful authentication
    setTimeout(() => {
      console.log('✅ Mock admin authentication successful');
      toast.success('Real-time connection established (Demo Mode)');
    }, 500);

    // Mock event handlers for demo
    const mockDashboardUpdate = () => {
      setData(prev => ({
        ...prev,
        dashboardData: {
          totalUsers: 12847 + Math.floor(Math.random() * 10),
          totalOrders: 1284 + Math.floor(Math.random() * 5),
          totalRevenue: 89420 + Math.floor(Math.random() * 1000),
          totalProducts: 2847
        }
      }));
    };

    // Simulate periodic updates
    const updateInterval = setInterval(mockDashboardUpdate, 30000); // Update every 30 seconds

    return () => {
      clearInterval(updateInterval);
    };

  }, [user, token]);

  useEffect(() => {
    if (user && token && user.role?.includes('ADMIN')) {
      const cleanup = connectSocket();
      return cleanup;
    }
  }, [connectSocket]);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    setConnectionError(null);
    connectSocket();
  }, [connectSocket]);

  const subscribeToAnalytics = useCallback(() => {
    console.log('📊 Subscribed to analytics (Demo Mode)');
  }, []);

  const subscribeToSecurity = useCallback(() => {
    console.log('🔒 Subscribed to security alerts (Demo Mode)');
  }, []);

  const subscribeToOrders = useCallback(() => {
    console.log('📦 Subscribed to order updates (Demo Mode)');
  }, []);

  const subscribeToFinances = useCallback(() => {
    console.log('💰 Subscribed to financial updates (Demo Mode)');
  }, []);

  const requestDashboardUpdate = useCallback(() => {
    console.log('🔄 Requesting dashboard update (Demo Mode)');
    // Simulate dashboard update
    setData(prev => ({
      ...prev,
      dashboardData: {
        totalUsers: 12847 + Math.floor(Math.random() * 10),
        totalOrders: 1284 + Math.floor(Math.random() * 5),
        totalRevenue: 89420 + Math.floor(Math.random() * 1000),
        totalProducts: 2847
      }
    }));
  }, []);

  return {
    data,
    isConnected,
    connectionError,
    reconnect,
    subscribeToAnalytics,
    subscribeToSecurity,
    subscribeToOrders,
    subscribeToFinances,
    requestDashboardUpdate
  };
};
