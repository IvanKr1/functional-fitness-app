# Gym Booking System - Backend API

A comprehensive RESTful API for managing gym bookings, user authentication, and attendance tracking.

## 🚀 Features

- **Authentication**: JWT-based auth with HttpOnly cookies
- **Role-based Access**: Admin and User roles with different permissions
- **Booking Management**: Create, update, cancel bookings with constraints
- **Weekly Limits**: Configurable per-user booking limits
- **Time Validation**: 2-hour reschedule restriction, 07:00-20:00 booking hours
- **Attendance Tracking**: Monitor user session attendance
- **Payment Tracking**: Track payment status and due dates
- **Statistics**: Weekly/monthly attendance analytics

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Validation**: Zod schemas
- **Testing**: Vitest
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- npm or yarn package manager

## 🔧 Installation

1. **Clone and navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   ```

4. **Configure environment variables**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/gym_booking_db"
   JWT_SECRET="your-super-secret-jwt-key-here-minimum-32-characters"
   COOKIE_SECRET="your-cookie-secret-here-minimum-32-characters"
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

5. **Database setup**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed  # Optional: seed with admin user
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST /auth/login
Login with email and password.
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /auth/register (Admin only)
Register a new user.
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobilePhone": "+1234567890",
  "weeklyBookingLimit": 3
}
```

#### POST /auth/logout
Logout current user (clears auth cookie).

#### GET /auth/profile
Get current user profile.

#### PATCH /auth/change-password/:id
Change user password.
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### User Management Endpoints

#### GET /users (Admin only)
Get all users.

#### GET /users/:id
Get user by ID (own profile or admin).

#### PATCH /users/:id
Update user information.
```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "mobilePhone": "+1234567890"
}
```

#### PATCH /users/:id/notes
Update user health/injury notes.
```json
{
  "notes": "Has knee injury, avoid high-impact exercises"
}
```

#### PATCH /users/:id/booking-limit (Admin only)
Update user's weekly booking limit.
```json
{
  "weeklyBookingLimit": 4
}
```

#### DELETE /users/:id (Admin only)
Delete user account.

### Booking Endpoints

#### GET /bookings
Get bookings (user's own or all for admin).

#### POST /bookings
Create new booking.
```json
{
  "startTime": "2024-01-15T09:00:00.000Z",
  "endTime": "2024-01-15T10:00:00.000Z",
  "notes": "Personal training session"
}
```

#### PATCH /bookings/:id
Update existing booking.
```json
{
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "status": "CONFIRMED"
}
```

#### DELETE /bookings/:id
Cancel booking (marks as CANCELLED).

#### GET /bookings/week-count
Get weekly booking count for user.
```
?userId=123&week=2024-01-15
```

#### GET /bookings/missing-this-week (Admin only)
Get users with no bookings this week.

### Attendance Endpoints

#### GET /attendance
Get attendance records.
```
?userId=123&month=2024-01
```

### Payment Endpoints

#### GET /payments/status
Get payment status for user.
```
?userId=123
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **HttpOnly Cookies**: Prevents XSS attacks
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Zod schema validation
- **Password Hashing**: bcryptjs with salt rounds
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: Various security headers

## 📊 Booking Rules & Constraints

1. **Time Constraints**:
   - Bookings only between 07:00 and 20:00
   - Cannot book sessions in the past
   - 2-hour minimum notice for rescheduling

2. **Frequency Limits**:
   - Maximum 1 session per day
   - Configurable weekly limit per user (default: 2)

3. **User Permissions**:
   - Users can only manage their own bookings
   - Admins can manage all bookings and override restrictions

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📝 Database Schema

### User Model
- `id`, `name`, `email`, `mobilePhone`
- `passwordHash`, `role` (USER/ADMIN)
- `weeklyBookingLimit`, `notes`
- `lastPaymentDate`, `nextPaymentDueDate`

### Booking Model
- `id`, `userId`, `startTime`, `endTime`
- `status` (CONFIRMED/CANCELLED/COMPLETED)
- `notes`, `createdAt`, `updatedAt`

### AttendanceRecord Model
- `id`, `userId`, `bookingId`
- `attended`, `checkedInAt`, `notes`

### PaymentRecord Model
- `id`, `userId`, `amount`, `currency`
- `paymentDate`, `dueDate`, `status`

## 🔄 Development Workflow

1. **Database Changes**:
   ```bash
   # After modifying schema.prisma
   npm run db:generate
   npm run db:push
   ```

2. **Adding New Features**:
   - Create service functions
   - Add controller methods
   - Define routes with validation
   - Write tests
   - Update documentation

3. **Environment Management**:
   - Development: `npm run dev`
   - Production: `npm run build && npm start`
   - Testing: `npm test`

## 🚀 Deployment

### Render Deployment

1. **Build Configuration**:
   ```bash
   npm run build
   ```

2. **Environment Variables**:
   Set all required variables in Render dashboard

3. **Database**:
   Configure PostgreSQL database connection

4. **Start Command**:
   ```bash
   npm start
   ```

### Production Checklist

- [ ] Set strong JWT_SECRET and COOKIE_SECRET
- [ ] Configure proper DATABASE_URL
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for frontend domain
- [ ] Set up database backups
- [ ] Configure monitoring and logging

## 📞 Support

For questions or issues:
1. Check the API documentation
2. Review error responses for debugging info
3. Check server logs for detailed error information

## 📄 License

MIT License - see LICENSE file for details. 