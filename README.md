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

## Security & Validation

- Uses **parameterized queries** (via **knex**) to prevent SQL injection.
- Validates required inputs and returns proper HTTP status codes.

## Design Notes

- **Scalable schema**: easy to extend with reservations, reviews, branches, etc.
- **Separation of concerns**: DB logic in `src/storage/dbStorage.js`, routing in `src/routes`.
