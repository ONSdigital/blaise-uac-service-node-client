# BusClient

TypeScript ESM client for communicating securely with the Blaise UAC Service.

## Consuming

Add the dependency to your `package.json` file:

```json
"blaise-uac-service-node-client": "git+https://github.com/ONSdigital/blaise-uac-service-node-client.git"
```

Import the client from the package root:

```ts
import { BusClient } from "blaise-uac-service-node-client";
```

Create the client by passing the service URL and client ID:

```ts
const busClient = new BusClient(`http://${BUS_URL}`, BUS_CLIENT_ID);
```

If needed, pass an explicit timeout in milliseconds:

```ts
const busClient = new BusClient(`http://${BUS_URL}`, BUS_CLIENT_ID, 1000);
```

The package exports `BusClient` as both the default export and a named export.

## Errors

Structured error types are exported for callers that want to distinguish authentication failures from request failures:

```ts
import { AuthenticationError, BusClientError } from "blaise-uac-service-node-client";
```

## Mock Objects

Mock data is exported for consumer tests:

```ts
import { disabledUacsMock, uacsByCaseIdMock, uacsMock } from "blaise-uac-service-node-client";
```
