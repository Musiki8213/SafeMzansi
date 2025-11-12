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

## Building Android APK

This project uses Capacitor to build native Android apps from the React web application.

### Prerequisites for Android Build

1. **Java Development Kit (JDK)**
   - Install JDK 17 or higher
   - Set `JAVA_HOME` environment variable

2. **Android Studio**
   - Download and install [Android Studio](https://developer.android.com/studio)
   - Install Android SDK (API level 33 or higher recommended)
   - Set `ANDROID_HOME` environment variable to your SDK location

3. **Gradle** (usually comes with Android Studio)

### Building the APK

#### Option 1: Using npm scripts (Recommended)

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Build debug APK (for testing):
   ```bash
   npm run android:build
   ```
   The APK will be located at: `client/android/app/build/outputs/apk/debug/app-debug.apk`

3. Build release APK (for distribution):
   ```bash
   npm run android:build:release
   ```
   The APK will be located at: `client/android/app/build/outputs/apk/release/app-release.apk`

#### Option 2: Using Android Studio

1. Sync your web app with Capacitor:
   ```bash
   cd client
   npm run cap:sync
   ```

2. Open Android Studio:
   ```bash
   npm run cap:open
   ```
   Or manually open `client/android` folder in Android Studio

3. In Android Studio:
   - Wait for Gradle sync to complete
   - Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Or use **Build** → **Generate Signed Bundle / APK** for a signed release APK

#### Option 3: Using Gradle directly

1. Sync your web app:
   ```bash
   cd client
   npm run cap:sync
   ```

2. Build using Gradle:
   ```bash
   cd android
   ./gradlew assembleDebug    # For debug APK
   ./gradlew assembleRelease  # For release APK
   ```

### Mobile Development Workflow

1. **After making changes to your React app:**
   ```bash
   npm run cap:sync
   ```
   This builds your web app and syncs it to the Android project.

2. **To test on a device/emulator:**
   ```bash
   npm run cap:run
   ```
   This syncs and opens Android Studio, where you can run the app.

3. **To open Android Studio manually:**
   ```bash
   npm run cap:open
   ```

### Signing the APK for Release

For production releases, you need to sign your APK:

1. Generate a keystore (first time only):
   ```bash
   keytool -genkey -v -keystore safemzansi-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias safemzansi
   ```

2. Configure signing in `android/app/build.gradle` (add signing configs)

3. Build signed release APK through Android Studio: **Build** → **Generate Signed Bundle / APK**

### Important Notes

- Always run `npm run cap:sync` after making changes to your React code
- The Android project is located in `client/android/`
- Debug APKs can be installed directly on devices for testing
- Release APKs need to be signed before distribution
- Make sure your backend server URL is accessible from mobile devices (use your computer's IP address or a deployed server)

## Technologies

### Frontend
- React 19
- Vite
- React Router
- Firebase
- Google Maps API / MapLibre GL
- Capacitor (for mobile apps)

### Backend
- Express.js
- MongoDB
- CORS
- dotenv
- JWT Authentication

## License

This project is private and proprietary.
