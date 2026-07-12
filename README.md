# EN2H Booking Platform REST API

A fully typed, production-ready **Booking Platform REST API** built with **NestJS** and **TypeScript** as part of the EN2H Backend Engineering Internship Technical Assessment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript) |
| ORM | Prisma v7 (with `@prisma/adapter-pg`) |
| Database | PostgreSQL (Neon serverless) |
| Auth | JWT (access + refresh tokens) |
| Validation | `class-validator` + `class-transformer` |
| Docs | Swagger / OpenAPI |
| Tests | Jest (23 unit tests) |

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm
- A PostgreSQL database (e.g. [Neon](https://neon.tech) — free tier works)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd en2h-assessment
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=3000

# Pooled connection URL (used by the app at runtime)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Direct (non-pooled) connection URL — used by Prisma migrate only
DIRECT_URL="postgresql://user:password@host-direct/dbname?sslmode=require"

# JWT Secrets (use strong random strings in production)
JWT_SECRET="your-strong-secret"
JWT_REFRESH_SECRET="your-strong-refresh-secret"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
```

### 3. Run Database Migration

```bash
npx prisma migrate deploy
```

### 4. Start the Server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

---

## API Documentation

Once running, Swagger UI is available at:

**`http://localhost:3000/api/docs`**

All endpoints are documented with request/response schemas and can be tested directly in the browser.

---

## API Endpoints

### Auth (Public)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new admin/staff user |
| `POST` | `/api/v1/auth/login` | Login and receive JWT tokens |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |

### Services

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/services` | ❌ | List all services (paginated, filterable) |
| `GET` | `/api/v1/services/:id` | ❌ | Get service by ID |
| `POST` | `/api/v1/services` | ✅ JWT | Create a new service |
| `PUT` | `/api/v1/services/:id` | ✅ JWT | Update a service |
| `DELETE` | `/api/v1/services/:id` | ✅ JWT | Soft-delete a service |

### Bookings

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/bookings` | ❌ | Create a booking (customer) |
| `POST` | `/api/v1/bookings/:id/cancel` | ❌ | Cancel a booking (customer) |
| `GET` | `/api/v1/bookings` | ✅ JWT | List all bookings (paginated, searchable) |
| `GET` | `/api/v1/bookings/:id` | ✅ JWT | Get booking by ID |
| `PATCH` | `/api/v1/bookings/:id/status` | ✅ JWT | Update booking status |

---

## Business Rules

1. **Past date**: Bookings cannot be made for past dates
2. **Active service**: Only active services can be booked
3. **Duplicate slots**: No two bookings for the same service, date, and time
4. **Status transitions**: Cancelled bookings cannot be modified; Completed bookings cannot be cancelled

---

## Running Tests

```bash
# Unit tests
npm run test

# With coverage report
npm run test:cov
```

**Result: 23 tests, 4 suites — all passing**

---

## Project Structure

```
src/
├── main.ts                    # App bootstrap (Swagger, pipes, filter, CORS)
├── app.module.ts              # Root module
├── prisma/                    # PrismaService (Prisma v7 + pg adapter)
├── auth/                      # JWT auth (register, login, refresh)
├── services/                  # Service CRUD management
├── bookings/                  # Booking management with business logic
└── common/filters/            # Global exception filter
prisma/
├── schema.prisma              # Database schema (User, Service, Booking)
└── migrations/                # Migration history
prisma.config.ts               # Prisma v7 config (datasource URL)
docker-compose.yml             # Local PostgreSQL setup (optional)
```

---

## Assumptions Made

1. **Two-role system**: The system assumes two types of users — **Admin/Staff** (authenticated via JWT, can manage services and view all bookings) and **Customers** (unauthenticated, can create and cancel bookings by knowing the booking ID).

2. **Soft delete for services**: Deleting a service does not hard-delete it from the database. Instead it sets `isActive = false` to preserve historical booking data integrity.

3. **Booking time is a string**: `bookingTime` is stored as a `HH:MM` string (e.g. `"14:30"`) rather than a full timestamp, since the booking date and time are separate fields and time-zone handling was not specified.

4. **No booking ownership verification**: Customer cancellation (`POST /bookings/:id/cancel`) is public and only requires the booking ID. In a real system, you'd verify via email/phone OTP before allowing cancellation.

5. **Neon PostgreSQL with two URLs**: Neon's serverless PostgreSQL requires a **pooled URL** for runtime connections and a **direct (non-pooled) URL** for database migrations. Both are configured in `.env`.

6. **No email notifications**: The assessment does not specify an email/SMS notification system, so none was implemented. This can be added as a future improvement.

7. **UUID primary keys**: All models use UUID v4 as primary keys for better security and distributed system compatibility.

8. **Pagination defaults**: All list endpoints default to `page=1` and `limit=10` if not specified.

---

## Future Improvements

1. **Email Notifications**: Send confirmation emails to customers on booking creation, confirmation, and cancellation using Nodemailer or a service like SendGrid.

2. **Role-Based Access Control (RBAC)**: Introduce proper roles (ADMIN, STAFF, CUSTOMER) instead of the current binary authenticated/unauthenticated model.

3. **Customer Accounts**: Allow customers to register, login, and view their own booking history instead of tracking by email/phone only.

4. **Booking Ownership Verification**: Before cancellation, verify customer identity via email confirmation or OTP before allowing self-cancellation.

5. **Time Zone Support**: Store booking times in UTC with timezone awareness and convert to customer's local time on display.

6. **Availability Check**: Add an endpoint to query available time slots for a service on a given date, preventing customers from needing to guess open slots.

7. **Recurring Bookings**: Support weekly/monthly recurring booking schedules.

8. **Rate Limiting**: Add rate limiting on public endpoints (booking creation, login) to prevent abuse.

9. **End-to-End Tests**: Add e2e test coverage using Jest + Supertest against a test database.

10. **Docker Compose Full Stack**: Extend the Docker Compose file to containerize the NestJS app alongside PostgreSQL for one-command local setup.
