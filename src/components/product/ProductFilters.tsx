import React from 'react';
import { useProductStore } from '../../store/productStore';

const ProductFilters = () => {
  const { filters, setFilters } = useProductStore();

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'shoes', label: 'Shoes' },
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = [
    { value: 'white', label: 'White', class: 'bg-white border-gray-300' },
    { value: 'black', label: 'Black', class: 'bg-black' },
    { value: 'gray', label: 'Gray', class: 'bg-gray-500' },
    { value: 'navy', label: 'Navy', class: 'bg-blue-900' },
    { value: 'dark-blue', label: 'Dark Blue', class: 'bg-blue-800' },
    { value: 'light-blue', label: 'Light Blue', class: 'bg-blue-300' },
  ];

  const handleSizeToggle = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size];
    setFilters({ sizes: newSizes });
  };

  const handleColorToggle = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    setFilters({ colors: newColors });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Filters</h3>

      {/* Category */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Category</h4>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ category: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="500"
            value={filters.priceRange[1]}
            onChange={(e) => setFilters({ priceRange: [0, parseInt(e.target.value)] })}
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>$0</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Sizes</h4>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => handleSizeToggle(size)}
              className={`py-2 px-3 border rounded-lg text-sm font-medium transition-colors ${
                filters.sizes.includes(size)
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-600'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Colors</h4>
        <div className="grid grid-cols-4 gap-3">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorToggle(color.value)}
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                filters.colors.includes(color.value)
                  ? 'border-purple-600 scale-110'
                  : 'border-gray-300 hover:border-purple-400'
              } ${color.class}`}
              title={color.label}
            >
              {filters.colors.includes(color.value) && (
                <div className="w-full h-full rounded-full border-2 border-white bg-black bg-opacity-20 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Minimum Rating</h4>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setFilters({ rating: filters.rating === rating ? 0 : rating })}
              className={`flex items-center space-x-2 w-full text-left py-1 px-2 rounded transition-colors ${
                filters.rating === rating ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm">& Up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => setFilters({
          category: '',
          priceRange: [0, 500],
          sizes: [],
          colors: [],
          rating: 0,
        })}
        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default ProductFilters;