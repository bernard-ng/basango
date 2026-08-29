# Basango mobile

The Basango reader is a native Expo application for iOS and Android. Every reader signs in, but
account creation is open to anyone. The initial product surface includes the news feed, article
details and comments, sources and follows, bookmark collections, and account management.

## Local development

From the repository root, install dependencies and start the API and mobile application:

```bash
bun install
bun run dev:api
bun --cwd apps/mobile run start
```

The committed root `.env` points the application at `http://localhost:3080`. A physical device
cannot resolve the computer's `localhost`; override `EXPO_PUBLIC_API_URL` in the root `.env.local`
with the computer's LAN address when testing on a device.

Open the project in Expo Go or a native development build. Web is deliberately not a supported
target.

## Structure

- `src/app` contains Expo Router screen re-exports and framework-owned `_layout.tsx` navigators.
- `src/application` owns authentication, runtime configuration, providers, app-level screens, and
  the typed tRPC client.
- `src/features` groups reader capabilities and their native screens.
- `src/ui` contains the application-local, shadcn-inspired React Native primitives.
- `src/global.css` owns the Uniwind theme tokens and light/dark palettes.

Authentication uses Better Auth with Expo SecureStore-backed session cookies. Password reset links
use the application scheme `basango://reset-password`.
