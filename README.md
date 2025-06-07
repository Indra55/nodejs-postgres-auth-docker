# Node.js PostgreSQL Authentication System

A secure authentication system built with Node.js, Express, PostgreSQL and Passport.js.

## Features

- User authentication (login/register)
- Password encryption with bcrypt
- Session-based authentication
- PostgreSQL database integration
- Docker containerization
- Protected route middleware
- JWT token authentication
- Input validation and sanitization

## Prerequisites

- Node.js v18 or higher
- Docker and Docker Compose
- PostgreSQL 15+

## Environment Variables

Create a `.env` file with:

```env
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=your_password
PGDATABASE=nodelogin
PGPORT=5432
JWT_SECRET=your_jwt_secret
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Running with Docker

Start all services:
```bash
docker-compose up --build
```

Services:
- PostgreSQL on port 5432
- Node.js app on port 5000

## Running Locally

1. Start PostgreSQL service
2. Create database tables:
```sql
CREATE DATABASE nodelogin;
\c nodelogin

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  email VARCHAR(200),
  password VARCHAR(200)
);
```
3. Run the server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/logout` - Logout user
- `GET /auth/verify` - Verify JWT token

### Protected Routes
- `GET /dashboard` - User dashboard (requires authentication)
- `GET /users` - Get user profile

## Tech Stack

- Express.js - Web framework
- PostgreSQL - Database
- node-postgres (pg) - PostgreSQL client
- Passport.js - Authentication
- jsonwebtoken - JWT implementation
- bcrypt - Password hashing
- express-session - Session management
- cors - CORS middleware
- dotenv - Environment configuration

## Project Structure

```
.
├── config/
│   └── db.js
├── middleware/
│   ├── authorization.js
│   └── validInfo.js
├── routes/
│   ├── auth.js
│   ├── dashboard.js
│   └── users.js
├── database.sql
├── index.js
├── docker-compose.yml
├── .env.example
└── package.json
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

[MIT](https://choosealicense.com/licenses/mit/)