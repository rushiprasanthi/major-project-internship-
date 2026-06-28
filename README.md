# RMS MVP

Smart Resource Booking & Asset Management System MVP scaffold.

## Structure

- `backend/` - Express API and PostgreSQL database setup
- `frontend/` - Vite + React + Tailwind frontend

## Tech Stack

- React + Vite + Tailwind CSS
- Node.js + Express + PostgreSQL
- JWT-based authentication with bcrypt password hashing
- Note: Architecture migrated from SQLite to PostgreSQL to support concurrent bookings.

> Note: The project architecture was officially migrated from SQLite to PostgreSQL to better support multi-user concurrent booking.

## Setup

### Backend

```
cd backend
npm install
npm run dev
```

### Frontend

```
cd frontend
npm install
npm run dev
```
