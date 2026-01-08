# Frontend Setup Instructions

## Prerequisites
- Node.js and npm installed
- Backend server running on port 5000 (`npm start` from the backend folder)

## To Start the Frontend

### Option 1: Using npm (Recommended)
```bash
cd frontend
npm install
npm start
```

The frontend will be available at: **http://localhost:8080**

### Option 2: Manual http-server
If npm start doesn't work, you can start the server manually:
```bash
cd frontend
npx http-server . -p 8080 -c-1
```

## Fixes Applied

### 1. ✅ Added npm start script
- Created `frontend/package.json` with http-server configuration
- Configured to serve on port 8080 with cache disabled

### 2. ✅ Fixed Profile & Orders pages API calls
- Updated `scripts/profile.js` to use `http://localhost:5000/api/auth/profile`
- Updated `scripts/orders.js` to use `http://localhost:5000/api/orders/buyer`
- Fixed relative paths to absolute API URLs

### 3. ✅ Fixed Add to Cart functionality
- Enhanced book ID comparison in `scripts/shop.js` with string conversion
- Ensures MongoDB ObjectIDs are properly compared

## Access the Application

- **Home**: http://localhost:8080/index.html
- **Shop**: http://localhost:8080/pages/shop.html
- **Cart**: http://localhost:8080/pages/cart.html
- **Profile**: http://localhost:8080/pages/profile.html (requires login)
- **Orders**: http://localhost:8080/pages/orders.html (requires login)

## Troubleshooting

### If you see "Cannot find books"
- Make sure backend is running: `npm start` in the backend folder
- Check that backend is on port 5000
- Open browser console (F12) to see API errors

### If profile/orders pages don't load
- Clear browser cache (Ctrl+Shift+Delete)
- Make sure you're logged in
- Check that backend is running
- Open console (F12) to see specific errors

### If add to cart isn't working
- Refresh the shop page
- Check that books are loading (you should see book titles)
- Open browser console to see any error messages
