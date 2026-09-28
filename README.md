# Mobile Template

A production-ready React Native mobile template for consuming FastAPI backends. Built with Expo, TypeScript, TanStack Query, and Expo Router.

## Overview

This template provides a complete mobile application scaffold with:
- File-based navigation (Expo Router)
- Type-safe API client with Bearer token authentication
- TanStack Query for server state management
- Auto-generated types from OpenAPI spec
- Pluggable authentication (mock, Ory, Auth0, Keycloak, Cognito)
- Seeded mock data factories for standalone development
- Biome linting and TypeScript strict mode

## Prerequisites

- **Node.js** >= 20.19.4 (required by React Native 0.86; Node 20.19.4+, 22.13+, or 24.3+)
- **npm** >= 9
- **Expo Go** app on your phone (for physical device testing), OR
- **iOS Simulator** (macOS only, requires Xcode), OR
- **Android Emulator** (requires Android Studio)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Open the app:**
   - Scan the QR code with Expo Go (physical device)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Project Structure

```
app/                        # Expo Router file-based routes
├── _layout.tsx             # Root layout (providers, auth redirect)
├── index.tsx               # Entry redirect
├── (auth)/                 # Unauthenticated routes
│   ├── _layout.tsx
│   └── login.tsx
├── (tabs)/                 # Main tab navigation
│   ├── _layout.tsx         # Tab bar configuration
│   ├── index.tsx           # Dashboard
│   ├── items.tsx           # Items list
│   └── settings.tsx        # Settings
└── items/                  # Item routes
    ├── [id].tsx            # Item detail
    └── create.tsx          # Create item
src/
├── api/                    # API layer
│   ├── generated/types.ts  # Auto-generated from OpenAPI
│   ├── client.ts           # Fetch wrapper with auth
│   ├── items.ts            # Item CRUD functions
│   └── types.ts            # Type aliases
├── auth/                   # Auth provider abstraction
├── components/ui/          # Shared UI components
├── hooks/                  # TanStack Query hooks
├── lib/theme.ts            # Design tokens (colors, spacing, etc.)
└── mocks/                  # Faker.js data factories
```

## Development

### Running the App

```bash
npx expo start             # Start dev server (QR code)
npx expo start --ios       # Open in iOS simulator
npx expo start --android   # Open in Android emulator
```

Hot reload is enabled by default. Save a file and changes appear instantly.

### Debugging

- Shake device or press `m` in terminal to open dev menu
- Use React DevTools for component inspection
- Console logs appear in the terminal running Expo

## API Integration

### Connecting to Backend

Set the API URL in `.env`:
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_USE_MOCKS=false
```

The `fetchApi` wrapper in `src/api/client.ts` handles:
- Bearer token authentication via `expo-secure-store`
- Base URL configuration
- Error handling

### Type Generation

Generate TypeScript types from the backend OpenAPI spec:

```bash
npm run generate:types
```

This reads from `../specs/openapi.json` (exported by the FastAPI backend) and generates types in `src/api/generated/types.ts`.

## Authentication

Authentication uses a pluggable provider pattern:

| Provider | Use Case |
|----------|----------|
| `mock` | Development (auto-logged-in) |
| `ory` | Ory (open source, self-hosted) — native API flow |
| `auth0` | Auth0 (commercial SaaS) — planned |
| `keycloak` | Keycloak (open source) — planned |
| `cognito` | AWS Cognito — planned |

Configure via `EXPO_PUBLIC_AUTH_PROVIDER` in `.env`.

> **Note:** only `mock` and `ory` are implemented. `auth0`, `keycloak`, and
> `cognito` are declared choices that resolve to an "unconfigured" provider
> (`status: 'unconfigured'`): selecting one renders a full-screen error at the
> `app/index.tsx` entry gate. There is no silent fallback to mock and no thrown
> exception (see `src/auth/providers/index.ts` and ARCHITECTURE.md's Known gaps).

### Ory

The `ory` provider uses Ory Kratos **native (API) flows**: the login screen's
email + password are submitted to a native login flow, and the returned session
token is stored in `expo-secure-store` and validated on launch via
`toSession` with the `X-Session-Token` header. No cookies or browser redirects.

1. `npm install @ory/client-fetch` (optional dependency; without it the
   provider reports a clear error instead of crashing the bundle)
2. Set `EXPO_PUBLIC_AUTH_PROVIDER=ory` and `EXPO_PUBLIC_ORY_SDK_URL` (your Ory
   project / Kratos public URL) in `.env`

Tokens are stored securely using `expo-secure-store` (device keychain/keystore).

## Testing

```bash
npm test                   # Run all tests
```

Tests use Jest with the `jest-expo` preset. Mock data is generated with Faker.js using `seed(12345)` for reproducibility.

**Note:** MSW is not used in this template because React Native does not support service workers. Instead, mock at the API client level.

## Linting & Type Checking

```bash
npm run lint               # Biome lint check
npm run lint:fix           # Auto-fix lint issues
npm run typecheck          # TypeScript strict check
```

Zero violations policy: all checks must pass with zero errors.

## Template Generation

This template uses [Copier](https://copier.readthedocs.io/) for project generation:

```bash
copier copy ./mobile-template ./my-mobile-app
```

Template variables:
- `project_name` - Human-readable name
- `project_slug` - Package name (hyphens)
- `bundle_id` - App store identifier
- `auth_enabled` / `auth_provider` - Authentication setup
- `enable_eas` - Enable EAS build profiles and OTA updates (default: on)
- `use_mocks` - Include mock data

## Shipping & OTA Updates

> This section applies only when the project was generated with `enable_eas=true` (the default).
> With `enable_eas=false`, there is no `eas.json`, no `expo-updates` dependency or plugin, and no `runtimeVersion`.

Builds and over-the-air (OTA) updates go through [EAS](https://docs.expo.dev/eas/). `eas.json` defines
three build profiles. Each profile is tied to an update channel of the same name:

- `development` - standard internal-distribution build for development, channel `development`
- `preview` - internal-distribution build for testers, channel `preview`
- `production` - store build, channel `production`

A build only receives updates published to its own channel:

```bash
eas build --profile preview        # Build a preview binary on the preview channel
eas update --channel preview       # Publish a JS-only OTA update to preview builds
```

`app.json` sets `runtimeVersion` to `{ "policy": "fingerprint" }`. EAS computes the runtime
version from a fingerprint of the project's native layer, and an OTA update is delivered only to builds
with the same fingerprint. Changing native code, such as adding a native module or config plugin or
bumping the Expo SDK, changes the fingerprint. After a change like that, make a new build with
`eas build`; `eas update` alone cannot ship it.

One-time setup: run `eas init` to link the project to your Expo account, which writes the EAS project
ID into the app config. Then run `eas update:configure` to set `updates.url`. The template does not do
this for you because it has no EAS credentials.

## Customization

### Adding a Screen

1. Create a new file in `app/` (file-based routing):
   ```
   app/(tabs)/profile.tsx      # New tab
   app/items/edit/[id].tsx      # New nested route
   ```
2. Add tab entry in `app/(tabs)/_layout.tsx` if adding a tab

### Modifying the Theme

Edit `src/lib/theme.ts` to change colors, spacing, font sizes, and border radii. All components reference these constants.

### Adding a Provider

1. Create provider in `src/auth/providers/`
2. Return it from its case in `createAuthProvider` (`src/auth/providers/index.ts`)
3. Set `EXPO_PUBLIC_AUTH_PROVIDER` in `.env`

## License

This is free and unencumbered software released into the public domain. See [UNLICENSE](../UNLICENSE) for details.
