# Node.js PostgreSQL Authentication System

A complete authentication system built with Node.js, Express, PostgreSQL and Passport.js.

## Features

- User registration and login
- Password hashing with bcrypt
- Session management
- PostgreSQL database integration
- Docker containerization
- Protected routes

## Prerequisites

- Node.js
- Docker and Docker Compose
- PostgreSQL

## Environment Variables

Create a `.env` file with the following variables:

```env
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=db
DB_PORT=5432
DB_DB=your_database_name
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Running with Docker

Start the application using Docker Compose:
```bash
docker-compose up
```

This will start:
- PostgreSQL database on port 5432
- Node.js application on port 4100

## Running Locally

1. Start PostgreSQL server
2. Install dependencies:
```bash
npm install
```
3. Run the development server:
```bash
npm run dev
```

## API Routes

- `GET /` - Home page
- `GET /users/login` - Login page
- `GET /users/register` - Registration page
- `GET /users/dashboard` - Protected dashboard
- `POST /users/register` - Register new user
- `POST /users/login` - Authenticate user
- `GET /users/logout` - Logout user

## Tech Stack

- Express.js - Web framework
- PostgreSQL - Database
- Passport.js - Authentication middleware
- EJS - View templating
- bcrypt - Password hashing
- Docker - Containerization

## Project Structure

```
.
├── views/
│   ├── dashboard.ejs
│   ├── index.ejs
│   ├── login.ejs
│   └── register.ejs
├── docker-compose.yaml
├── dockerfile
├── index.js
├── dbConfig.js
├── passportConfig.js
└── package.json
```