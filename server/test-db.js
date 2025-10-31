const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Seller = require('./models/Seller');
const Product = require('./models/Product');
const Order = require('./models/Order');

// Load environment variables
require('dotenv').config();

async function testDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Check counts
    const customerCount = await Customer.countDocuments();
    const sellerCount = await Seller.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();

    console.log('\n📊 Database Counts:');
    console.log(`Customers: ${customerCount}`);
    console.log(`Sellers: ${sellerCount}`);
    console.log(`Products: ${productCount}`);
    console.log(`Orders: ${orderCount}`);

    // Get sample data
    if (customerCount > 0) {
      const sampleCustomers = await Customer.find().limit(3).select('name email createdAt');
      console.log('\n👥 Sample Customers:');
      sampleCustomers.forEach(customer => {
        console.log(`- ${customer.name} (${customer.email}) - ${customer.createdAt}`);
      });
    }

    if (sellerCount > 0) {
      const sampleSellers = await Seller.find().limit(3).select('name email storeName createdAt');
      console.log('\n🏪 Sample Sellers:');
      sampleSellers.forEach(seller => {
        console.log(`- ${seller.name} (${seller.storeName}) - ${seller.email} - ${seller.createdAt}`);
      });
    }

    if (productCount > 0) {
      const sampleProducts = await Product.find().limit(3).select('title price seller createdAt');
      console.log('\n📦 Sample Products:');
      sampleProducts.forEach(product => {
        console.log(`- ${product.title} - $${product.price} - ${product.createdAt}`);
      });
    }

    if (orderCount > 0) {
      const sampleOrders = await Order.find().limit(3).select('total status customer createdAt');
      console.log('\n🛒 Sample Orders:');
      sampleOrders.forEach(order => {
        console.log(`- $${order.total} - ${order.status} - ${order.createdAt}`);
      });
    }

    // If database is empty, create sample data
    if (customerCount === 0 && sellerCount === 0) {
      console.log('\n🔄 Database is empty. Creating sample data...');
      await createSampleData();
    }

  } catch (error) {
    console.error('❌ Database test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

async function createSampleData() {
  try {
    // Create sample customers
    const customers = await Customer.insertMany([
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890',
        isEmailVerified: true,
        isActive: true
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'password123',
        phone: '+1234567891',
        isEmailVerified: true,
        isActive: true
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        password: 'password123',
        phone: '+1234567892',
        isEmailVerified: true,
        isActive: true
      }
    ]);

    // Create sample sellers
    const sellers = await Seller.insertMany([
      {
        name: 'Alice Cooper',
        email: 'alice@fashionstore.com',
        password: 'password123',
        storeName: 'Fashion Store',
        storeDescription: 'Premium fashion and accessories',
        phone: '+1234567893',
        isEmailVerified: true,
        isActive: true
      },
      {
        name: 'Bob Wilson',
        email: 'bob@techhub.com',
        password: 'password123',
        storeName: 'Tech Hub',
        storeDescription: 'Latest technology and gadgets',
        phone: '+1234567894',
        isEmailVerified: true,
        isActive: true
      }
    ]);

    // Create sample products
    const products = await Product.insertMany([
      {
        seller: sellers[0]._id,
        title: 'Summer Floral Dress',
        description: 'Beautiful floral dress perfect for summer occasions',
        basePrice: 89.99,
        originalPrice: 99.99,
        category: 'clothing',
        subcategory: 'dresses',
        material: 'Cotton Blend',
        brand: 'Fashion Era',
        images: [{
          url: '/images/dress1.jpg',
          alt: 'Summer Floral Dress',
          isPrimary: true
        }],
        variants: [{
          size: 'M',
          color: 'Blue',
          stock: 50,
          price: 89.99,
          sku: 'SFD-M-BLU'
        }],
        tags: ['summer', 'floral', 'casual'],
        features: ['Comfortable fit', 'Machine washable', 'Breathable fabric'],
        careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
        isActive: true,
        isFeatured: true
      },
      {
        seller: sellers[0]._id,
        title: 'Classic Denim Jacket',
        description: 'Timeless denim jacket for any season',
        basePrice: 129.99,
        originalPrice: 149.99,
        category: 'clothing',
        subcategory: 'jackets',
        material: 'Denim',
        brand: 'Fashion Era',
        images: [{
          url: '/images/jacket1.jpg',
          alt: 'Classic Denim Jacket',
          isPrimary: true
        }],
        variants: [{
          size: 'L',
          color: 'Blue',
          stock: 30,
          price: 129.99,
          sku: 'CDJ-L-BLU'
        }],
        tags: ['denim', 'classic', 'versatile'],
        features: ['Classic fit', 'Durable construction', 'Multiple pockets'],
        careInstructions: ['Machine wash cold', 'Hang dry', 'Iron if needed'],
        isActive: true
      },
      {
        seller: sellers[1]._id,
        title: 'Designer Leather Handbag',
        description: 'Elegant leather handbag perfect for any occasion',
        basePrice: 299.99,
        originalPrice: 349.99,
        category: 'bags',
        subcategory: 'handbags',
        material: 'Genuine Leather',
        brand: 'Luxury Collection',
        images: [{
          url: '/images/handbag1.jpg',
          alt: 'Designer Leather Handbag',
          isPrimary: true
        }],
        variants: [{
          size: 'One Size',
          color: 'Black',
          stock: 25,
          price: 299.99,
          sku: 'DLH-OS-BLK'
        }],
        tags: ['leather', 'designer', 'elegant'],
        features: ['Genuine leather', 'Multiple compartments', 'Adjustable strap'],
        careInstructions: ['Clean with leather cleaner', 'Store in dust bag', 'Avoid water'],
        isActive: true,
        isFeatured: true
      }
    ]);

    // Create sample orders
    await Order.insertMany([
      {
        customer: customers[0]._id,
        items: [{
          productId: products[0]._id,
          seller: sellers[0]._id,
          title: 'Summer Floral Dress',
          image: '/images/dress1.jpg',
          size: 'M',
          color: 'Blue',
          quantity: 1,
          price: 89.99,
          total: 89.99
        }],
        total: 89.99,
        status: 'completed',
        paymentMethod: 'credit_card',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        }
      },
      {
        customer: customers[1]._id,
        items: [{
          productId: products[1]._id,
          seller: sellers[0]._id,
          title: 'Classic Denim Jacket',
          image: '/images/jacket1.jpg',
          size: 'L',
          color: 'Blue',
          quantity: 1,
          price: 129.99,
          total: 129.99
        }],
        total: 129.99,
        status: 'pending',
        paymentMethod: 'paypal',
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'United States'
        }
      },
      {
        customer: customers[2]._id,
        items: [{
          productId: products[2]._id,
          seller: sellers[1]._id,
          title: 'Designer Leather Handbag',
          image: '/images/handbag1.jpg',
          size: 'One Size',
          color: 'Black',
          quantity: 1,
          price: 299.99,
          total: 299.99
        }],
        total: 299.99,
        status: 'completed',
        paymentMethod: 'credit_card',
        shippingAddress: {
          firstName: 'Mike',
          lastName: 'Johnson',
          address: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'United States'
        }
      }
    ]);

    console.log('✅ Sample data created successfully!');
    console.log('- 3 Customers created');
    console.log('- 2 Sellers created');
    console.log('- 3 Products created');
    console.log('- 3 Orders created');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

// Run the test
testDatabase();
