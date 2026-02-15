# Quick Start

Get the mobile app running in 5 steps.

## Prerequisites

- Node.js >= 18
- Expo Go app on your phone (or iOS Simulator / Android Emulator)

## Steps

### 1. Generate Project

```bash
copier copy ./mobile-template ./my-mobile-app
cd my-mobile-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` as needed:
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_USE_MOCKS=true
EXPO_PUBLIC_AUTH_PROVIDER=mock
```

### 4. Generate Types (Optional)

If you have a running FastAPI backend with an exported OpenAPI spec:

```bash
npm run generate:types
```

### 5. Start the App

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `i` (iOS) / `a` (Android) to open in a simulator.

## Next Steps

- **Connect to backend:** Set `EXPO_PUBLIC_USE_MOCKS=false` and `EXPO_PUBLIC_API_URL` to your backend URL
- **Add screens:** Create files in `app/` directory (file-based routing)
- **Customize theme:** Edit `src/lib/theme.ts`
- **Run tests:** `npm test`
- **Lint:** `npm run lint`
