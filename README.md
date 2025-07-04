# Grace Jewelry Store Backend API

A robust backend service for a jewelry store built with Express.js, TypeScript, Prisma, and PostgreSQL.

## Features

- 🔐 **Authentication System**: JWT-based login/signup with role-based access control
- 💎 **Product Management**: Complete CRUD operations for jewelry products
- 🛡️ **Security**: Helmet, CORS, input validation, and password hashing
- 📊 **Database**: PostgreSQL with Prisma ORM
- 🔍 **Search & Filtering**: Product search with pagination and category filtering
- 📝 **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcryptjs
- **Security**: Helmet, CORS
- **Logging**: Morgan

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new admin user
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get user profile (protected)

### Products

- `GET /api/products` - Get all products (with pagination, search, filtering)
- `GET /api/products/:id` - Get specific product
- `GET /api/products/category/:category` - Get products by category
- `POST /api/products` - Create new product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.example` to `.env` and update the values:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/jewelry_store_db"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="7d"
   PORT=3000
   NODE_ENV="development"
   CORS_ORIGIN="http://localhost:3000"
   ```

3. **Set up the database**:

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database (for development)
   npm run db:push

   # Or run migrations (for production)
   npm run db:migrate
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## Product Categories

- `RINGS`
- `NECKLACES`
- `EARRINGS`
- `BRACELETS`
- `WATCHES`
- `BROOCHES`
- `PENDANTS`
- `SETS`
- `OTHER`

## User Roles

- `ADMIN` - Can manage products
- `SUPER_ADMIN` - Full access (future expansion)

## Sample API Usage

### Authentication

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gracejewelry.com",
    "username": "admin",
    "password": "securePassword123",
    "role": "ADMIN"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gracejewelry.com",
    "password": "securePassword123"
  }'
```

### Products

```bash
# Create product (requires authentication)
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Diamond Engagement Ring",
    "description": "Beautiful 1ct diamond solitaire ring",
    "price": 2500.00,
    "category": "RINGS",
    "material": "18K White Gold",
    "weight": 3.5,
    "dimensions": "Size 6",
    "gemstone": "Diamond - 1ct",
    "stock": 5
  }'

# Get all products
curl http://localhost:3000/api/products

# Search products
curl "http://localhost:3000/api/products?search=diamond&category=RINGS&page=1&limit=10"
```

## Database Schema

### Users Table

- `id` - Unique identifier
- `email` - User email (unique)
- `username` - Username (unique)
- `password` - Hashed password
- `role` - User role (ADMIN, SUPER_ADMIN)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Products Table

- `id` - Unique identifier
- `name` - Product name
- `description` - Product description
- `price` - Product price
- `category` - Product category (enum)
- `material` - Material type
- `weight` - Weight in grams
- `dimensions` - Product dimensions
- `gemstone` - Gemstone information
- `images` - Array of image URLs
- `stock` - Available quantity
- `isActive` - Product status
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Development Tools

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## License

This project is proprietary software for Grace Jewelry Store.
#   g r a c e - b a c k e n d - e x p r e s s  
 