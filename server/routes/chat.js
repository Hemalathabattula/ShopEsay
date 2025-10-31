const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

// Mock chat data storage (in production, use a database)
let chats = [];
let messages = [];

// Get all chats for a user
router.get('/', auth, (req, res) => {
  try {
    const userChats = chats.filter(chat => 
      chat.participants.some(p => p.id === req.user.id)
    );
    res.json(userChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new chat
router.post('/', auth, (req, res) => {
  try {
    const { type, participants, title } = req.body;
    
    const newChat = {
      id: Date.now().toString(),
      type,
      participants: [
        { id: req.user.id, name: req.user.name, role: req.user.role },
        ...participants
      ],
      title,
      unreadCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    chats.push(newChat);
    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', auth, (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is participant
    const isParticipant = chat.participants.some(p => p.id === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const chatMessages = messages.filter(m => m.chatId === chatId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    res.json(chatMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/:chatId/messages', auth, (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, messageType = 'text' } = req.body;
    
    const chat = chats.find(c => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is participant
    const isParticipant = chat.participants.some(p => p.id === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const newMessage = {
      id: Date.now().toString(),
      chatId,
      senderId: req.user.id,
      senderName: req.user.name,
      senderRole: req.user.role,
      message,
      timestamp: new Date(),
      isRead: false,
      messageType
    };
    
    messages.push(newMessage);
    
    // Update chat's last message and timestamp
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].lastMessage = newMessage;
      chats[chatIndex].updatedAt = new Date();
    }
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/:chatId/read', auth, (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageId } = req.body;
    
    const chat = chats.find(c => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is participant
    const isParticipant = chat.participants.some(p => p.id === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Mark messages as read
    messages.forEach(message => {
      if (message.chatId === chatId && (!messageId || message.id === messageId)) {
        message.isRead = true;
      }
    });
    
    // Reset unread count for this user
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].unreadCount = 0;
    }
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a chat
router.delete('/:chatId', auth, (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    const chat = chats[chatIndex];
    
    // Check if user is participant
    const isParticipant = chat.participants.some(p => p.id === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Remove chat and its messages
    chats.splice(chatIndex, 1);
    messages = messages.filter(m => m.chatId !== chatId);
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bot response endpoint
router.post('/bot-response', auth, (req, res) => {
  try {
    const { userMessage, chatId } = req.body;

    const lowerMessage = userMessage.toLowerCase();
    let botResponse = "I'm here to help! How can I assist you today?";

    // Mock product data (in production, fetch from database)
    const mockProducts = [
      { id: 1, name: "Premium Cotton T-Shirt", price: 29.99, category: "Fashion", description: "Comfortable cotton t-shirt" },
      { id: 2, name: "Wireless Bluetooth Headphones", price: 79.99, category: "Electronics", description: "High-quality audio experience" },
      { id: 3, name: "Leather Handbag", price: 149.99, category: "Accessories", description: "Stylish leather handbag" },
      { id: 4, name: "Smart Fitness Watch", price: 199.99, category: "Electronics", description: "Track your fitness goals" },
      { id: 5, name: "Organic Coffee Beans", price: 24.99, category: "Food", description: "Premium organic coffee" },
      { id: 6, name: "Yoga Mat", price: 39.99, category: "Sports", description: "Non-slip yoga mat" },
      { id: 7, name: "Ceramic Dinner Set", price: 89.99, category: "Home", description: "Beautiful ceramic dinnerware" },
      { id: 8, name: "Running Shoes", price: 119.99, category: "Sports", description: "Comfortable running shoes" }
    ];

    // Helper functions
    const filterProductsByPrice = (maxPrice) => {
      return mockProducts.filter(product => product.price <= maxPrice);
    };

    const getProductCategories = () => {
      return [...new Set(mockProducts.map(p => p.category))];
    };

    const formatProductList = (productList, limit = 5) => {
      return productList.slice(0, limit).map(product =>
        `• ${product.name} - $${product.price.toFixed(2)}`
      ).join('\n');
    };

    // Product-related queries with real data
    if (lowerMessage.includes('product') && (lowerMessage.includes('under') || lowerMessage.includes('below') || lowerMessage.includes('<') || lowerMessage.includes('less'))) {
      if (lowerMessage.includes('50') || lowerMessage.includes('$50')) {
        const affordableProducts = filterProductsByPrice(50);
        if (affordableProducts.length > 0) {
          botResponse = `🛍️ Here are ${affordableProducts.length} products under $50 available on our website:\n\n${formatProductList(affordableProducts)}\n\n${affordableProducts.length > 5 ? `And ${affordableProducts.length - 5} more products available!` : ''}\n\nWould you like to see more details about any of these products?`;
        } else {
          botResponse = "🛍️ I don't see any products under $50 currently available. However, we regularly update our inventory! Would you like me to show you our most affordable products?";
        }
      } else if (lowerMessage.includes('100') || lowerMessage.includes('$100')) {
        const midRangeProducts = filterProductsByPrice(100);
        if (midRangeProducts.length > 0) {
          botResponse = `🛍️ Here are ${midRangeProducts.length} products under $100:\n\n${formatProductList(midRangeProducts)}\n\n${midRangeProducts.length > 5 ? `And ${midRangeProducts.length - 5} more available!` : ''}\n\nWhat type of product interests you most?`;
        } else {
          botResponse = "🛍️ I don't see products under $100 right now, but we have great options at various price points! Would you like to see our current product range?";
        }
      } else {
        const categories = getProductCategories();
        botResponse = `🛍️ I can help you find products within your budget! We currently have ${mockProducts.length} products available across these categories:\n\n${categories.map(cat => `• ${cat}`).join('\n')}\n\nWhat's your price range and which category interests you?`;
      }
    }
    // Category queries
    else if (lowerMessage.includes('categories') || lowerMessage.includes('types') || lowerMessage.includes('what do you have') || lowerMessage.includes('what products')) {
      const categories = getProductCategories();
      const categoryStats = categories.map(category => {
        const categoryProducts = mockProducts.filter(p => p.category === category);
        const avgPrice = categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length;
        return `• ${category}: ${categoryProducts.length} products (avg $${avgPrice.toFixed(2)})`;
      }).join('\n');

      botResponse = `📋 Here are all product categories available on our website:\n\n${categoryStats}\n\nTotal: ${mockProducts.length} products across ${categories.length} categories\n\nWhich category would you like to explore?`;
    }
    // Show all products
    else if (lowerMessage.includes('show all') || lowerMessage.includes('all products') || lowerMessage.includes('everything')) {
      botResponse = `🛍️ Our Complete Product Catalog (${mockProducts.length} items):\n\n${formatProductList(mockProducts, 8)}\n\nCategories: ${getProductCategories().join(', ')}\n\nWould you like to filter by category or price range?`;
    }
    // Order tracking
    else if (lowerMessage.includes('order') || lowerMessage.includes('track') || lowerMessage.includes('delivery')) {
      botResponse = "📦 I can help you track your orders!\n\n• Go to 'My Orders' in your dashboard\n• Use your order number to get real-time updates\n• Check delivery status and estimated arrival\n\nDo you have a specific order number you'd like me to help you track?";
    }
    // Payment and refunds
    else if (lowerMessage.includes('payment') || lowerMessage.includes('refund') || lowerMessage.includes('money') || lowerMessage.includes('pay')) {
      botResponse = "💳 For payment and refund assistance:\n\n• Payment issues: Check your payment methods in settings\n• Refund requests: Go to 'My Orders' → Select order → Request refund\n• Payment failed: Try a different payment method\n\nWould you like me to connect you with our payment support team?";
    }
    // Seller-related queries
    else if (lowerMessage.includes('seller') || lowerMessage.includes('store') || lowerMessage.includes('business')) {
      botResponse = "🏪 Seller & Business Support:\n\n• Become a seller: Click 'Sell on our platform'\n• Manage your store: Use the Seller Dashboard\n• Business analytics: Check your performance metrics\n• Customer support: Use B2C chat features\n\nAre you looking to start selling or need help with your existing store?";
    }
    // Shipping and delivery
    else if (lowerMessage.includes('ship') || lowerMessage.includes('deliver') || lowerMessage.includes('when will')) {
      botResponse = "🚚 Shipping & Delivery Information:\n\n• Standard shipping: 3-5 business days\n• Express shipping: 1-2 business days\n• Free shipping: Orders over $50\n• International: 7-14 business days\n\nYou can track your shipment in 'My Orders' section. Need help with a specific delivery?";
    }
    // Greetings
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      botResponse = "👋 Hello! Welcome to our platform! I'm your AI shopping assistant.\n\nI can help you with:\n• Finding products within your budget\n• Order tracking and delivery info\n• Payment and refund assistance\n• Account and profile management\n• Seller support and business queries\n\nWhat would you like help with today?";
    }
    // Help requests
    else if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('assist')) {
      botResponse = "🤝 I'm here to help! Here's what I can assist you with:\n\n🛍️ **Shopping**: Find products, compare prices, recommendations\n📦 **Orders**: Track shipments, delivery updates, order history\n💳 **Payments**: Payment methods, refunds, billing issues\n🏪 **Selling**: Store management, business analytics, customer support\n👤 **Account**: Profile settings, security, preferences\n\nJust ask me anything or describe what you need help with!";
    }
    // Category-specific queries with real data
    else if (lowerMessage.includes('clothes') || lowerMessage.includes('fashion') || lowerMessage.includes('shirt') || lowerMessage.includes('dress')) {
      const fashionProducts = mockProducts.filter(p =>
        p.category.toLowerCase().includes('fashion') ||
        p.name.toLowerCase().includes('shirt') ||
        p.name.toLowerCase().includes('dress') ||
        p.category.toLowerCase().includes('accessories')
      );

      if (fashionProducts.length > 0) {
        botResponse = `👕 Fashion & Clothing (${fashionProducts.length} items available):\n\n${formatProductList(fashionProducts)}\n\nWould you like to see more details about any of these items?`;
      } else {
        botResponse = "👕 I don't see specific fashion items in our current inventory, but we have various products available! Would you like to see our full product catalog?";
      }
    }
    else if (lowerMessage.includes('electronics') || lowerMessage.includes('phone') || lowerMessage.includes('laptop') || lowerMessage.includes('gadget') || lowerMessage.includes('headphones') || lowerMessage.includes('watch')) {
      const electronicsProducts = mockProducts.filter(p =>
        p.category.toLowerCase().includes('electronics') ||
        p.name.toLowerCase().includes('phone') ||
        p.name.toLowerCase().includes('laptop') ||
        p.name.toLowerCase().includes('headphones') ||
        p.name.toLowerCase().includes('watch')
      );

      if (electronicsProducts.length > 0) {
        botResponse = `📱 Electronics & Gadgets (${electronicsProducts.length} items available):\n\n${formatProductList(electronicsProducts)}\n\nWhat kind of electronics are you most interested in?`;
      } else {
        botResponse = "📱 I don't see electronics in our current inventory, but we have other great products! Would you like to see what's available?";
      }
    }
    // Sports and fitness
    else if (lowerMessage.includes('sports') || lowerMessage.includes('fitness') || lowerMessage.includes('exercise') || lowerMessage.includes('yoga') || lowerMessage.includes('running')) {
      const sportsProducts = mockProducts.filter(p =>
        p.category.toLowerCase().includes('sports') ||
        p.name.toLowerCase().includes('yoga') ||
        p.name.toLowerCase().includes('running') ||
        p.name.toLowerCase().includes('fitness')
      );

      if (sportsProducts.length > 0) {
        botResponse = `🏃‍♂️ Sports & Fitness (${sportsProducts.length} items available):\n\n${formatProductList(sportsProducts)}\n\nReady to get active? Which item interests you?`;
      } else {
        botResponse = "🏃‍♂️ I don't see sports items right now, but check out our other products! Would you like to see our full catalog?";
      }
    }
    // Home and lifestyle
    else if (lowerMessage.includes('home') || lowerMessage.includes('kitchen') || lowerMessage.includes('decor') || lowerMessage.includes('furniture')) {
      const homeProducts = mockProducts.filter(p =>
        p.category.toLowerCase().includes('home') ||
        p.name.toLowerCase().includes('kitchen') ||
        p.name.toLowerCase().includes('dinner') ||
        p.name.toLowerCase().includes('ceramic')
      );

      if (homeProducts.length > 0) {
        botResponse = `🏠 Home & Lifestyle (${homeProducts.length} items available):\n\n${formatProductList(homeProducts)}\n\nMaking your home beautiful? Which item catches your eye?`;
      } else {
        botResponse = "🏠 I don't see home items currently, but we have other great products! Would you like to browse our catalog?";
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
      botResponse = responses[Math.floor(Math.random() * responses.length)];
    }
    
    const botMessage = {
      id: (Date.now() + 1).toString(),
      chatId,
      senderId: 'bot',
      senderName: 'AI Assistant',
      senderRole: 'BOT',
      message: botResponse,
      timestamp: new Date(),
      isRead: false,
      messageType: 'text'
    };
    
    messages.push(botMessage);
    
    res.json(botMessage);
  } catch (error) {
    console.error('Error generating bot response:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
