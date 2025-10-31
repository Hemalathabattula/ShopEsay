# 🛡️ Fashion-Era Standalone Admin Portal

## 🌟 Overview

The Fashion-Era Admin Portal is now completely separate from the main website, running on its own port with dedicated Fashion-Era design and functionality.

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
npm run server:dev
```
*Backend runs on: http://localhost:5000*

### 2. Start the Main Fashion-Era Website
```bash
npm run dev
```
*Main website runs on: http://localhost:5176*

### 3. Start the Standalone Admin Portal
```bash
npm run admin
```
*Admin portal runs on: http://localhost:3001*

## 🔗 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Main Website** | http://localhost:5176 | Fashion-Era customer website |
| **Admin Portal** | http://localhost:3001 | Standalone admin management |
| **Admin Login** | http://localhost:3001/admin-portal-login | Admin authentication |
| **Backend API** | http://localhost:5000 | Server API endpoints |

## 🔐 Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`

## 🎨 Design Features

### Fashion-Era Branding
- ✅ Purple-to-pink gradient background
- ✅ Glass morphism effects
- ✅ Yellow-to-pink accent colors
- ✅ Elegant typography and spacing
- ✅ Professional admin interface

### Key Design Elements
- **Background:** Purple-900 → Purple-700 → Pink-600 gradient
- **Accent Colors:** Yellow-400 → Pink-400 gradient
- **Glass Effects:** Backdrop blur with transparency
- **Icons:** Consistent Fashion-Era styling

## 📁 File Structure

```
project/
├── admin.html                 # Admin portal HTML entry
├── admin-server.js           # Standalone admin server
├── vite.admin.config.ts      # Admin portal Vite config
├── src/
│   ├── admin-main.tsx        # Admin portal entry point
│   ├── pages/
│   │   ├── AdminPortalLogin.tsx
│   │   └── AdminPortalDashboard.tsx
│   └── ...
└── start-admin-portal.bat    # Windows startup script
```

## 🛠️ Development Commands

```bash
# Start admin portal in development
npm run admin

# Build admin portal for production
npm run admin:build

# Preview admin portal build
npm run admin:preview

# Start all services (main + admin)
npm run dev & npm run admin & npm run server:dev
```

## 🔧 Configuration

### Port Configuration
- Main Website: `5176` (Vite default)
- Admin Portal: `3001` (Custom admin port)
- Backend API: `5000` (Express server)

### Environment Variables
```env
ADMIN_PORT=3001
VITE_ADMIN_MODE=true
VITE_API_URL=http://localhost:5000/api
```

## 🚨 Important Notes

1. **Complete Separation:** Admin portal runs independently from main website
2. **Different Ports:** Admin (3001) vs Main (5176) - completely separate
3. **Shared Backend:** Both use the same API server on port 5000
4. **Fashion-Era Design:** Admin portal matches main website aesthetics
5. **Security:** Admin routes are protected and isolated

## 🎯 Benefits

- ✅ **Complete Isolation:** Admin functionality separate from customer site
- ✅ **Professional Design:** Matches Fashion-Era branding perfectly
- ✅ **Enhanced Security:** No admin access points on main website
- ✅ **Dedicated Experience:** Admin-focused interface and navigation
- ✅ **Independent Deployment:** Can be deployed separately if needed

## 🔍 Troubleshooting

### Admin Portal Won't Start
1. Check if port 3001 is available
2. Ensure all dependencies are installed: `npm install`
3. Verify backend server is running on port 5000

### Login Issues
1. Verify backend server is running
2. Check admin credentials: `admin` / `admin123`
3. Clear browser cache and cookies

### Design Issues
1. Hard refresh the browser (Ctrl+F5)
2. Check if all CSS files are loading
3. Verify Vite dev server is running properly

## 📞 Support

For issues or questions about the standalone admin portal, check:
1. Console logs in browser developer tools
2. Terminal output from `npm run admin`
3. Backend server logs from `npm run server:dev`
