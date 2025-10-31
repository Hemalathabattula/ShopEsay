# 🛍️ Fashion Era - Full-Stack MERN E-commerce Platform

A comprehensive e-commerce platform built with the MERN stack, featuring role-based dashboards, PayPal payments, and real-time notifications.

## ✨ Features

### 🎯 Core Features
- **Multi-Role System**: Customer, Seller, and Admin dashboards
- **PayPal Integration**: Secure sandbox payment processing
- **Real-time Updates**: Socket.IO for live notifications
- **Email Notifications**: Automated emails for orders, shipping, and alerts
- **Responsive Design**: Mobile-first, modern UI with Tailwind CSS

### 👤 Customer Features
- Product browsing with advanced filters
- Shopping cart and wishlist
- Order tracking and history
- Profile management with addresses and payment methods

### 🏪 Seller Features
- Product management (CRUD operations)
- Order fulfillment and shipping
- Sales analytics and reporting
- Inventory tracking with low-stock alerts
- Customer communication tools

### 👑 Admin Features
- User and seller management
- Platform-wide analytics
- Order oversight and moderation
- System health monitoring

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** authentication
- **Socket.IO** for real-time features
- **Nodemailer** for emails
- **PayPal SDK** for payments
- **Cloudinary** for image storage

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** for version control
- **Code Editor** (VS Code recommended)
- **Web Browser** (Chrome, Firefox, Safari, Edge)

## 🚀 How to Run This Project

### 📁 Step 1: Navigate to Project Directory

```bash
# Open Command Prompt, Terminal, or PowerShell
# Navigate to your project folder (replace with your actual path)
cd "C:\Users\DELL\Desktop\project-bolt-sb1-rusndc9k (1)\project"

# For Mac/Linux users:
# cd /path/to/your/project
```

### 📦 Step 2: Install Dependencies (First Time Only)

```bash
# Install all required packages
npm install

# This will install all frontend and backend dependencies
# Wait for the installation to complete (may take 2-5 minutes)
# You should see "added XXX packages" when complete
```

### 🔧 Step 3: Start the Backend Server

**Open your first terminal/command prompt:**

```bash
# Make sure you're in the project directory
cd "C:\Users\DELL\Desktop\project-bolt-sb1-rusndc9k (1)\project"

# Start the backend server
node simple-node-server.js
```

**✅ Expected Success Output:**
```
🚀 Starting Pure Node.js Server...
🎉 SUCCESS! Pure Node.js Server Started!
============================================================
🌐 Server URL: http://localhost:5001
📊 Health Check: http://localhost:5001/health
🔐 Auth Endpoints: http://localhost:5001/api/auth/*
🛍️ Products: http://localhost:5001/api/products
============================================================
✅ No Express dependencies - Pure Node.js!
✅ Ready to accept requests from frontend!
```

**❌ If you see errors:**
- Make sure Node.js is installed: `node --version`
- Check if port 5001 is free
- Try alternative server: `node working-server.js`

### 🎨 Step 4: Start the Frontend Server

**Open a NEW terminal/command prompt (keep the first one running):**

```bash
# Navigate to the same project directory
cd "C:\Users\DELL\Desktop\project-bolt-sb1-rusndc9k (1)\project"

# Start the frontend development server
npm run dev
```

**✅ Expected Success Output:**
```
> vite-react-typescript-starter@0.0.0 dev
> vite

  VITE v5.4.19  ready in 755 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**❌ If you see errors:**
- Make sure dependencies are installed: `npm install`
- Check if another app is using the port
- Try: `npm run build` then `npm run preview`

### 🌐 Step 5: Access Your Application

Once both servers are running successfully:

- **🎨 Frontend (Your E-commerce Website)**: http://localhost:5174/
- **⚙️ Backend API**: http://localhost:5001
- **📊 Health Check**: http://localhost:5001/health

**Note:** The frontend might run on a different port (5173, 5174, etc.) if 3000 is occupied. Check your terminal output for the exact URL.

### 🔍 Step 6: Verify Everything is Working

1. **Test Backend**: Visit http://localhost:5001/health
   - You should see: `{"status":"ok","timestamp":"...","message":"Pure Node.js server is running!","port":5001}`

2. **Test Frontend**: Visit http://localhost:5174/
   - You should see the Fashion Era homepage with products

3. **Check Browser Console**: Press F12 and look for any errors
   - No 404 errors should appear for API calls

## 🧪 Testing Your Application

### 👤 User Registration
1. Visit http://localhost:5174/
2. Click "Register" or "Sign Up"
3. Fill in the registration form:
   - **Name**: Test User
   - **Email**: test@example.com
   - **Password**: password123
   - **Role**: Customer (or Seller/Admin)
4. Click "Register"
5. You should be automatically logged in

### 🔐 User Login
Use these pre-configured test accounts:
- **Customer**: `customer@example.com` / `password123`
- **Seller**: `seller@example.com` / `password123`
- **Admin**: `admin@example.com` / `password123`

Or use the account you just created.

### 🛍️ Features to Test
- **Browse Products**: View product catalog with images and details
- **Add to Cart**: Add items to your shopping cart
- **User Dashboard**: Access your role-based dashboard
- **Order Management**: Place and track orders
- **PayPal Integration**: Test payment flow (sandbox mode)
- **Search & Filter**: Use product search and filtering
- **Responsive Design**: Test on mobile and desktop

## 🔧 Alternative Running Methods

### Method 1: Using Batch File (Windows Only)
```bash
# Double-click this file or run in terminal:
start-servers.bat
```

### Method 2: Using Shell Script (Mac/Linux)
```bash
# Make executable and run:
chmod +x start-servers.sh
./start-servers.sh
```

### Method 3: Using Different Server Files
If `simple-node-server.js` doesn't work, try:

```bash
# Try the working server
node working-server.js

# Or try the test server
node test-server.js

# Or try the original server (if MongoDB is set up)
cd server
node server.js
```

### Method 4: Build for Production
```bash
npm run build
npm run preview
```

## Environment Variables

The `.env` file is already configured with all necessary variables:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/mern-ecommerce
MONGODB_URI=mongodb+srv://payment:payment@cluster0.dhgtxhw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=fb7a51752ebb486680c46db1add4f9326b9d563d61fc4b00f29909451fc71f51d5eab3b90c5f2a984b1e27f185c18c421b6a8d219079b82b518ada4b6c3eafa3
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=AQ8qQ6uX1RIsWCrWO5fzPxuvJf0SVccnR5Ka5Ds5M7jiQyeNKDaLH0H-tUSjjJr55XgrsOsgArAB3vv1
PAYPAL_CLIENT_SECRET=ELpVescf6Uaa6vtaaMcKne2MTIn9txH3cc9G3ZypbG6DNVEYIMfxIUe7cB8ibnsV2OYnZ6ALo0ZTsatM
CLIENT_URL=http://localhost:3000
EMAIL_USER=ecommercevirtualtryon@gmail.com
EMAIL_PASS=twuv gjsg crnd ayen
```

## Backend API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Send password reset email

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Seller/Admin)
- `PUT /api/products/:id` - Update product (Seller/Admin)
- `DELETE /api/products/:id` - Delete product (Seller/Admin)

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order
- `PATCH /api/orders/:id/status` - Update order status (Seller/Admin)
- `GET /api/orders/track/:trackingNumber` - Track order

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:itemId` - Update cart item
- `DELETE /api/cart/remove/:itemId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Payments
- `POST /api/payments/paypal/create-order` - Create PayPal payment
- `POST /api/payments/paypal/capture` - Capture PayPal payment

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/addresses` - Add new address
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `POST /api/reviews/:id/helpful` - Mark review as helpful

### Shipments
- `POST /api/shipments` - Create shipment (Seller/Admin)
- `GET /api/shipments/track/:trackingNumber` - Track shipment
- `PATCH /api/shipments/:id/status` - Update shipment status

## Demo Credentials

- **Customer Account**: customer@demo.com / password
- **Seller Account**: seller@demo.com / password

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Navigation, footer, layout components
│   ├── product/        # Product-related components
│   └── ui/             # Generic UI components
├── pages/              # Page components
├── store/              # Zustand state management
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and classes
├── types/              # TypeScript type definitions
└── index.css           # Global styles and Tailwind imports
```



## Key Features Implementation

### Backend Architecture
- **Express.js** server with modular route structure
- **MongoDB** with Mongoose ODM for data modeling
- **JWT Authentication** with bcrypt password hashing
- **PayPal Integration** for secure payment processing
- **Nodemailer** for automated email notifications
- **Socket.IO** for real-time order updates
- **Express Validator** for input validation and sanitization
- **Rate Limiting** and security middleware (Helmet, CORS)

### State Management
- Zustand stores for auth, cart, products, and wishlist
- Persistent storage for cart and user preferences
- Type-safe state management with TypeScript

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Optimized layouts for mobile, tablet, and desktop
- Touch-friendly interfaces and gestures

### Performance Optimization
- Lazy loading for images and components
- Efficient re-rendering with React optimizations
- Optimized bundle size with Vite
- Database indexing and query optimization
- Caching strategies for frequently accessed data

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### ❌ "Port already in use" Error
```bash
# Stop all Node.js processes (Windows)
taskkill /f /im node.exe

# Stop all Node.js processes (Mac/Linux)
killall node
```

#### ❌ "npm command not found"
```bash
# Install Node.js from https://nodejs.org/
# Restart your terminal after installation
node --version
npm --version
```

#### ❌ "Module not found" Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### ❌ Frontend shows blank page
- Check browser console (F12) for errors
- Clear browser cache (Ctrl+Shift+R)
- Try incognito/private mode

#### ❌ API 404 Errors
- Make sure backend server is running
- Check if CORS is properly configured
- Verify API URLs in frontend code

### ✅ Success Checklist
- [ ] Backend server starts without errors
- [ ] Frontend server starts and shows local URL
- [ ] Homepage loads with product images
- [ ] Registration/login works (no 404 errors)
- [ ] Products display correctly
- [ ] No console errors in browser

## 📞 Support

If you encounter any issues:

1. **Check this README**: Most common issues are covered above
2. **Review Terminal Output**: Look for specific error messages
3. **Browser Developer Tools**: Use F12 to debug frontend issues
4. **Test Step by Step**: Follow each step carefully

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

**🎉 Congratulations! You now have a fully functional MERN e-commerce platform!**

**Made with ❤️ using React, Node.js, TypeScript, and modern web technologies**