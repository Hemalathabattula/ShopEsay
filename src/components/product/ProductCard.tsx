import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Zap } from 'lucide-react';
import type { Product } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/priceFormatter';

type ProductCardProps = {
  product: Product;
  onQuickView?: () => void;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const navigate = useNavigate();
  const { addItem, clearCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isItemInWishlist } = useWishlistStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    // Get available sizes and colors from variants or fallback to defaults
    const availableSizes = product.variants?.map((v: any) => v.size) || product.sizes || ['M'];
  const availableColors = product.variants?.map((v: { color: string }) => v.color) || product.colors || ['Black'];

    addItem({
      productId: product.id,
      name: product.name || product.title || 'Product',
      price: product.price || product.basePrice || 0,
      image: typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url || '',
      size: availableSizes[0],
      color: availableColors[0],
      quantity: 1,
    });
    toast.success('Added to cart!');
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();

    // Clear cart first
    clearCart();

    // Get available sizes and colors from variants or fallback to defaults
    const availableSizes = product.variants?.map((v: any) => v.size) || product.sizes || ['M'];
    const availableColors = product.variants?.map((v: { color: string }) => v.color) || product.colors || ['Black'];

    // Add the product to cart
    addItem({
      productId: product.id,
      name: product.name || product.title || 'Product',
      price: product.price || product.basePrice || 0,
      image: typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url || '',
      size: availableSizes[0],
      color: availableColors[0],
      quantity: 1,
    });

    // Navigate to shipping details
    navigate('/shipping-details');
    toast.success('Proceeding to checkout!');
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isItemInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        id: Date.now().toString(),
        productId: product.id,
        name: product.name || product.title || 'Product',
        price: product.price || product.basePrice || 0,
        image: typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url || '',
      });
      toast.success('Added to wishlist');
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative overflow-hidden rounded-t-2xl">
        <img
          src={
            product.images && product.images.length > 0
              ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url)
              : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center'
          }
          alt={product.name || product.title || 'Product'}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            NEW
          </span>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-4 flex  space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleWishlistToggle}
            className={`p-1.5 rounded-full transition-colors shadow-sm ${
              isItemInWishlist(product.id)
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-red-500 hover:text-white'
            }`}
          >
            <Heart className="h-4 w-5" fill={isItemInWishlist(product.id) ? 'currentColor' : 'none'} />
          </button>
          {onQuickView && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView();
              }}
              className="px-3 py-1.5 rounded-full bg-white text-purple-600 hover:bg-purple-100 transition-colors border border-purple-200 text-sm font-medium shadow-sm"
            >
              Quick View
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
          <button
            onClick={handleBuyNow}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-full hover:from-orange-600 hover:to-red-600 transition-colors flex items-center justify-center space-x-2 font-semibold"
          >
            <Zap className="h-4 w-4" />
            <span>Buy Now</span>
          </button>
          <button
            onClick={handleAddToCart}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-full hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>

      <Link to={`/product/${product.id}`} className="block p-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
            {product.name || product.title || 'Product'}
          </h3>

          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating || 4)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({product.ratingCount || 0})</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-gray-900">${formatPrice(product.price || product.basePrice || 0)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(product.variants?.map((v: { color: string }) => v.color) || product.colors || ['Black']).slice(0, 4).map((color: string, index: number) => (
              <div
                key={`${color}-${index}`}
                className={`w-6 h-6 rounded-full border-2 border-gray-300 ${getColorClass(color)}`}
              ></div>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
};

const getColorClass = (color: string) => {
  const colorMap: { [key: string]: string } = {
    white: 'bg-white',
    black: 'bg-black',
    navy: 'bg-blue-900',
    gray: 'bg-gray-500',
    'dark-blue': 'bg-blue-800',
    'light-blue': 'bg-blue-300',
    charcoal: 'bg-gray-800',
    'floral-blue': 'bg-blue-400',
    'floral-pink': 'bg-pink-400',
    'solid-white': 'bg-white',
  };
  return colorMap[color] || 'bg-gray-400';
};

export default ProductCard;