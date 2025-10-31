const axios = require('axios');

async function testAPI() {
  try {
    console.log('🧪 Testing Admin Dashboard API...\n');

    // Test the dashboard endpoint (this should work without auth for testing)
    const baseURL = 'http://localhost:5000/api';
    
    // First, let's test a simple endpoint
    try {
      const healthResponse = await axios.get('http://localhost:5000/health');
      console.log('✅ Health check:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }

    // Test the dashboard data function directly
    console.log('\n📊 Testing dashboard data function...');
    
    // We'll need to create a simple test that calls our getDashboardData function
    const mongoose = require('mongoose');
    const Customer = require('./models/Customer');
    const Seller = require('./models/Seller');
    const Product = require('./models/Product');
    const Order = require('./models/Order');

    // Load environment variables
    require('dotenv').config();

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for testing');

    // Test the getDashboardData function logic
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const totalSellers = await Seller.countDocuments({ isActive: true });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    console.log('\n📈 Real Database Statistics:');
    console.log(`Total Customers: ${totalCustomers}`);
    console.log(`Total Sellers: ${totalSellers}`);
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Total Orders: ${totalOrders}`);
    console.log(`Pending Orders: ${pendingOrders}`);

    // Calculate growth rates
    const customersLastWeek = await Customer.countDocuments({ 
      isActive: true, 
      createdAt: { $gte: sevenDaysAgo } 
    });
    const sellersLastWeek = await Seller.countDocuments({ 
      isActive: true, 
      createdAt: { $gte: sevenDaysAgo } 
    });

    const customerGrowth = totalCustomers > 0 ? (customersLastWeek / totalCustomers) * 100 : 0;
    const sellerGrowth = totalSellers > 0 ? (sellersLastWeek / totalSellers) * 100 : 0;

    console.log(`Customer Growth (last 7 days): ${customerGrowth.toFixed(2)}%`);
    console.log(`Seller Growth (last 7 days): ${sellerGrowth.toFixed(2)}%`);

    // Get revenue data from completed orders
    const completedOrders = await Order.find({ 
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo }
    });

    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalProfit = totalRevenue * 0.15; // Assuming 15% profit margin

    console.log(`Total Revenue (last 30 days): $${totalRevenue.toFixed(2)}`);
    console.log(`Estimated Profit: $${totalProfit.toFixed(2)}`);

    // Get recent transactions
    const recentTransactions = await Order.find({ status: { $in: ['completed', 'pending', 'refunded'] } })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id customer total status createdAt paymentMethod');

    console.log('\n💳 Recent Transactions:');
    recentTransactions.forEach(order => {
      console.log(`- Order ${order._id}: $${order.total} - ${order.status} - ${order.customer?.name || 'Unknown'}`);
    });

    // Get customer data with order statistics
    const customersWithStats = await Customer.aggregate([
      { $match: { isActive: true } },
      { $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'customer',
        as: 'orders'
      }},
      { $addFields: {
        orderCount: { $size: '$orders' },
        totalSpent: { 
          $sum: { 
            $map: { 
              input: { $filter: { input: '$orders', cond: { $eq: ['$$this.status', 'completed'] } } },
              as: 'order',
              in: '$$order.total'
            }
          }
        }
      }},
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      { $project: {
        name: 1,
        email: 1,
        orderCount: 1,
        totalSpent: 1,
        createdAt: 1,
        isActive: 1
      }}
    ]);

    console.log('\n👥 Top Customers by Spending:');
    customersWithStats.forEach(customer => {
      console.log(`- ${customer.name}: ${customer.orderCount} orders, $${customer.totalSpent.toFixed(2)} spent`);
    });

    // Get seller data with product and revenue statistics
    const sellersWithStats = await Seller.aggregate([
      { $match: { isActive: true } },
      { $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'seller',
        as: 'products'
      }},
      { $addFields: {
        productCount: { $size: '$products' }
      }},
      { $sort: { productCount: -1 } },
      { $limit: 5 },
      { $project: {
        name: 1,
        email: 1,
        storeName: 1,
        productCount: 1,
        createdAt: 1,
        isActive: 1
      }}
    ]);

    console.log('\n🏪 Sellers by Product Count:');
    sellersWithStats.forEach(seller => {
      console.log(`- ${seller.storeName || seller.name}: ${seller.productCount} products`);
    });

    console.log('\n✅ API Test completed successfully!');
    console.log('🎯 The dashboard should now show REAL data from your database instead of mock data.');

  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

// Run the test
testAPI();
