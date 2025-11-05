# SafeMzansi

Community Safety Application - Stay Informed. Stay Safe. Stay Mzansi.

## Project Structure

This project is organized into two main directories:

- **`client/`** - React frontend application (Vite + React)
- **`server/`** - Express.js backend API server

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Getting Started

### Running the Client (Frontend)

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The frontend will be available at `http://localhost:5173`

### Running the Server (Backend)

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node server.js
   ```

   Or use npm script:
   ```bash
   npm start
   ```

4. The backend API will be available at `http://localhost:5000`

### Running Both Concurrently

To run both the client and server at the same time:

1. Open two terminal windows
2. In the first terminal:
   ```bash
   cd client && npm run dev
   ```
3. In the second terminal:
   ```bash
   cd server && node server.js
   ```

Alternatively, you can use tools like `concurrently` or `npm-run-all` to run both from a single command.

## API Endpoints

- `GET /api` - Returns a status message confirming the backend is running

## Environment Variables

The server uses `dotenv` for environment configuration. Create a `.env` file in the `server/` directory to configure:

- `PORT` - Server port (defaults to 5000)

Example `.env` file:
```
PORT=5000
```

## Development

### Client Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server Scripts

- `npm start` - Start the server
- `npm run dev` - Start the server (same as start)

## Technologies

### Frontend
- React 19
- Vite
- React Router
- Firebase
- Google Maps API

### Backend
- Express.js
- CORS
- dotenv

## License

This project is private and proprietary.
