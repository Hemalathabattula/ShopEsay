#!/bin/bash

echo "🚀 Starting Fashion Era E-commerce Platform..."
echo "================================================"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server
    npm install
    cd ..
fi

echo "✅ Dependencies ready!"
echo ""

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend Server..."
    cd server
    node server.js
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend Server..."
    npm run dev
}

# Start backend in background
start_backend &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 5

# Start frontend in background
start_frontend &
FRONTEND_PID=$!

echo ""
echo "🎉 Both servers are running!"
echo "================================================"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo "📊 Health:   http://localhost:5000/health"
echo "================================================"
echo ""
echo "📝 Test Accounts:"
echo "👤 Customer: customer@example.com / password123"
echo "🏪 Seller:   seller@example.com / password123"
echo "👑 Admin:    admin@example.com / password123"
echo ""
echo "💡 Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
