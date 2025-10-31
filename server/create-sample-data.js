const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Seller = require('./models/Seller');

// Load environment variables
require('dotenv').config();

async function createSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if data already exists
    const customerCount = await Customer.countDocuments();
    const sellerCount = await Seller.countDocuments();

    console.log(`Current counts - Customers: ${customerCount}, Sellers: ${sellerCount}`);

    if (customerCount === 0) {
      console.log('Creating sample customers...');
      const customers = await Customer.insertMany([
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: '$2b$10$example', // In real app, this would be hashed
          phone: '+1234567890',
          isEmailVerified: true,
          isActive: true
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          password: '$2b$10$example',
          phone: '+1234567891',
          isEmailVerified: true,
          isActive: true
        },
        {
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          password: '$2b$10$example',
          phone: '+1234567892',
          isEmailVerified: true,
          isActive: true
        },
        {
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          password: '$2b$10$example',
          phone: '+1234567893',
          isEmailVerified: true,
          isActive: true
        },
        {
          name: 'David Brown',
          email: 'david.brown@example.com',
          password: '$2b$10$example',
          phone: '+1234567894',
          isEmailVerified: true,
          isActive: true
        }
      ]);
      console.log(`✅ Created ${customers.length} customers`);
    }

    if (sellerCount === 0) {
      console.log('Creating sample sellers...');
      const sellers = await Seller.insertMany([
        {
          name: 'Alice Cooper',
          email: 'alice@fashionstore.com',
          password: '$2b$10$example',
          storeName: 'Fashion Store',
          storeDescription: 'Premium fashion and accessories for modern lifestyle',
          phone: '+1234567895',
          isEmailVerified: true,
          isActive: true
        },
        {
          name: 'Bob Wilson',
          email: 'bob@techhub.com',
          password: '$2b$10$example',
          storeName: 'Tech Hub',
          storeDescription: 'Latest technology and innovative gadgets',
          phone: '+1234567896',
          isEmailVerified: true,
          isActive: true
        },
        {
          name: 'Carol Davis',
          email: 'carol@homeplus.com',
          password: '$2b$10$example',
          storeName: 'Home Plus',
          storeDescription: 'Beautiful home decor and furniture',
          phone: '+1234567897',
          isEmailVerified: true,
          isActive: true
        }
      ]);
      console.log(`✅ Created ${sellers.length} sellers`);
    }

    // Final count check
    const finalCustomerCount = await Customer.countDocuments();
    const finalSellerCount = await Seller.countDocuments();

    console.log('\n📊 Final Database Counts:');
    console.log(`Customers: ${finalCustomerCount}`);
    console.log(`Sellers: ${finalSellerCount}`);

    // Show sample data
    const sampleCustomers = await Customer.find().limit(3).select('name email createdAt');
    const sampleSellers = await Seller.find().limit(3).select('name email storeName createdAt');

    console.log('\n👥 Sample Customers:');
    sampleCustomers.forEach(customer => {
      console.log(`- ${customer.name} (${customer.email})`);
    });

    console.log('\n🏪 Sample Sellers:');
    sampleSellers.forEach(seller => {
      console.log(`- ${seller.name} (${seller.storeName}) - ${seller.email}`);
    });

    console.log('\n✅ Sample data creation completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createSampleData();
