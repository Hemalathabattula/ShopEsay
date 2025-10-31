const { MongoClient, ObjectId } = require('mongodb');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://payment:payment@cluster0.dhgtxhw.mongodb.net/fashion-era?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'fashion-era';

async function fixCalvinKleinImage() {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    
    // Find the Calvin Klein product
    const product = await db.collection('products').findOne({
      title: 'Calvin Klein ,cotton shirts'
    });

    if (!product) {
      // Try to find it with a different search
      const allProducts = await db.collection('products').find({}).toArray();
      console.log('All products:');
      allProducts.forEach(p => console.log(`- "${p.title}"`));

      const calvinProduct = allProducts.find(p => p.title.includes('Calvin'));
      if (calvinProduct) {
        console.log('Found Calvin product with title:', calvinProduct.title);
        // Update the search
        const product = calvinProduct;
      }
    }
    
    if (product) {
      console.log('📦 Found Calvin Klein product');
      console.log('Current images:', product.images);
      
      // Add an image to the Calvin Klein product
      const result = await db.collection('products').updateOne(
        { _id: product._id },
        {
          $set: {
            images: [{
              url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop&crop=center',
              alt: 'Calvin Klein Cotton Shirt',
              isPrimary: true
            }]
          }
        }
      );
      
      console.log('✅ Updated Calvin Klein product with image');
      console.log('Modified count:', result.modifiedCount);
      
      // Verify the update
      const updatedProduct = await db.collection('products').findOne({
        title: 'Calvin Klein ,cotton shirts'
      });
      
      console.log('📸 New images:', updatedProduct.images);
    } else {
      console.log('❌ Calvin Klein product not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

fixCalvinKleinImage();
