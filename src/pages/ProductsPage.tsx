import React, { useState, useEffect } from 'react';
import { Filter, Grid, List } from 'lucide-react';
import { useProductStore, Product } from '../store/productStore';
import ProductCard from '../components/product/ProductCard';
import ProductQuickView from '../components/product/ProductQuickView';
import ProductFilters from '../components/product/ProductFilters';

const ProductsPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const { allProducts, searchQuery, filters, fetchAllProducts } = useProductStore();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Fetch all products when component mounts
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      await fetchAllProducts();
      setLoading(false);
    };
    loadProducts();
  }, [fetchAllProducts]);

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  // Apply filters and search query
  const filteredProducts = allProducts.filter((product) => {
    // Filter by category
    if (filters.category && product.category !== filters.category) {
      return false;
    }
    // Filter by price range
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false;
    }
    // Filter by sizes
    if (filters.sizes.length > 0) {
      const productSizes = product.sizes || product.variants?.map(v => v.size) || [];
      if (!filters.sizes.some(size => productSizes.includes(size))) {
        return false;
      }
    }
    // Filter by colors
    if (filters.colors.length > 0) {
      const productColors = product.colors || product.variants?.map(v => v.color) || [];
      if (!filters.colors.some(color => productColors.includes(color))) {
        return false;
      }
    }
    // Filter by rating
    if (filters.rating > 0 && (product.rating || 0) < filters.rating) {
      return false;
    }
    // Filter by search query
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-gray-600">{filteredProducts.length} products found</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </button>
          
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0`}>
          <ProductFilters />
        </div>

        {/* Products Grid/List */}
        <div className="flex-1">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onQuickView={() => handleQuickView(product)} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-6">
                  <div className="flex gap-6">
                    <img
                      src={typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'}
                      alt={product.name}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-gray-600 mb-3">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(4)}</span>
                        <button
                          onClick={() => {
                            // Add to cart logic here
                            // Assuming useCartStore is imported and used
                            // For now, just a placeholder
                          }}
                          className="bg-purple-600 text-white px-4 py-1.5 rounded-full hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                          Add to Cart
                        </button>
                        <button className="ml-2 bg-gray-100 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors text-sm font-medium" onClick={() => handleQuickView(product)}>
                          Quick View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-gray-600">No products found matching your criteria.</p>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>

      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView product={quickViewProduct} open={true} onClose={closeQuickView} />
      )}
    </div>
  );
};

export default ProductsPage;