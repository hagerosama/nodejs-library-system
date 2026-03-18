# Node.js Library System

A simple Library Management API built with **Node.js**, **Express**, and **MySQL**. It supports books, borrowers, and a checkout/return workflow (loans) with due date tracking.

---

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Run MySQL + Adminer (Docker)

Start the database and admin UI:

```bash
docker-compose up -d
```

This starts:
- **MySQL** on port **3306**
- **Adminer** on port **8080** (http://localhost:8080)

#### Adminer login (default)

- **System**: MySQL
- **Server**: mysql
- **Username**: library_user
- **Password**: library_pass
- **Database**: library_system

### 3) Configure environment

Copy `.env.example` to `.env` and update if needed:

```bash
cp .env.example .env
```

### 4) Run migrations

```bash
npm run migrate
```

> Tip: If you need a clean schema, run:
>
> ```bash
> npm run reset-db
> ```

### 5) Start the server

```bash
npm start
```

The API will run at: http://localhost:3000

### Development mode (auto-reload)

```bash
npm run dev
```

---

## Helper scripts

| Script | What it does |
| ------ | ------------ |
| `npm run docker:up` | Start Docker services (MySQL + Adminer) |
| `npm run docker:down` | Stop Docker services |
| `npm run migrate` | Run database migrations |
| `npm run reset-db` | Roll back then re-run migrations (data will be lost) |
| `npm run setup` | Start Docker + run migrations |
| `npm run start:docker` | Run `setup` then start the server |
| `npm run smoke` | Run a basic healthcheck against http://localhost:3000 |
| `npm test` | Run all unit tests with Jest |
| `npm run test:watch` | Run tests in watch mode (re-run on file changes) |
| `npm run test:coverage` | Run tests and generate coverage report |

---

## Testing

This project includes unit tests for critical modules. Tests are written using **Jest**.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

Currently covered modules:
- **jwtUtil.js** - JWT token generation, verification, and header extraction
  - ✅ Token generation with correct claims and expiry
  - ✅ Token verification and signature validation
  - ✅ Header token extraction
  - ✅ Error handling for invalid/expired tokens

- **bookRepository.js** - Book CRUD operations
  - ✅ Retrieve all books
  - ✅ Get book by ID
  - ✅ Create new book
  - ✅ Update book details
  - ✅ Delete book
  - ✅ Return null for non-existent books

### Test Structure

Tests are located in `__tests__/` directory:
```
__tests__/
├── jwtUtil.test.js              # JWT utility tests (20+ test cases)
└── bookRepository.test.js        # Book repository tests (6 test cases)
```

### Example Test Run

```bash
$ npm test

> nodejs-library-system@1.0.0 test
> jest

 PASS  __tests__/jwtUtil.test.js
  JWT Utility Functions
    generateToken
      ✓ should generate a valid JWT token
      ✓ should contain correct claims in the token
      ✓ should have correct expiry time in token
      ✓ should generate different tokens for different inputs
    verifyToken
      ✓ should verify a valid token and return claims
      ✓ should throw HttpError (401) for invalid token
      ✓ should throw HttpError (401) for malformed token
      ✓ should throw HttpError (401) for token signed with different secret
      ✓ should throw HttpError (401) for expired token
      ✓ should return token with iat (issued at) claim
    extractTokenFromHeader
      ✓ should extract valid Bearer token from authorization header
      ✓ should handle token with special characters
      ✓ should throw HttpError (401) when authorization header is missing
      ✓ should throw HttpError (401) when authorization header is null
      ✓ should throw HttpError (401) when authorization header does not start with Bearer
      ✓ should throw HttpError (401) for malformed Bearer header
      ✓ should be case-sensitive for Bearer prefix
      ✓ should handle extra whitespace correctly
    Integration tests
      ✓ should complete full JWT flow: generate -> verify -> extract
      ✓ should handle complete request-response cycle

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Time:        2.345 s
```

---

## API Endpoints

### Books

Base path: `/api/books`

- `GET /api/books`
- `GET /api/books/:id`
- `POST /api/books` (body: `title`, `author`, `isbn`, optional `quantity`, `shelfLocation`)
- `PUT /api/books/:id`
- `DELETE /api/books/:id`

### Borrowers

Base path: `/api/borrowers`

- `GET /api/borrowers`
- `GET /api/borrowers/:id`
- `POST /api/borrowers` (body: `name`, `email`)
- `PUT /api/borrowers/:id`
- `DELETE /api/borrowers/:id`

### Loans (checkout/return)

- `POST /api/borrowers/:id/checkout` (body: `bookId`, optional `dueDate`)
- `POST /api/borrowers/:id/return` (body: `bookId`)
- `GET /api/borrowers/:id/loans` (query: `active=true`, `overdue=true`)

---

## Authentication & JWT

This API uses **JWT (JSON Web Tokens)** for secure authentication.

### How It Works

1. **Login** with borrower email to get a JWT token
2. **Include token** in the `Authorization` header for protected endpoints
3. **Token expires** after 7 days (configurable)

### Login Endpoint

**POST** `/api/borrowers/auth/login`

Request body:
```json
{
  "email": "john.doe@example.com"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "borrower": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

### Using the Token

Include the token in the Authorization header for all protected endpoints:

```bash
curl -X PUT http://localhost:3000/api/borrowers/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Jane Doe"}'
```

### Protected vs Public Endpoints

**Public Endpoints** (no authentication required):
- `GET /api/books` - List all books
- `GET /api/books/:id` - Get book details
- `GET /api/borrowers` - List all borrowers
- `GET /api/borrowers/:id` - Get borrower details
- `POST /api/borrowers` - Register new borrower
- `GET /api/borrowers/:id/checkouts` - View loan history

**Protected Endpoints** (require valid JWT token):
- `POST /api/books` - Create book (requires auth)
- `PUT /api/books/:id` - Update book (requires auth)
- `DELETE /api/books/:id` - Delete book (requires auth)
- `PUT /api/borrowers/:id` - Update own profile (requires auth, own profile only)
- `DELETE /api/borrowers/:id` - Delete own account (requires auth, own profile only)
- `POST /api/borrowers/:id/checkout` - Checkout book (requires auth, own account only)
- `POST /api/borrowers/:id/return` - Return book (requires auth, own account only)

### Environment Configuration

Add these optional variables to `.env`:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=7d
```

**Note**: In production, always use a strong, randomly-generated `JWT_SECRET`. Never commit secrets to version control.

### Authorization Rules

- **Borrowers can only modify their own account** - A borrower cannot update or delete another borrower's account
- **Borrowers can only checkout/return for themselves** - A borrower cannot checkout books for other borrowers
- **Any authenticated borrower can create/update/delete books** - Consider adding admin roles for production use

### Security Notes

- Tokens are signed with `HS256` algorithm
- Tokens are stateless (no database lookup required for verification)
- Invalid or expired tokens return **401 Unauthorized**
- Missing authorization header returns **401 Unauthorized**
- Attempting unauthorized access returns **403 Forbidden**
- In production, use HTTPS to prevent token interception

### Future Enhancements

- Add password hashing (bcrypt) for stronger authentication
- Implement role-based access control (RBAC) for admin/librarian roles
- Add token refresh mechanism for extended sessions
- Add logout/token blacklist functionality
- Implement rate limiting on login endpoint
- Add two-factor authentication (2FA)

---

## Architecture & Technology Stack

### Architecture Overview

This project follows a **3-layer architecture** pattern:

```
Client Request
    ↓
Routes (Controllers) [src/routes/]
    ↓
Validation & Middleware [src/facade/]
    ↓
Repository Layer [src/repository/]
    ↓
Database (MySQL)
    ↓
Error Handler [src/facade/errorHandler.js]
```

### Layer Responsibilities

| Layer | Purpose | Files |
|-------|---------|-------|
| **Routes** | HTTP endpoints, request routing | `src/routes/books.js`, `src/routes/borrowers.js` |
| **Facade** | Input validation, async error handling, error transformation | `src/facade/validator.js`, `src/facade/asyncHandler.js` |
| **Repository** | Database queries, data mapping, business logic | `src/repository/bookRepository.js`, `src/repository/borrowerRepository.js`, `src/repository/checkoutRepository.js` |
| **Models** | Domain objects, entity definitions | `src/models/book.js`, `src/models/borrower.js` |
| **Database** | Persistent storage | MySQL with Knex migrations |

### Repository Pattern (Separated by Domain)

The repository layer is split into three focused repositories following the **Single Responsibility Principle**:

| Repository | Responsibility | Functions |
|------------|-----------------|-----------|
| **bookRepository.js** | Book CRUD operations | `getAllBooks()`, `getBookById()`, `createBook()`, `updateBook()`, `deleteBook()` |
| **borrowerRepository.js** | Borrower CRUD operations | `getAllBorrowers()`, `getBorrowerById()`, `getBorrowerByEmail()`, `createBorrower()`, `updateBorrower()`, `deleteBorrower()` |
| **checkoutRepository.js** | Checkout/Loan operations with transactions | `getCheckoutsByBorrower()`, `checkoutBook()`, `returnBook()` |

**Why split?**
- ✅ Easier to maintain and test individual domains
- ✅ Clear separation of concerns
- ✅ Checkout operations handle complex transactions across multiple tables
- ✅ Books and borrowers can evolve independently
- ✅ Following Spring Boot Repository Pattern (one repository per entity)

**Spring Boot Equivalent:**
```java
@Repository
public interface BookRepository extends JpaRepository<Book, Long> { }

@Repository
public interface BorrowerRepository extends JpaRepository<Borrower, Long> {
  Borrower findByEmail(String email);
}

@Repository
public interface CheckoutRepository extends JpaRepository<Checkout, Long> {
  List<Checkout> findByBorrowerIdAndReturnedAtNull(Long borrowerId);
}
```

### Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5.x - lightweight web framework
- **Database**: MySQL 8.x
- **Query Builder**: Knex.js - SQL query builder with migration support
- **Driver**: mysql2 - MySQL protocol driver
- **Authentication**: jsonwebtoken - JWT signing and verification
- **Environment Management**: dotenv - load .env configuration
- **Development**: nodemon - auto-reload during development
- **Orchestration**: Docker Compose - containerized MySQL

### Best Practices Implemented

#### 1. **Security**
- **JWT Authentication**: Stateless token-based authentication using `jsonwebtoken` library
- **Authorization Middleware**: Protected endpoints require valid JWT tokens in Authorization header
- **Access Control**: Users can only modify their own data (borrowers cannot access other borrowers' accounts)
- **Parameterized Queries**: All database queries use Knex builder, preventing SQL injection
- **Input Validation**: Request bodies validated before processing
- **Error Obfuscation**: Sensitive errors logged to console, safe messages returned to clients

#### 2. **Error Handling**
- **Custom Error Classes**: `ValidationError` (400), `HttpError` for different scenarios
- **Centralized Handler**: Single error middleware catches all errors consistently
- **Async Safety**: `asyncHandler` wrapper catches Promise rejections in route handlers
- **HTTP Status Codes**: Proper status codes (201 for created, 400 for validation, 404 for not found, 500 for server errors)

#### 3. **Data Access**
- **Repository Pattern**: Split repositories by domain (`bookRepository`, `borrowerRepository`, `checkoutRepository`)
- **Single Responsibility**: Each repository focuses on one entity/domain
- **Data Mapping**: Object mapping functions (`mapBook`, `mapBorrower`, `mapCheckout`) transform DB rows to domain objects
- **Transaction Support**: `checkoutBook`/`returnBook` use database transactions to ensure atomic operations
- **Query Builder**: Knex provides type-safe, SQL-injection-proof queries

#### 4. **Database Management**
- **Migrations**: Schema changes version-controlled in `migrations/` folder
- **Migration Tools**: Knex handles migrations, rollbacks, and schema versioning
- **Referential Integrity**: Foreign keys with ON DELETE CASCADE for data consistency

#### 5. **Code Organization**
- **Separation of Concerns**: Clear boundaries between routes, validation, data access, and errors
- **Middleware Pattern**: Validators and error handling are Express middleware/functions
- **Reusable Validators**: `parseIdParam()`, `requireFields()` for DRY validation
- **Environment Configuration**: Externalized settings via `.env` file

#### 6. **API Design**
- **RESTful Conventions**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Resource-Based URLs**: `/api/books`, `/api/borrowers` (nouns, not verbs)
- **Query Parameters**: Filtering with `?active=true`, `?overdue=true`
- **Consistent JSON Responses**: All endpoints return JSON with standardized structure

#### 7. **Development Workflow**
- **Hot Reload**: `npm run dev` with nodemon for faster development
- **Database Setup Scripts**: `npm run setup` combines Docker + migrations
- **Health Checks**: Smoke test script for quick validation
- **Clean Reset**: `npm run reset-db` for testing with fresh schema

### Transaction Example

The `checkoutBook` operation demonstrates ACID transactions:

```javascript
async function checkoutBook({ borrowerId, bookId, dueDate }) {
  return knex.transaction(async (trx) => {
    // All operations below are atomic
    const borrower = await trx(TABLES.borrowers).where({ id: borrowerId }).first();
    const book = await trx(TABLES.books).where({ id: bookId }).first();
    // ... business logic
    await trx(TABLES.checkouts).insert({...}); // All succeed or all rollback
  });
}
```

This is equivalent to Spring's `@Transactional` annotation.

### Future Scalability

The architecture easily supports:
- Authentication/Authorization middleware
- Request logging middleware
- Rate limiting
- Caching strategies
- Additional business domains (reservations, reviews, branches)
- Pagination for large datasets
- Search and filtering capabilities

---

## Security & Validation

- Uses **parameterized queries** (via **knex**) to prevent SQL injection.
- Validates required inputs and returns proper HTTP status codes.

## Design Notes

- **Scalable schema**: easy to extend with reservations, reviews, branches, etc.
- **Separation of concerns**: DB logic in `src/storage/dbStorage.js`, routing in `src/routes`.
