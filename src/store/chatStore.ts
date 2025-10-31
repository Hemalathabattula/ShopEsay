import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'BOT';
  message: string;
  timestamp: Date;
  isRead: boolean;
  messageType: 'text' | 'image' | 'file' | 'system';
}

export interface Chat {
  id: string;
  type: 'B2C' | 'B2B' | 'SUPPORT' | 'BOT';
  participants: {
    id: string;
    name: string;
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    avatar?: string;
  }[];
  title: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  chats: Chat[];
  messages: ChatMessage[];
  activeChat: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  // Chat management
  createChat: (type: Chat['type'], participants: Chat['participants'], title: string) => void;
  setActiveChat: (chatId: string | null) => void;
  
  // Message management
  sendMessage: (chatId: string, message: string, messageType?: ChatMessage['messageType']) => void;
  markAsRead: (chatId: string, messageId?: string) => void;
  
  // Bot responses
  sendBotResponse: (chatId: string, userMessage: string) => void;
  
  // Utility functions
  getChatMessages: (chatId: string) => ChatMessage[];
  getUnreadCount: () => number;
  clearChat: (chatId: string) => void;
}

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      chats: [],
      messages: [],
      activeChat: null,
      isLoading: false,
      error: null,

      createChat: (type, participants, title) => {
        const newChat: Chat = {
          id: Date.now().toString(),
          type,
          participants,
          title,
          unreadCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          chats: [...state.chats, newChat],
        }));

        return newChat.id;
      },

      setActiveChat: (chatId) => {
        set({ activeChat: chatId });
        if (chatId) {
          get().markAsRead(chatId);
        }
      },

      sendMessage: (chatId, message, messageType = 'text') => {
        const state = get();
        const chat = state.chats.find(c => c.id === chatId);
        if (!chat) return;

        // Get current user from auth store (we'll need to import this)
        const currentUser = JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.user;
        if (!currentUser) return;

        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          chatId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          message,
          timestamp: new Date(),
          isRead: false,
          messageType,
        };

        set((state) => ({
          messages: [...state.messages, newMessage],
          chats: state.chats.map(c => 
            c.id === chatId 
              ? { ...c, lastMessage: newMessage, updatedAt: new Date() }
              : c
          ),
        }));

        // Auto-respond with bot if it's a bot chat
        if (chat.type === 'BOT') {
          setTimeout(() => {
            get().sendBotResponse(chatId, message);
          }, 1000);
        }
      },

      sendBotResponse: (chatId, userMessage) => {
        const lowerMessage = userMessage.toLowerCase();
        let response = "Hello! How can I help you today?";

        // Get actual products from localStorage (product store)
        const getActualProducts = () => {
          try {
            const productStore = localStorage.getItem('product-storage');
            if (productStore) {
              const parsed = JSON.parse(productStore);
              return parsed.state?.products || [];
            }
          } catch (error) {
            console.error('Error getting products:', error);
          }
          return [];
        };

        const products = getActualProducts();

        // Helper function to filter products by price
        const filterProductsByPrice = (maxPrice: number) => {
          return products.filter((product: any) => {
            const price = product.price || product.basePrice || 0;
            return price <= maxPrice;
          });
        };

        // Helper function to get product categories
        const getProductCategories = () => {
          const categories = new Set();
          products.forEach((product: any) => {
            if (product.category) categories.add(product.category);
          });
          return Array.from(categories);
        };

        // Helper function to format product list
        const formatProductList = (productList: any[], limit = 5) => {
          return productList.slice(0, limit).map((product: any) => {
            const price = product.price || product.basePrice || 0;
            return `• ${product.name || product.title} - $${price.toFixed(2)}`;
          }).join('\n');
        };

        // Product-related queries with real data
        if (lowerMessage.includes('product') && (lowerMessage.includes('under') || lowerMessage.includes('below') || lowerMessage.includes('<') || lowerMessage.includes('less'))) {
          if (lowerMessage.includes('50') || lowerMessage.includes('$50')) {
            const affordableProducts = filterProductsByPrice(50);
            if (affordableProducts.length > 0) {
              response = `🛍️ Here are ${affordableProducts.length} products under $50 available on our website:\n\n${formatProductList(affordableProducts)}\n\n${affordableProducts.length > 5 ? `And ${affordableProducts.length - 5} more products available!` : ''}\n\nWould you like to see more details about any of these products?`;
            } else {
              response = "🛍️ I don't see any products under $50 currently available. However, we regularly update our inventory! Would you like me to show you our most affordable products or notify you when new budget-friendly items arrive?";
            }
          } else if (lowerMessage.includes('100') || lowerMessage.includes('$100')) {
            const midRangeProducts = filterProductsByPrice(100);
            if (midRangeProducts.length > 0) {
              response = `🛍️ Here are ${midRangeProducts.length} products under $100:\n\n${formatProductList(midRangeProducts)}\n\n${midRangeProducts.length > 5 ? `And ${midRangeProducts.length - 5} more available!` : ''}\n\nWhat type of product interests you most?`;
            } else {
              response = "🛍️ I don't see products under $100 right now, but we have great options at various price points! Would you like to see our current product range?";
            }
          } else {
            const categories = getProductCategories();
            response = `🛍️ I can help you find products within your budget! We currently have ${products.length} products available across these categories:\n\n${categories.map(cat => `• ${cat}`).join('\n')}\n\nWhat's your price range and which category interests you?`;
          }
        }
        // Order tracking
        else if (lowerMessage.includes('order') || lowerMessage.includes('track') || lowerMessage.includes('delivery')) {
          response = "📦 I can help you track your orders!\n\n• Go to 'My Orders' in your dashboard\n• Use your order number to get real-time updates\n• Check delivery status and estimated arrival\n\nDo you have a specific order number you'd like me to help you track?";
        }
        // Payment and refunds
        else if (lowerMessage.includes('payment') || lowerMessage.includes('refund') || lowerMessage.includes('money') || lowerMessage.includes('pay')) {
          response = "💳 For payment and refund assistance:\n\n• Payment issues: Check your payment methods in settings\n• Refund requests: Go to 'My Orders' → Select order → Request refund\n• Payment failed: Try a different payment method\n\nWould you like me to connect you with our payment support team?";
        }
        // Seller-related queries
        else if (lowerMessage.includes('seller') || lowerMessage.includes('store') || lowerMessage.includes('business')) {
          response = "🏪 Seller & Business Support:\n\n• Become a seller: Click 'Sell on our platform'\n• Manage your store: Use the Seller Dashboard\n• Business analytics: Check your performance metrics\n• Customer support: Use B2C chat features\n\nAre you looking to start selling or need help with your existing store?";
        }
        // Shipping and delivery
        else if (lowerMessage.includes('ship') || lowerMessage.includes('deliver') || lowerMessage.includes('when will')) {
          response = "🚚 Shipping & Delivery Information:\n\n• Standard shipping: 3-5 business days\n• Express shipping: 1-2 business days\n• Free shipping: Orders over $50\n• International: 7-14 business days\n\nYou can track your shipment in 'My Orders' section. Need help with a specific delivery?";
        }
        // Returns and exchanges
        else if (lowerMessage.includes('return') || lowerMessage.includes('exchange') || lowerMessage.includes('wrong') || lowerMessage.includes('defective')) {
          response = "🔄 Returns & Exchanges:\n\n• 30-day return policy for most items\n• Free returns for defective products\n• Exchange available for size/color issues\n• Refund processed within 5-7 business days\n\nTo start a return, go to 'My Orders' and select 'Return Item'. Need help with a specific return?";
        }
        // Account and profile
        else if (lowerMessage.includes('account') || lowerMessage.includes('profile') || lowerMessage.includes('password') || lowerMessage.includes('email')) {
          response = "👤 Account & Profile Help:\n\n• Update profile: Go to Profile Settings\n• Change password: Security section in settings\n• Email preferences: Notification settings\n• Account issues: Contact our support team\n\nWhat specific account help do you need?";
        }
        // Greetings
        else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
          response = "👋 Hello! Welcome to our platform! I'm your AI shopping assistant.\n\nI can help you with:\n• Finding products within your budget\n• Order tracking and delivery info\n• Payment and refund assistance\n• Account and profile management\n• Seller support and business queries\n\nWhat would you like help with today?";
        }
        // Help requests
        else if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('assist')) {
          response = "🤝 I'm here to help! Here's what I can assist you with:\n\n🛍️ **Shopping**: Find products, compare prices, recommendations\n📦 **Orders**: Track shipments, delivery updates, order history\n💳 **Payments**: Payment methods, refunds, billing issues\n🏪 **Selling**: Store management, business analytics, customer support\n👤 **Account**: Profile settings, security, preferences\n\nJust ask me anything or describe what you need help with!";
        }
        // Category-specific queries with real data
        else if (lowerMessage.includes('categories') || lowerMessage.includes('types') || lowerMessage.includes('what do you have') || lowerMessage.includes('what products')) {
          const categories = getProductCategories();
          const categoryStats = categories.map(category => {
            const categoryProducts = products.filter((p: any) => p.category === category);
            const avgPrice = categoryProducts.reduce((sum: number, p: any) => sum + (p.price || p.basePrice || 0), 0) / categoryProducts.length;
            return `• ${category}: ${categoryProducts.length} products (avg $${avgPrice.toFixed(2)})`;
          }).join('\n');

          response = `📋 Here are all product categories available on our website:\n\n${categoryStats}\n\nTotal: ${products.length} products across ${categories.length} categories\n\nWhich category would you like to explore?`;
        }
        // Specific product categories with real data
        else if (lowerMessage.includes('clothes') || lowerMessage.includes('fashion') || lowerMessage.includes('shirt') || lowerMessage.includes('dress')) {
          const fashionProducts = products.filter((p: any) =>
            p.category?.toLowerCase().includes('fashion') ||
            p.category?.toLowerCase().includes('clothing') ||
            p.name?.toLowerCase().includes('shirt') ||
            p.name?.toLowerCase().includes('dress') ||
            p.name?.toLowerCase().includes('clothes')
          );

          if (fashionProducts.length > 0) {
            response = `👕 Fashion & Clothing (${fashionProducts.length} items available):\n\n${formatProductList(fashionProducts)}\n\n${fashionProducts.length > 5 ? `And ${fashionProducts.length - 5} more fashion items!` : ''}\n\nWould you like to see more details about any of these items?`;
          } else {
            response = "👕 I don't see specific fashion items in our current inventory, but we have various products available! Would you like to see our full product catalog?";
          }
        }
        else if (lowerMessage.includes('electronics') || lowerMessage.includes('phone') || lowerMessage.includes('laptop') || lowerMessage.includes('gadget')) {
          const electronicsProducts = products.filter((p: any) =>
            p.category?.toLowerCase().includes('electronics') ||
            p.category?.toLowerCase().includes('tech') ||
            p.name?.toLowerCase().includes('phone') ||
            p.name?.toLowerCase().includes('laptop') ||
            p.name?.toLowerCase().includes('gadget')
          );

          if (electronicsProducts.length > 0) {
            response = `📱 Electronics & Gadgets (${electronicsProducts.length} items available):\n\n${formatProductList(electronicsProducts)}\n\n${electronicsProducts.length > 5 ? `And ${electronicsProducts.length - 5} more tech items!` : ''}\n\nWhat kind of electronics are you most interested in?`;
          } else {
            response = "📱 I don't see electronics in our current inventory, but we have other great products! Would you like to see what's available?";
          }
        }
        // Show all products query
        else if (lowerMessage.includes('show all') || lowerMessage.includes('all products') || lowerMessage.includes('everything')) {
          if (products.length > 0) {
            const categories = getProductCategories();
            response = `🛍️ Our Complete Product Catalog (${products.length} items):\n\n${formatProductList(products, 8)}\n\n${products.length > 8 ? `And ${products.length - 8} more products!` : ''}\n\nCategories: ${categories.join(', ')}\n\nWould you like to filter by category or price range?`;
          } else {
            response = "🛍️ Our product catalog is currently being updated. Please check back soon for our latest inventory!";
          }
        }
        // Price range queries
        else if (lowerMessage.includes('cheapest') || lowerMessage.includes('lowest price')) {
          if (products.length > 0) {
            const sortedByPrice = products.sort((a: any, b: any) => (a.price || a.basePrice || 0) - (b.price || b.basePrice || 0));
            response = `💰 Our Most Affordable Products:\n\n${formatProductList(sortedByPrice, 5)}\n\nThese are our best budget-friendly options! Would you like more details about any of these?`;
          } else {
            response = "💰 I'm currently updating our price information. Please check back soon!";
          }
        }
        else if (lowerMessage.includes('most expensive') || lowerMessage.includes('premium') || lowerMessage.includes('luxury')) {
          if (products.length > 0) {
            const sortedByPrice = products.sort((a: any, b: any) => (b.price || b.basePrice || 0) - (a.price || a.basePrice || 0));
            response = `✨ Our Premium Products:\n\n${formatProductList(sortedByPrice, 5)}\n\nThese are our finest quality items! Interested in any of these premium products?`;
          } else {
            response = "✨ I'm currently updating our premium product information. Please check back soon!";
          }
        }
        // Price-specific queries
        else if (lowerMessage.includes('cheap') || lowerMessage.includes('affordable') || lowerMessage.includes('budget')) {
          response = "💰 Budget-Friendly Options:\n\n• Under $20: Basic accessories, stationery\n• $20-40: Quality clothing, home items\n• $40-60: Premium accessories, electronics\n\nI can help you find great deals! What's your budget range and what are you looking for?";
        }
        else if (lowerMessage.includes('expensive') || lowerMessage.includes('premium') || lowerMessage.includes('luxury')) {
          response = "✨ Premium & Luxury Items:\n\n• Designer clothing & accessories\n• High-end electronics\n• Premium home & lifestyle products\n• Exclusive collections\n\nWhat type of premium product interests you? I can show you our finest selections!";
        }
        // Size and fit queries
        else if (lowerMessage.includes('size') || lowerMessage.includes('fit') || lowerMessage.includes('measurement')) {
          response = "📏 Size & Fit Guide:\n\n• Check our size charts for accurate measurements\n• Read customer reviews for fit feedback\n• Use our virtual try-on features\n• Contact sellers for specific size questions\n\nWhat item are you looking to size? I can help you find the perfect fit!";
        }
        // Search functionality
        else if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('looking for')) {
          // Extract search terms (remove common words)
          const searchTerms = lowerMessage.replace(/search|find|looking for|show me|i want|i need/g, '').trim();
          if (searchTerms && products.length > 0) {
            const matchingProducts = products.filter((p: any) =>
              p.name?.toLowerCase().includes(searchTerms) ||
              p.title?.toLowerCase().includes(searchTerms) ||
              p.description?.toLowerCase().includes(searchTerms) ||
              p.category?.toLowerCase().includes(searchTerms)
            );

            if (matchingProducts.length > 0) {
              response = `🔍 Found ${matchingProducts.length} products matching "${searchTerms}":\n\n${formatProductList(matchingProducts)}\n\n${matchingProducts.length > 5 ? `And ${matchingProducts.length - 5} more matches!` : ''}\n\nWould you like more details about any of these products?`;
            } else {
              response = `🔍 No products found matching "${searchTerms}". Here are some suggestions:\n\n${formatProductList(products, 3)}\n\nTry searching for: ${getProductCategories().slice(0, 3).join(', ')}`;
            }
          } else {
            response = "🔍 What would you like to search for? I can help you find products by name, category, or description!";
          }
        }
        // Product details and specifications
        else if (lowerMessage.includes('details') || lowerMessage.includes('specs') || lowerMessage.includes('information about')) {
          if (products.length > 0) {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            const price = randomProduct.price || randomProduct.basePrice || 0;
            response = `📋 Here's detailed information about one of our products:\n\n**${randomProduct.name || randomProduct.title}**\n• Price: $${price.toFixed(2)}\n• Category: ${randomProduct.category || 'General'}\n• Description: ${randomProduct.description || 'Quality product'}\n\nWould you like details about a specific product? Just tell me the product name!`;
          } else {
            response = "📋 I'd be happy to provide product details! Our inventory is currently being updated. Please check back soon!";
          }
        }
        // Stock and availability
        else if (lowerMessage.includes('stock') || lowerMessage.includes('available') || lowerMessage.includes('in stock')) {
          if (products.length > 0) {
            const inStockProducts = products.filter((p: any) => p.stock > 0 || p.quantity > 0 || !p.hasOwnProperty('stock'));
            response = `📦 Stock Information:\n\n• Total products: ${products.length}\n• Available items: ${inStockProducts.length}\n• Categories in stock: ${getProductCategories().length}\n\nAll displayed products are currently available for purchase! Need info about a specific item?`;
          } else {
            response = "📦 I'm currently updating our stock information. Please check back soon for the latest availability!";
          }
        }
        // Color and style queries with real data
        else if (lowerMessage.includes('color') || lowerMessage.includes('style') || lowerMessage.includes('design')) {
          // Extract color if mentioned
          const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'orange', 'brown'];
          const mentionedColor = colors.find(color => lowerMessage.includes(color));

          if (mentionedColor && products.length > 0) {
            const colorProducts = products.filter((p: any) =>
              p.name?.toLowerCase().includes(mentionedColor) ||
              p.description?.toLowerCase().includes(mentionedColor) ||
              p.color?.toLowerCase().includes(mentionedColor)
            );

            if (colorProducts.length > 0) {
              response = `🎨 ${mentionedColor.charAt(0).toUpperCase() + mentionedColor.slice(1)} Products (${colorProducts.length} available):\n\n${formatProductList(colorProducts)}\n\nFound any that catch your eye?`;
            } else {
              response = `🎨 I don't see specific ${mentionedColor} products, but here are our available items:\n\n${formatProductList(products, 3)}\n\nWould you like to see products in a different color?`;
            }
          } else {
            response = `🎨 Colors & Styles Available:\n\nWe have products in various colors and styles! Here's a sample:\n\n${formatProductList(products, 4)}\n\nWhat specific color or style are you looking for?`;
          }
        }
        // Default intelligent response
        else {
          const responses = [
            "I understand you're looking for assistance. Could you please provide more details about what you need help with?",
            "I'm here to help! Could you clarify what specific information or assistance you're looking for?",
            "Thanks for reaching out! To better assist you, could you tell me more about what you need?",
            "I'd be happy to help! What specific question or concern can I address for you today?"
          ];
          response = responses[Math.floor(Math.random() * responses.length)];
        }

        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          chatId,
          senderId: 'bot',
          senderName: 'Support Bot',
          senderRole: 'BOT',
          message: response,
          timestamp: new Date(),
          isRead: false,
          messageType: 'text',
        };

        set((state) => ({
          messages: [...state.messages, botMessage],
          chats: state.chats.map(c => 
            c.id === chatId 
              ? { ...c, lastMessage: botMessage, updatedAt: new Date(), unreadCount: c.unreadCount + 1 }
              : c
          ),
        }));
      },

      markAsRead: (chatId, messageId) => {
        set((state) => ({
          messages: state.messages.map(m => 
            m.chatId === chatId && (!messageId || m.id === messageId)
              ? { ...m, isRead: true }
              : m
          ),
          chats: state.chats.map(c => 
            c.id === chatId 
              ? { ...c, unreadCount: 0 }
              : c
          ),
        }));
      },

      getChatMessages: (chatId) => {
        return get().messages.filter(m => m.chatId === chatId).sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      },

      getUnreadCount: () => {
        return get().chats.reduce((total, chat) => total + chat.unreadCount, 0);
      },

      clearChat: (chatId) => {
        set((state) => ({
          messages: state.messages.filter(m => m.chatId !== chatId),
          chats: state.chats.filter(c => c.id !== chatId),
          activeChat: state.activeChat === chatId ? null : state.activeChat,
        }));
      },
    }),
    {
      name: 'chat-storage',
    }
  )
);
