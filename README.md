# 🎬 Movie Watchlist Backend API

A RESTful API backend for the Movie Watchlist application built with Node.js, Express, PostgreSQL, and integrates with TMDB API for automatic poster fetching.

## 🚀 Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **Movie Management**: Full CRUD operations for movies with status tracking
- **Automatic Poster Fetching**: Integration with TMDB API for automatic movie poster retrieval
- **Database**: PostgreSQL with Knex.js query builder and migrations
- **Security**: Password hashing, JWT tokens, CORS configuration
- **Error Handling**: Comprehensive error handling and validation
- **API Documentation**: RESTful API design with consistent response format

## 📋 Movie Status Options

- `want_to_watch` - Movies you want to watch
- `watching` - Movies you're currently watching
- `watched` - Movies you've completed

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **Query Builder**: Knex.js
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **External API**: The Movie Database (TMDB)
- **HTTP Client**: Axios
- **Environment**: dotenv
- **CORS**: cors middleware

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Database Configuration (Neon)
   DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # TMDB API Configuration (Optional)
   TMDB_API_KEY=your_tmdb_api_key_here
   TMDB_BASE_URL=https://api.themoviedb.org/3
   TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Run migrations
   npx knex migrate:latest --knexfile src/knexfile.js
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔗 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | Login user | ❌ |
| POST | `/refresh` | Refresh access token | ❌ |
| POST | `/logout` | Logout user | ❌ |
| GET | `/profile` | Get user profile | ✅ |
| PUT | `/profile` | Update user profile | ✅ |
| PUT | `/change-password` | Change password | ✅ |

### Movie Routes (`/api/movies`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user's movies | ✅ |
| POST | `/` | Add new movie | ✅ |
| GET | `/stats` | Get movie statistics | ✅ |
| GET | `/genres` | Get user's genres | ✅ |
| GET | `/search-tmdb?query=` | Search TMDB | ✅ |
| GET | `/:id` | Get specific movie | ✅ |
| PUT | `/:id` | Update movie | ✅ |
| PUT | `/:id/refresh-poster` | Refresh movie poster | ✅ |
| DELETE | `/:id` | Delete movie | ✅ |

## 📝 API Usage Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john@example.com",
    "password": "securepassword123"
  }'
```

### Add Movie
```bash
curl -X POST http://localhost:5000/api/movies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "The Matrix",
    "genre": "Sci-Fi",
    "status": "want_to_watch",
    "rating": 9,
    "review": "Mind-bending sci-fi classic!"
  }'
```

### Get Movies
```bash
curl -X GET http://localhost:5000/api/movies \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Filter Movies by Status
```bash
curl -X GET "http://localhost:5000/api/movies?status=watched" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📊 Response Format

All API responses follow this consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

## 🗄️ Database Schema

### Users Table
```sql
- id (UUID, Primary Key)
- username (String, Unique)
- email (String, Unique)
- password (String, Hashed)
- created_at (Timestamp)
- updated_at (Timestamp)
```

### Movies Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- title (String)
- genre (String, Optional)
- status (Enum: want_to_watch, watching, watched)
- rating (Integer, 1-10, Optional)
- review (Text, Optional)
- poster_url (String, Optional)
- created_at (Timestamp)
- updated_at (Timestamp)
```

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Access Token**: Short-lived token (1 hour) for API access
2. **Refresh Token**: Long-lived token (7 days) for refreshing access tokens

### Usage
Include the access token in the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 🎯 TMDB Integration

The API automatically fetches movie posters from The Movie Database (TMDB) when:
- Adding a new movie
- Updating a movie title
- Manually refreshing a poster

### Configuration
1. Get your API key from [TMDB](https://www.themoviedb.org/settings/api)
2. Add it to your `.env` file as `TMDB_API_KEY`
3. Poster fetching will work automatically

## 🧪 Testing

Run the included test script to verify all endpoints:
```bash
chmod +x test_api.sh
./test_api.sh
```

Or test individual endpoints:
```bash
# Health check
curl http://localhost:5000/

# API health
curl http://localhost:5000/health
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/         # Route controllers
│   │   ├── authController.js
│   │   └── movieController.js
│   ├── db/                  # Database setup
│   │   ├── migrations/      # Database migrations
│   │   └── index.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js         # Authentication middleware
│   │   └── error.js        # Error handling
│   ├── models/             # Data models
│   │   ├── User.js
│   │   └── Movie.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   └── movies.js
│   ├── services/           # External services
│   │   └── tmdb.js
│   ├── utils/              # Utility functions
│   │   └── jwt.js
│   ├── app.js              # Express app setup
│   └── knexfile.js         # Database configuration
├── test_api.sh             # API testing script
├── package.json
└── README.md
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
TMDB_API_KEY=your_tmdb_api_key
FRONTEND_URL=https://your-frontend-domain.com
```

### Database Migrations in Production
```bash
NODE_ENV=production npx knex migrate:latest --knexfile src/knexfile.js
```

## 📈 Performance Considerations

- **Connection Pooling**: Configured with optimal pool settings for Neon
- **JWT Expiration**: Short-lived access tokens with refresh token flow
- **Database Indexes**: Optimized indexes on frequently queried fields
- **Error Handling**: Comprehensive error catching and logging

## 🔧 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

### Database Commands
```bash
# Run migrations
npx knex migrate:latest --knexfile src/knexfile.js

# Rollback migrations
npx knex migrate:rollback --knexfile src/knexfile.js

# Check migration status
npx knex migrate:status --knexfile src/knexfile.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify your `DATABASE_URL` is correct
   - Ensure your database is running and accessible
   - Check SSL settings for cloud databases

2. **JWT Token Issues**
   - Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
   - Check token expiration times
   - Verify token format in Authorization header

3. **TMDB API Issues**
   - Verify your `TMDB_API_KEY` is valid
   - Check API rate limits
   - Poster fetching is optional and won't break functionality

4. **CORS Issues**
   - Update `FRONTEND_URL` in `.env`
   - Check CORS configuration in `app.js`

---

**Built with ❤️ for the Movie Watchlist Application**