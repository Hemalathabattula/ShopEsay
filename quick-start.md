# 🚀 Quick Start Guide - Fashion Era E-commerce Platform

## 📋 Prerequisites
- Node.js 18+ installed
- MongoDB running (local or cloud)
- Two terminal windows

## ⚡ Quick Start (2 Steps)

### Step 1: Start Backend Server
```bash
cd project/server
node server.js
```

### Step 2: Start Frontend (New Terminal)
```bash
cd project
npm run dev
```

## 🌐 Access Points
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 👤 Test Accounts
- **Customer**: `customer@example.com` / `password123`
- **Seller**: `seller@example.com` / `password123`
- **Admin**: `admin@example.com` / `password123`

## 🧪 Testing
```bash
# Test backend APIs
cd project
node test-backend.js
```

## 🔧 Troubleshooting

### If you get dependency errors:
```bash
# Install frontend dependencies
cd project
npm install

# Install backend dependencies
cd server
npm install
```

### If MongoDB connection fails:
- Make sure MongoDB is running
- Check the MONGODB_URI in .env file
- For local MongoDB: `mongodb://localhost:27017/mern-ecommerce`

### If ports are in use:
- Backend uses port 5000
- Frontend uses port 3000
- Stop any processes using these ports

## ✨ Features to Test

### Customer Flow:
1. Register/Login as customer
2. Browse products
3. Add items to cart
4. Checkout with PayPal (sandbox)
5. Track order status

### Seller Flow:
1. Register/Login as seller
2. Add products to inventory
3. Manage orders
4. Update shipping status
5. View analytics

### Admin Flow:
1. Login as admin
2. Manage users and sellers
3. View platform analytics
4. Monitor system health

## 🎯 Key URLs to Test
- `/` - Homepage
- `/products` - Product catalog
- `/customer-dashboard` - Customer dashboard
- `/seller-dashboard` - Seller dashboard
- `/admin-dashboard` - Admin dashboard

## 📧 Email Testing
- Check console logs for email notifications
- Order confirmations, shipping updates, etc.

## 🔄 Real-time Features
- Order status updates
- Live notifications
- Inventory alerts

---

**🎉 You're all set! Enjoy exploring your full-stack MERN e-commerce platform!**
