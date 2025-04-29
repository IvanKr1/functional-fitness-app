# Functional Fitness App Setup Guide

## Quick Start

1. Clone the repository
2. Setup the backend (server)
3. Setup the frontend (client)
4. Start both servers

## Detailed Setup

### 1. Backend Setup

```bash
# Create and navigate to server directory
mkdir server
cd server

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express typescript @types/node @types/express cors dotenv jsonwebtoken bcryptjs pg typeorm
npm install --save-dev @types/cors @types/jsonwebtoken @types/bcryptjs nodemon ts-node

# Create TypeScript config
npx tsc --init

# Create .env file
echo "PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=fitness_app
JWT_SECRET=your-secret-key" > .env

# Create project structure
mkdir -p src/controllers src/entities src/database src/types

# Start development server
npm run dev
```

### 2. Frontend Setup

```bash
# Navigate to client directory
cd ../client

# Create Vite project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material axios react-router-dom

# Start development server
npm run dev
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb fitness_app
```

## Project Structure

```
functional-fitness-app/
├── client/           # Frontend React application
│   ├── src/         # Source files
│   ├── public/      # Static files
│   └── package.json # Frontend dependencies
└── server/          # Backend Node.js server
    ├── src/         # Source files
    │   ├── controllers/  # API controllers
    │   ├── entities/     # Database models
    │   ├── database/     # Database configuration
    │   └── types/        # TypeScript types
    └── package.json # Backend dependencies
```

## Development Scripts

### Backend

```bash
npm run dev    # Start development server
npm run build  # Build TypeScript
npm run start  # Start production server
```

### Frontend

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

## Technologies Used

-   Backend: Node.js, Express, TypeScript, PostgreSQL, TypeORM
-   Frontend: React, TypeScript, Vite, Material-UI

## License

MIT
