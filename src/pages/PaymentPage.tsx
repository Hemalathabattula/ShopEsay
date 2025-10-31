import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Truck, CheckCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { addOrder } = useOrderStore();
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('');

  // Get shipping details from localStorage
  const shippingDetails = JSON.parse(localStorage.getItem('shippingDetails') || '{}');

  const paymentOptions = [
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'Pay using UPI apps',
      subOptions: ['PhonePe', 'Paytm', 'Google Pay', 'BHIM UPI']
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: Truck,
      description: 'Pay when you receive the order'
    }
  ];

  const handlePaymentSelect = (paymentId: string) => {
    setSelectedPayment(paymentId);
  };

  const handlePlaceOrder = async () => {
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create the order
      const tax = total * 0.08;
      const shipping = selectedPayment === 'cod' ? 50 : 0; // Extra fee for COD
      const finalTotal = total + tax + shipping;

      const orderData = {
        userId: user?.id || 'guest',
        userEmail: shippingDetails.email,
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
        total: finalTotal,
        tax,
        shipping,
        status: 'Order placed' as const,
        shippingAddress: shippingDetails,
        paymentInfo: {
          cardNumber: '',
          expiryDate: '',
          cardName: '',
        },
      };

      // Add order to store
      addOrder(orderData);

      // Clear cart after successful order
      clearCart();

      // Clear shipping details
      localStorage.removeItem('shippingDetails');

      toast.success('Order placed successfully!');

      // Navigate to order confirmation
      navigate('/order-confirmation');
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No items in cart</h1>
          <button
            onClick={() => navigate('/products')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Method</h1>
        <p className="text-gray-600">Choose your preferred payment method</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Options */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.id}
                  className={`bg-white rounded-2xl shadow-sm p-6 cursor-pointer transition-all ${
                    selectedPayment === option.id
                      ? 'ring-2 ring-purple-500 bg-purple-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handlePaymentSelect(option.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${
                      selectedPayment === option.id ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        selectedPayment === option.id ? 'text-purple-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{option.name}</h3>
                      <p className="text-gray-600">{option.description}</p>
                      {option.subOptions && selectedPayment === option.id && (
                        <div className="mt-3 space-y-2">
                          {option.subOptions.map((subOption) => (
                            <label key={subOption} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="upiOption"
                                value={subOption}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700">{subOption}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedPayment === option.id && (
                      <CheckCircle className="h-6 w-6 text-purple-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <button
              onClick={handlePlaceOrder}
              disabled={loading || !selectedPayment}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6 h-fit">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">
                    {item.size} • {item.color} • Qty: {item.quantity}
                  </p>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold">
                {selectedPayment === 'cod' ? '$50.00' : 'Free'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-semibold">${(total * 0.08).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-lg font-semibold text-gray-900">
                ${(total + (total * 0.08) + (selectedPayment === 'cod' ? 50 : 0)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</h3>
            <p className="text-sm text-gray-600">
              {shippingDetails.firstName} {shippingDetails.lastName}<br />
              {shippingDetails.address}<br />
              {shippingDetails.city}, {shippingDetails.state} {shippingDetails.zipCode}<br />
              {shippingDetails.country}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
