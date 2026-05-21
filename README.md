# Blaise UAC Service Node Client 🔢

A typed Node.js client for communicating with the Blaise UAC Service. It is designed for service-to-service authentication and keeps the runtime surface small: generate, fetch, import, enable, and disable UACs through a single client.

## 📝 Usage

Add this repository to your project as a dependency:

```shell
yarn add git+https://github.com/ONSdigital/blaise-uac-service-node-client#<RELEASE_VERSION>
```

Release versions can be found on this repo's [GitHub releases](https://github.com/ONSdigital/blaise-uac-service-node-client/releases).

### Implementation Example

The client keeps the default Google auth flow built in, while still allowing an injected authorization header provider when a service needs a different credential source.

```typescript
import { BusClient, AuthenticationError, BusClientError } from "blaise-uac-service-node-client";

const busUrl = process.env.BUS_URL;
const busClientId = process.env.BUS_CLIENT_ID;
const TIMEOUT_MS = 1000;

if (!busUrl || !busClientId) {
  throw new Error("BUS_URL and BUS_CLIENT_ID must be set");
}

const busClient = new BusClient(busUrl, busClientId, TIMEOUT_MS);

export async function getQuestionnaireUacs(questionnaireName: string) {
  try {
    return await busClient.getUacs(questionnaireName);
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
import { AuthenticationError, BusClient, BusClientError } from "blaise-uac-service-node-client";

const busUrl = process.env.BUS_URL;
const busClientId = process.env.BUS_CLIENT_ID;

if (!busUrl || !busClientId) {
  throw new Error("BUS_URL and BUS_CLIENT_ID must be set");
}

const busClient = new BusClient(busUrl, busClientId);

try {
  await busClient.getUacCount("dst2106a");
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

- **Centralised Contracts**: Public data contracts are defined in src/uac.types.ts to keep the package surface explicit and easy to review.

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
