# bus-api-node-client
Provides a node client to communicate securely to the Blaise UAC Service

### Consuming

Add a dependency to your package.json file:
```
"bus-api-node-client": "git+https://github.com/ONSdigital/bus-api-node-client"
```

Add an import statement where you wish to consume the client and interfaces:
```
import BusApiClient from "bus-api-node-client";
```

Declare and consume the client by passing the URL of the api and the client ID:
```
const busApiClient = new BusApiClient(`http://${BUS_API_URL}`, ${BUS_CLIENT_ID});
```

Declare timeout for the HTTP client:
```
The client accpets a timeout in milliseconds (timeoutInMs) number parameter if you wish to explicitly set
a timeout for the client. If this parameter is not passed then the default is used.

To specify a timeout you need to instantiate the client as follows, where 1000 is the 
timeout required:

const busApiClient = new BusApiClient(`http://${BUS_API_URL}`, ${BUS_CLIENT_ID}, 1000);
```

### Mock objects

Mock objects are available for use in tests

```
const {InstrumentUacDetailsMock, InstrumentUacDetailsByCaseIdMock} = jest.requireActual("bus-api-node-client");
```
