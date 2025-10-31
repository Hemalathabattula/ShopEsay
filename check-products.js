const { MongoClient } = require('mongodb');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://payment:payment@cluster0.dhgtxhw.mongodb.net/fashion-era?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'fashion-era';

async function checkProducts() {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    const products = await db.collection('products').find({}).toArray();
    
    console.log('\n📦 Products in database:');
    console.log('========================');
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. Product ID: ${product._id}`);
      console.log(`   Title: ${product.title}`);
      console.log(`   Price: $${product.basePrice}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Images: ${JSON.stringify(product.images, null, 2)}`);
      console.log(`   Active: ${product.isActive}`);
      console.log(`   Created: ${product.createdAt}`);
    });
    
    console.log(`\n📊 Total products: ${products.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

checkProducts();
