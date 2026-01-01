# 🎫 Event & Ticket System API

### Tech Stack
- **Runtime**: Node.js v14+
- **Framework**: Express.js v4
- **Databases**: MySQL 8.0+, MongoDB 4.4+

### ORMs/ODMs
- **Sequelize** v6 - MySQL ORM with migrations
- **Mongoose** v8 - MongoDB ODM

### Security
- **Authentication**: JWT with bcryptjs
- **Validation**: Joi
- **Headers**: Helmet.js
- **Rate Limiting**: express-rate-limit
- **Sanitization**: express-mongo-sanitize, HPP

## 🚀 Quick Start

### Prerequisites
```bash
# Check installations
node --version  # v14+
mysql --version # 8.0+
mongosh        # 4.4+
```

### Installation

```bash
# 1. Clone and install
git clone https://github.com/nirmal003/booking_system.git
cd booking_system
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Setup MySQL database
mysql -u root -p -e "CREATE DATABASE booking_system;"

# 4. Run migrations
npm run migrate

# 5. Seed database (optional)
npm run seed

# 7. Start server
npm run dev || npm start
```

**Server runs on:** `http://localhost:3000`

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register         # Register new user
POST   /api/auth/login             # Login user
POST   /api/auth/refresh-token       # Get new token
GET    /api/auth/profile            # Get current user (Auth)
POST   /api/auth/logout              # Logout user
```

### Events
```
GET    /api/events            # List all events
GET    /api/events/:id        # Get single event
POST   /api/events            # Create event (Admin)
PUT    /api/events/:id        # Update event (Admin)
DELETE /api/events/:id        # Delete event (Admin)
```

### Bookings
```
POST   /api/bookings          # Book tickets (Auth)
GET    /api/bookings/my-tickets  # Get user bookings (Auth)
GET    /api/bookings/:id      # Get booking details (Auth)
DELETE /api/bookings/:id      # Cancel booking (Auth)
```

## 📚 Documentation

Comprehensive documentation available in `docs/`:

- **[README.md](docs/README.md)** - Complete API documentation
- **[SETUP.md](docs/SETUP.md)** - Detailed setup guide
- **[SEQUELIZE_GUIDE.md](docs/SEQUELIZE_GUIDE.md)** - Migration tutorial
- **[PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)** - Project overview

## 📝 Available Scripts

### Server
```bash
npm start              # Production mode
npm run dev            # Development mode (auto-reload)
```

### Database Management
```bash
npm run migrate        # Run all pending migrations
npm run migrate:undo   # Undo last migration
npm run migrate:status # Check migration status
npm run seed           # Run all seeders
npm run seed:undo      # Undo all seeders
npm run reset          # Complete database reset
```

### Development
```bash
npm run migration:create -- your-migration-name  # Create new migration
npm run seeder:create -- your-seeder-name        # Create new seeder
```

## 🔐 Security Features

### Input Protection
- ✅ Joi validation on all inputs
- ✅ XSS prevention (input sanitization)
- ✅ NoSQL injection prevention
- ✅ SQL injection prevention (ORM)

### Headers & CORS
- ✅ Helmet.js security headers
- ✅ CORS with origin whitelisting
- ✅ Content Security Policy

### Rate Limiting
- ✅ Auth endpoints: 5 req/15min
- ✅ Booking endpoints: 3 req/min
- ✅ General API: 100 req/15min

### Data Protection
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ No sensitive data in responses
- ✅ JWT expiration handling

## 🧪 Testing

### Using cURL
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Using Postman
Import `postman_collection.json` for complete API testing.

## 👥 Default Credentials

After running seeders:

**Admin:**
- Email: `admin@eventticket.com`
- Password: `admin123`

**Demo Users:**
- `john@example.com` / `password123`
- `jane@example.com` / `password123`
- `bob@example.com` / `password123`
- `alice@example.com` / `password123`

## 🌟 Key Highlights

### Professional Architecture
- **bin/www** approach (Express generator standard)
- Separated app and server
- Proper error handling
- Graceful shutdown

### Database Migrations
- Version-controlled schema
- Easy rollback capability
- Team collaboration friendly
- Production-ready

### Dual Database Design
- **MySQL**: ACID-compliant transactional data
- **MongoDB**: Flexible event metadata
- Cross-database transactions
- Atomic operations

### Concurrency Handling
```javascript
// Prevents race conditions in ticket booking
const event = await Event.findOneAndUpdate(
  { _id: eventId, availableTickets: { $gte: ticketCount } },
  { $inc: { availableTickets: -ticketCount } },
  { new: true, session: mongoSession }
);
```

## 📊 Database Schema

### MySQL Tables (Sequelize)
- **users** - User accounts with authentication
- **bookings** - Ticket booking records

### MongoDB Collections (Mongoose)
- **events** - Event details with flexible metadata
- **system_logs** - System activity logs
