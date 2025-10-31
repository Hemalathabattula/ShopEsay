@echo off
echo 🚀 Starting Fashion Era E-commerce Platform...
echo ================================================

echo 📦 Installing dependencies if needed...
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

if not exist "server\node_modules" (
    echo Installing backend dependencies...
    cd server
    call npm install
    cd ..
)

echo ✅ Dependencies ready!
echo.

echo 🔧 Starting Backend Server...
start "Backend Server" cmd /k "cd server && node server.js"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo 🎨 Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo 🎉 Both servers are starting!
echo ================================================
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000
echo 📊 Health:   http://localhost:5000/health
echo ================================================
echo.
echo 📝 Test Accounts:
echo 👤 Customer: customer@example.com / password123
echo 🏪 Seller:   seller@example.com / password123
echo 👑 Admin:    admin@example.com / password123
echo.
echo 💡 Close this window when done testing
echo    (The server windows will remain open)
echo.
pause
