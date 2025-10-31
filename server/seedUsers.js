const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Customer = require('./models/Customer');
const Seller = require('./models/Seller');

// Force database name for Atlas connection
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const dbName = 'fashion-era';

if (mongoUri && mongoUri.includes('mongodb.net')) {
  console.log('🔧 Forcing database name for Atlas connection:', dbName);
  const uri = mongoUri.split('?')[0].split('/').slice(0, -1).join('/') + '/' + dbName + '?' + (mongoUri.split('?')[1] || '');
  process.env.MONGODB_URI = uri;
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    console.log('Database name:', conn.connection.db.databaseName);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    await connectDB();

    // Sample customers
    const sampleCustomers = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+1 (555) 123-4567',
        role: 'CUSTOMER',
        isActive: true,
        addresses: [{
          type: 'shipping',
          firstName: 'Sarah',
          lastName: 'Johnson',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          isDefault: true
        }],
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date('2024-03-15')
      },
      {
        name: 'Mike Chen',
        email: 'mike.chen@email.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+1 (555) 345-6789',
        role: 'CUSTOMER',
        isActive: true,
        addresses: [{
          type: 'shipping',
          firstName: 'Mike',
          lastName: 'Chen',
          address: '456 Oak Ave',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA',
          isDefault: true
        }],
        createdAt: new Date('2024-02-10'),
        lastLogin: new Date('2024-03-13')
      },
      {
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@email.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+1 (555) 567-8901',
        role: 'CUSTOMER',
        isActive: true,
        addresses: [{
          type: 'shipping',
          firstName: 'Emily',
          lastName: 'Rodriguez',
          address: '789 Pine St',
          city: 'Miami',
          state: 'FL',
          zipCode: '33101',
          country: 'USA',
          isDefault: true
        }],
        createdAt: new Date('2024-01-20'),
        lastLogin: new Date('2024-03-14')
      }
    ];

    // Sample sellers
    const sampleSellers = [
      {
        name: 'Emma Davis',
        email: 'emma.davis@fashionstore.com',
        password: await bcrypt.hash('password123', 10),
        phoneNumber: '+1 (555) 234-5678',
        role: 'SELLER',
        storeName: 'Emma\'s Fashion Hub',
        businessType: 'Individual',
        isActive: true,
        isVerified: true,
        status: 'ACTIVE',
        pickupAddress: {
          street: '321 Fashion Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        createdAt: new Date('2023-11-20'),
        lastLogin: new Date('2024-03-14')
      },
      {
        name: 'Alex Wilson',
        email: 'alex.wilson@trendsetter.com',
        password: await bcrypt.hash('password123', 10),
        phoneNumber: '+1 (555) 456-7890',
        role: 'SELLER',
        storeName: 'TrendSetter Boutique',
        businessType: 'Company',
        isActive: true,
        isVerified: true,
        status: 'ACTIVE',
        pickupAddress: {
          street: '654 Style Blvd',
          city: 'Seattle',
          state: 'WA',
          zipCode: '98101',
          country: 'USA'
        },
        createdAt: new Date('2023-12-05'),
        lastLogin: new Date('2024-03-12')
      }
    ];

    // Clear existing data
    await Customer.deleteMany({});
    await Seller.deleteMany({});

    // Insert sample data
    const customers = await Customer.insertMany(sampleCustomers);
    const sellers = await Seller.insertMany(sampleSellers);

    console.log('✅ Sample users created successfully!');
    console.log(`📊 Created ${customers.length} customers and ${sellers.length} sellers`);
    
    console.log('\n📋 Sample Customers:');
    customers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.name} (${customer.email})`);
    });

    console.log('\n📋 Sample Sellers:');
    sellers.forEach((seller, index) => {
      console.log(`${index + 1}. ${seller.name} (${seller.email}) - ${seller.storeName}`);
    });

    console.log('\n🔑 All users have password: password123');

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedUsers();
