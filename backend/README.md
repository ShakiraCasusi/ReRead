# ReRead Backend

Backend API for the ReRead book marketplace application.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following:

```env
# MongoDB Connection String
# Get this from MongoDB Atlas: Clusters → Connect → Drivers → Node.js
# Replace <password> with your actual MongoDB password
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/reread?retryWrites=true&w=majority

# Server Port (optional, defaults to 5000)
PORT=5000

# JWT Secret (for Phase 2 - authentication)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

### 4. Seed the Database

To populate the database with initial book data:

```bash
npm run seed
```

This will:
- Clear all existing books
- Add 60+ books from various genres
- Display a summary of seeded books

## API Endpoints

### Books

- `GET /api/books` - Get all books (supports query params: `genre`, `quality`, `featured`, `isNewBook`)
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Create new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `GET /api/books/search?query=...` - Search books by title, author, or genre

### External API (Open Library)

- `GET /api/books/external/search?query=...` - Search books via Open Library API
- `GET /api/books/external/author/:authorName` - Get books by author from Open Library

### Authentication (Phase 2)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile/:userId` - Get user profile

### Cart (Phase 2)

- `GET /api/cart/:userId` - Get user's cart
- `POST /api/cart/:userId/add` - Add item to cart
- `POST /api/cart/:userId/remove` - Remove item from cart

## Testing

Test the API using Postman or curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Get all books
curl http://localhost:5000/api/books

# Search books
curl http://localhost:5000/api/books/search?query=harry
```

## Phase 1 Completion Checklist

- ✅ Backend server setup (Express, CORS, dotenv)
- ✅ MongoDB connection
- ✅ Book model with all required fields
- ✅ CRUD operations for books
- ✅ Third-party API integration (Open Library)
- ✅ Frontend connected to backend API
- ✅ Books displayed from MongoDB
- ✅ Cart functionality (localStorage for Phase 1)

## Next Steps (Phase 2)

- Authentication (JWT)
- File upload (Cloudinary/Firebase)
- Protected routes
- User-specific cart in database
- Sell feature connected to backend
