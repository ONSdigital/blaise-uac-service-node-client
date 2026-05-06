# Blaise UAC Service Node Client 🔢

A robust, type-safe Node.js client for securely communicating with the Blaise UAC Service. Designed for service-to-service authentication and authorisation, this library provides immutable data contracts and standardised interaction patterns for UAC operations.

## 📝 Usage

Add this repository to your project as a dependency:

```shell
yarn add git+https://github.com/ONSdigital/blaise-uac-service-node-client#<RELEASE_VERSION>
```

Release versions can be found on this repo's [GitHub releases](https://github.com/ONSdigital/blaise-uac-service-node-client/releases).

### Implementation Example

The client is designed for dependency injection. It exposes strongly-typed methods and provides structured error handling for reliable service communication.

```typescript
import { BusClient, AuthenticationError, BusClientError } from "blaise-uac-service-node-client";

// Initialise the client with the base URL of your UAC service
const BUS_URL = process.env.BUS_URL || "";
const BUS_CLIENT_ID = process.env.BUS_CLIENT_ID || "";
const TIMEOUT_MS = 1000;

// Create the client with service URL, client ID, and optional timeout
const busClient = new BusClient(`http://${BUS_URL}`, BUS_CLIENT_ID, TIMEOUT_MS);

export async function authenticateUser() {
  try {
    // Methods are strongly typed, providing compile-time safety
    const response = await busClient.authenticate();
    return response;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error("Authentication failed with UAC Service", error);
    } else if (error instanceof BusClientError) {
      console.error("UAC Service request failed", error);
    }
    throw error;
  }
}
```

### Error Handling

Structured error types are exported for callers that need to distinguish between different failure modes:

```typescript
import { AuthenticationError, BusClientError } from "blaise-uac-service-node-client";

try {
  await busClient.authenticate();
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication failures
  } else if (error instanceof BusClientError) {
    // Handle general request failures
  }
}
```

## 🛠️ Development

### Getting Started

Clone the repository:

```shell
git clone https://github.com/ONSdigital/blaise-uac-service-node-client.git
```

Install dependencies:

```shell
yarn install
```

### Architectural Principles

This library follows strict clean-code principles:

- **Modular Organisation**: Client implementation and auth providers are logically separated within the src/ directory (e.g., busClient, auth providers), enabling maintainability and clear responsibilities.

- **Centralised Contracts**: All data contracts (types and interfaces) reside in the types/ directory to prevent circular dependencies and maintain a single source of truth.

- **Strict Error Handling**: Structured error types provide clear failure modes, allowing consumers to distinguish authentication failures from request failures.

- **Barrel Exports**: The public API surface is strictly controlled via index.ts, ensuring consumers only access intended classes and error types.

### Quality Control

Ensure any changes to authentication logic, token management, or service communication are covered by unit tests.

To run tests:

```shell
yarn test
```

To run linting:

```shell
yarn lint
```

To automatically fix standard linting issues:

```shell
yarn lint-fix
```

### Releasing

After merging to main, [create a new release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) with appropriate release notes. The `package.json` version is automatically updated via GitHub Actions when a release is published.
