# Gym Booking Application

A modern web application for managing gym bookings, built with React, TypeScript, and Material-UI.

## Features

- 🔐 **Authentication**

    - Mock login system with user/admin roles
    - Persistent session management
    - Role-based access control

- 📅 **Booking Scheduler**

    - Daily and weekly calendar views
    - Interactive time slot booking
    - Maximum 10 users per time slot
    - Real-time booking status updates

- 💄 **Modern UI**
    - Material-UI components
    - Responsive design
    - Clean and professional interface
    - Dark/light mode support

## Tech Stack

- ⚡️ [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- ⚛️ [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- 📘 [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- 🎨 [Material-UI](https://mui.com/) - React UI framework
- 📊 [Zustand](https://github.com/pmndrs/zustand) - State management
- 📅 [date-fns](https://date-fns.org/) - Date utility library
- 🧪 [Vitest](https://vitest.dev/) - Testing framework
- 🎯 [ESLint](https://eslint.org/) - Code linting
- 💅 [Prettier](https://prettier.io/) - Code formatting
- 🎨 [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Getting Started

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd functional-fitness-app
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open your browser and navigate to:
    ```
    http://localhost:5173
    ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── components/         # Reusable components
├── pages/             # Page components
├── layouts/           # Layout components
├── store/             # State management
├── types/             # TypeScript types
├── test/              # Test setup
└── utils/             # Utility functions
```

## Testing

The project uses Vitest and React Testing Library for testing. Run tests with:

```bash
npm test
```

For test coverage:

```bash
npm run test:coverage
```

## Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Pre-commit hooks for code quality checks

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
