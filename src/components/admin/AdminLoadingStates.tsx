import React from 'react';
import { Loader2, Shield, BarChart3, Users, Package, DollarSign, Activity } from 'lucide-react';

// Generic loading spinner
export const AdminSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={`animate-spin text-purple-600 ${sizeClasses[size]} ${className}`} />
  );
};

// Full page loading for admin routes
export const AdminPageLoading: React.FC<{ message?: string }> = ({ 
  message = 'Loading admin panel...' 
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="relative">
          <Shield className="w-12 h-12 text-purple-600" />
          <div className="absolute -top-1 -right-1">
            <AdminSpinner size="sm" />
          </div>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Fashion Era Admin</h2>
      <p className="text-gray-600 mb-4">{message}</p>
      <div className="flex justify-center">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  </div>
);

// Dashboard loading skeleton
export const AdminDashboardLoading: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Header skeleton */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
    </div>

    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      ))}
    </div>

    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>

    {/* Table skeleton */}
    <div className="bg-white rounded-lg shadow animate-pulse">
      <div className="p-6 border-b">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
      </div>
      <div className="p-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-3 border-b last:border-b-0">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Table loading skeleton
export const AdminTableLoading: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {/* Table header */}
    <div className="bg-gray-50 px-6 py-3 border-b">
      <div className="flex space-x-4">
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${100/columns}%` }}></div>
        ))}
      </div>
    </div>
    
    {/* Table rows */}
    <div className="divide-y divide-gray-200">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="flex space-x-4">
            {[...Array(columns)].map((_, j) => (
              <div key={j} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${100/columns}%` }}></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Card loading skeleton
export const AdminCardLoading: React.FC<{ title?: boolean; content?: boolean }> = ({ 
  title = true, 
  content = true 
}) => (
  <div className="bg-white p-6 rounded-lg shadow animate-pulse">
    {title && <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>}
    {content && (
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )}
  </div>
);

// Form loading skeleton
export const AdminFormLoading: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <div className="bg-white p-6 rounded-lg shadow animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
    <div className="space-y-6">
      {[...Array(fields)].map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      <div className="flex space-x-4 pt-4">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  </div>
);

// Analytics loading with specific icons
export const AdminAnalyticsLoading: React.FC = () => (
  <div className="space-y-6">
    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { icon: DollarSign, label: 'Revenue' },
        { icon: Users, label: 'Users' },
        { icon: Package, label: 'Products' },
        { icon: Activity, label: 'Activity' }
      ].map((item, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <item.icon className="w-8 h-8 text-gray-300" />
            <AdminSpinner size="sm" />
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Chart Loading */}
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        <AdminSpinner />
      </div>
      <div className="h-80 bg-gray-100 rounded flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Loading analytics data...</p>
        </div>
      </div>
    </div>
  </div>
);

// Button loading state
export const AdminButtonLoading: React.FC<{ 
  children: React.ReactNode; 
  loading?: boolean; 
  className?: string;
  disabled?: boolean;
}> = ({ children, loading = false, className = '', disabled = false }) => (
  <button 
    className={`flex items-center justify-center gap-2 ${className}`}
    disabled={loading || disabled}
  >
    {loading && <AdminSpinner size="sm" />}
    {children}
  </button>
);

// Search loading state
export const AdminSearchLoading: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <div className="text-center">
      <AdminSpinner size="lg" className="mb-4" />
      <p className="text-gray-600">Searching...</p>
    </div>
  </div>
);

// Empty state with loading option
export const AdminEmptyState: React.FC<{ 
  title: string; 
  description: string; 
  icon?: React.ReactNode;
  loading?: boolean;
  action?: React.ReactNode;
}> = ({ title, description, icon, loading = false, action }) => (
  <div className="text-center py-12">
    <div className="flex justify-center mb-4">
      {loading ? <AdminSpinner size="lg" /> : (icon || <Package className="w-12 h-12 text-gray-400" />)}
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
    {action && !loading && action}
  </div>
);

// Connection status indicator
export const AdminConnectionStatus: React.FC<{ 
  connected: boolean; 
  reconnecting?: boolean;
}> = ({ connected, reconnecting = false }) => (
  <div className="flex items-center gap-2 text-sm">
    <div className={`w-2 h-2 rounded-full ${
      reconnecting ? 'bg-yellow-500 animate-pulse' : 
      connected ? 'bg-green-500' : 'bg-red-500'
    }`}></div>
    <span className="text-gray-600">
      {reconnecting ? 'Reconnecting...' : connected ? 'Connected' : 'Disconnected'}
    </span>
    {reconnecting && <AdminSpinner size="sm" />}
  </div>
);
