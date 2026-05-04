import * as publicExports from "./index.js";

import BusClientDefault, {
  AuthenticationError,
  BusClient,
  BusClientError,
  disabledUacsMock,
  uacsByCaseIdMock,
  uacsMock,
} from "./index.js";

describe("public exports", () => {
  it("exports the client as the default export and named export", () => {
    expect(BusClientDefault).toBe(BusClient);
  });

  it("exports structured errors and canonical mock data", () => {
    expect(new AuthenticationError("auth failed")).toBeInstanceOf(BusClientError);
    expect(publicExports.uacsMock).toBe(uacsMock);
    expect(publicExports.uacsByCaseIdMock).toBe(uacsByCaseIdMock);
    expect(publicExports.disabledUacsMock).toBe(disabledUacsMock);
  });

  it("does not export legacy mock aliases", () => {
    expect(publicExports).not.toHaveProperty("InstrumentUacDetailsMock");
    expect(publicExports).not.toHaveProperty("InstrumentUacDetailsByCaseIdMock");
    expect(publicExports).not.toHaveProperty("InstrumentDisabledUacDetailsMock");
  });
});
