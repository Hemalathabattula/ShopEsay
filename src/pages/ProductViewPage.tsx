import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/20/solid';
import { Zap } from 'lucide-react';
import { useProductStore, Product } from '../store/productStore';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const ProductViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allProducts, fetchAllProducts } = useProductStore();
  const { addItem, clearCart } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      if (allProducts.length === 0) {
        await fetchAllProducts();
      }
    };
    loadProducts();
  }, [fetchAllProducts, allProducts.length]);

  useEffect(() => {
    if (allProducts.length > 0 && id) {
      const foundProduct = allProducts.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
        // Set default selections
        if (foundProduct.colors && foundProduct.colors.length > 0) {
          setSelectedColor(foundProduct.colors[0]);
        }
        if (foundProduct.sizes && foundProduct.sizes.length > 0) {
          setSelectedSize(foundProduct.sizes[0]);
        } else if (foundProduct.variants && foundProduct.variants.length > 0) {
          setSelectedSize(foundProduct.variants[0].size);
        }
      }
    }
  }, [allProducts, id]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      productId: product.id,
      name: product.name || product.title || 'Product',
      price: product.price || product.basePrice || 0,
      image: typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url || '',
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
    });
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    if (!product) return;

    // Clear cart first
    clearCart();

    // Add the product to cart
    addItem({
      productId: product.id,
      name: product.name || product.title || 'Product',
      price: product.price || product.basePrice || 0,
      image: typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url || '',
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
    });

    // Navigate to checkout
    navigate('/checkout');
    toast.success('Proceeding to checkout!');
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      white: 'bg-white border-gray-300',
      black: 'bg-gray-900',
      navy: 'bg-blue-900',
      gray: 'bg-gray-500',
      'dark-blue': 'bg-blue-800',
      'light-blue': 'bg-blue-300',
      charcoal: 'bg-gray-800',
      'floral-blue': 'bg-blue-400',
      'floral-pink': 'bg-pink-400',
      'solid-white': 'bg-white border-gray-300',
    };
    return colorMap[color.toLowerCase()] || 'bg-gray-400';
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  const productImages = product.images || [];
  const availableColors = product.colors || product.variants?.map(v => v.color) || [];
  const availableSizes = product.sizes || product.variants?.map(v => v.size) || [];

  return (
    <div className="bg-white">
      <div className="pt-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol role="list" className="mx-auto flex max-w-2xl items-center space-x-2 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <li>
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/products')}
                  className="mr-2 text-sm font-medium text-gray-900 hover:text-purple-600"
                >
                  Products
                </button>
                <svg
                  fill="currentColor"
                  width={16}
                  height={20}
                  viewBox="0 0 16 20"
                  aria-hidden="true"
                  className="h-5 w-4 text-gray-300"
                >
                  <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                </svg>
              </div>
            </li>
            <li className="text-sm">
              <span className="font-medium text-gray-500">{product.name}</span>
            </li>
          </ol>
        </nav>

        {/* Image gallery */}
        <div className="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-8 lg:px-8">
          {/* Main image */}
          <div className="lg:col-span-2">
            <img
              alt={product.name}
              src={
                productImages.length > 0
                  ? (typeof productImages[selectedImage] === 'string'
                      ? productImages[selectedImage]
                      : productImages[selectedImage]?.url)
                  : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=800&fit=crop&crop=center'
              }
              className="aspect-3/4 w-full rounded-lg object-cover"
            />
          </div>

          {/* Thumbnail images */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-4">
              {productImages.slice(0, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={classNames(
                    selectedImage === index ? 'ring-2 ring-purple-600' : 'ring-1 ring-gray-300',
                    'aspect-square w-full rounded-lg overflow-hidden'
                  )}
                >
                  <img
                    alt={`${product.name} ${index + 1}`}
                    src={typeof image === 'string' ? image : image?.url}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product info */}
        <div className="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:px-8 lg:pt-16 lg:pb-24">
          <div className="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{product.name}</h1>
          </div>

          {/* Options */}
          <div className="mt-4 lg:row-span-3 lg:mt-0">
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl tracking-tight text-gray-900">${(product.price || product.basePrice || 0).toFixed(4)}</p>

            {/* Reviews */}
            <div className="mt-6">
              <h3 className="sr-only">Reviews</h3>
              <div className="flex items-center">
                <div className="flex items-center">
                  {[0, 1, 2, 3, 4].map((rating) => (
                    <StarIcon
                      key={rating}
                      aria-hidden="true"
                      className={classNames(
                        (product.rating || 0) > rating ? 'text-yellow-400' : 'text-gray-200',
                        'size-5 shrink-0',
                      )}
                    />
                  ))}
                </div>
                <p className="sr-only">{product.rating || 0} out of 5 stars</p>
                <span className="ml-3 text-sm font-medium text-gray-600">
                  {product.ratingCount || 0} reviews
                </span>
              </div>
            </div>

            <form className="mt-10" onSubmit={(e) => { e.preventDefault(); handleAddToCart(); }}>
              {/* Colors */}
              {availableColors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Color</h3>
                  <fieldset aria-label="Choose a color" className="mt-4">
                    <div className="flex items-center gap-x-3">
                      {availableColors.map((color) => (
                        <label
                          key={color}
                          className={classNames(
                            selectedColor === color
                              ? 'ring-2 ring-purple-600 ring-offset-2'
                              : 'ring-1 ring-gray-300 hover:ring-purple-400',
                            'relative cursor-pointer rounded-full p-1 transition-all'
                          )}
                        >
                          <input
                            type="radio"
                            name="color"
                            value={color}
                            checked={selectedColor === color}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="sr-only"
                          />
                          <div
                            className={classNames(
                              getColorClass(color),
                              'size-8 rounded-full border-2 border-white shadow-sm'
                            )}
                            title={color}
                          />
                          {selectedColor === color && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="size-2 rounded-full bg-white shadow-sm"></div>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}

              {/* Sizes */}
              {availableSizes.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Size</h3>
                    <a href="#" className="text-sm font-medium text-purple-600 hover:text-purple-500">
                      Size guide
                    </a>
                  </div>
                  <fieldset aria-label="Choose a size" className="mt-4">
                    <div className="grid grid-cols-4 gap-3">
                      {availableSizes.map((size) => (
                        <label
                          key={size}
                          className={classNames(
                            selectedSize === size
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-gray-300 bg-white text-gray-900 hover:border-purple-400',
                            'relative cursor-pointer flex items-center justify-center rounded-md border p-3 text-sm font-medium uppercase transition-colors'
                          )}
                        >
                          <input
                            type="radio"
                            name="size"
                            value={size}
                            checked={selectedSize === size}
                            onChange={(e) => setSelectedSize(e.target.value)}
                            className="sr-only"
                          />
                          {size}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}

              <div className="mt-10 space-y-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:from-orange-600 hover:to-red-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-hidden"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Buy Now
                </button>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-hidden"
                >
                  Add to bag
                </button>
              </div>
            </form>
          </div>

          <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-gray-200 lg:pt-6 lg:pr-8 lg:pb-16">
            {/* Description and details */}
            <div>
              <h3 className="text-sm font-medium text-gray-900">Description</h3>
              <div className="mt-4">
                <p className="text-base text-gray-900">{product.description}</p>
              </div>
            </div>

            <div className="mt-10">
              <h3 className="text-sm font-medium text-gray-900">Highlights</h3>
              <div className="mt-4">
                <ul role="list" className="list-disc space-y-2 pl-4 text-sm">
                  <li className="text-gray-400">
                    <span className="text-gray-600">Premium quality materials</span>
                  </li>
                  <li className="text-gray-400">
                    <span className="text-gray-600">Comfortable fit</span>
                  </li>
                  <li className="text-gray-400">
                    <span className="text-gray-600">Durable construction</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-sm font-medium text-gray-900">Details</h2>
              <div className="mt-4 space-y-6">
                <p className="text-sm text-gray-600">
                  This product is made with high-quality materials and attention to detail.
                  Perfect for everyday use and special occasions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductViewPage;
