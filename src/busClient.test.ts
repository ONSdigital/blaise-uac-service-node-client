vi.mock("./auth/authProvider.js", () => ({
  default: class MockAuthProvider {
    async getAuthHeader(): Promise<{ Authorization: string }> {
      return { Authorization: "Bearer test-token" };
    }
  },
}));

import BusClient from "./busClient.js";
import { BusClientError } from "./errors.js";
import { disabledUacsMock, uacsMock, uacsByCaseIdMock } from "./uac.mocks.js";

const fetchMock = vi.fn();
const busUrl = "testUri";
const busClientId = "1234534";
const instrumentName = "dst2106a";
const busClient = new BusClient(`http://${busUrl}`, busClientId);

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);

  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BusClient", () => {
  it("does not expose the legacy importUACs alias", () => {
    expect("importUACs" in busClient).toBe(false);
  });

  it("does not set a timeout signal when no timeout is configured", async () => {
    const client = new BusClient(`http://${busUrl}`, busClientId);

    fetchMock.mockResolvedValue(createJsonResponse({ count: 10 }));

    await client.getUacCodeCount(instrumentName);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];

    expect(options?.signal).toBeUndefined();
  });

  it("sets a timeout signal when a timeout is configured", async () => {
    const client = new BusClient(`http://${busUrl}`, busClientId, 5000);

    fetchMock.mockResolvedValue(createJsonResponse({ count: 10 }));

    await client.getUacCodeCount(instrumentName);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];

    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  describe("generateUacCodes", () => {
    it("generates UACs for the requested case IDs", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(uacsMock, { status: 201 }));

      const result = await busClient.generateUacCodes(instrumentName, [
        "100000001",
        "100000002",
        "100000003",
      ]);

      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
      const headers = new Headers(options?.headers);

      expect(url).toBe(`http://${busUrl}/uacs/generate`);
      expect(options?.method).toBe("POST");
      expect(options?.body).toBe(
        JSON.stringify({
          instrument_name: instrumentName,
          case_ids: ["100000001", "100000002", "100000003"],
        }),
      );
      expect(headers.get("Authorization")).toBe("Bearer test-token");
      expect(headers.get("Content-Type")).toBe("application/json");
      expect(result).toEqual(uacsMock);
    });
  });

  describe("generateUacCodesForInstrument", () => {
    it("generates UACs for an instrument", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(uacsMock, { status: 201 }));

      const result = await busClient.generateUacCodesForInstrument(instrumentName);

      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
      const headers = new Headers(options?.headers);

      expect(url).toBe(`http://${busUrl}/uacs/instrument/${instrumentName}`);
      expect(options?.method).toBe("POST");
      expect(options?.body).toBeUndefined();
      expect(headers.get("Content-Type")).toBeNull();
      expect(result).toEqual(uacsMock);
    });
  });

  describe("getUacCodeCount", () => {
    it("returns the UAC count", async () => {
      fetchMock.mockResolvedValue(createJsonResponse({ count: 10 }));

      const result = await busClient.getUacCodeCount(instrumentName);

      expect(result.count).toEqual(10);
    });
  });

  describe("getUacCodes", () => {
    it("returns UAC details keyed by UAC", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(uacsMock));

      const result = await busClient.getUacCodes(instrumentName);

      expect(result).toEqual(uacsMock);
    });
  });

  describe("getUacCodesByCaseId", () => {
    it("returns UAC details keyed by case ID", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(uacsByCaseIdMock));

      const result = await busClient.getUacCodesByCaseId(instrumentName);

      expect(result).toEqual(uacsByCaseIdMock);
    });
  });

  describe("getDisabledUacCodes", () => {
    it("returns disabled UAC details", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(disabledUacsMock));

      const result = await busClient.getDisabledUacCodes(instrumentName);

      expect(result).toEqual(disabledUacsMock);
    });
  });

  describe("importUacs", () => {
    it("returns the number of imported UACs", async () => {
      fetchMock.mockResolvedValue(createJsonResponse({ uacs_imported: 2 }));

      const result = await busClient.importUacs(["123412341234", "432143214321"]);

      expect(result.uacs_imported).toEqual(2);
    });
  });

  describe("disableUac", () => {
    it("returns a success message", async () => {
      const testUacCode = "000975653827";

      fetchMock.mockResolvedValue(createJsonResponse({ message: "UAC disabled successfully" }));

      const result = await busClient.disableUac(testUacCode);

      expect(result.message).toEqual("UAC disabled successfully");
    });
  });

  describe("enableUac", () => {
    it("returns a success message", async () => {
      const testUacCode = "000975653827";

      fetchMock.mockResolvedValue(createJsonResponse({ message: "UAC enabled successfully" }));

      const result = await busClient.enableUac(testUacCode);

      expect(result.message).toEqual("UAC enabled successfully");
    });
  });

  describe("error handling", () => {
    it("passes through existing BusClientError instances", async () => {
      const existingError = new BusClientError("existing error", 418);

      fetchMock.mockRejectedValue(existingError);

      await expect(busClient.getUacCodes(instrumentName)).rejects.toBe(existingError);
    });

    it("wraps network errors in BusClientError", async () => {
      fetchMock.mockRejectedValue(new Error("network error"));

      await expect(busClient.getUacCodes(instrumentName)).rejects.toMatchObject({
        message: "network error",
        originalError: expect.any(Error),
      });
    });

    it("preserves the HTTP status code and server error message for HTTP errors", async () => {
      fetchMock.mockResolvedValue(
        createJsonResponse({ error: "Internal Server Error" }, { status: 500 }),
      );

      await expect(busClient.getUacCodes(instrumentName)).rejects.toMatchObject({
        message: "Internal Server Error",
        statusCode: 500,
      });
    });

    it("preserves message fields from HTTP error responses", async () => {
      fetchMock.mockResolvedValue(createJsonResponse({ message: "Rate limited" }, { status: 429 }));

      await expect(busClient.getUacCodes(instrumentName)).rejects.toMatchObject({
        message: "Rate limited",
        statusCode: 429,
      });
    });

    it("preserves plain-text HTTP error responses", async () => {
      fetchMock.mockResolvedValue(
        new Response("Service unavailable", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        }),
      );

      await expect(busClient.getUacCodes(instrumentName)).rejects.toMatchObject({
        message: "Service unavailable",
        statusCode: 503,
      });
    });

    it("preserves HTTP error bodies when the content-type header is missing", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          new Uint8Array([
            71, 97, 116, 101, 119, 97, 121, 32, 117, 110, 97, 118, 97, 105, 108, 97, 98, 108, 101,
          ]),
          {
            status: 504,
          },
        ),
      );

      await expect(busClient.getUacCodes(instrumentName)).rejects.toMatchObject({
        message: "Gateway unavailable",
        statusCode: 504,
      });
    });

    it("falls back to a generic HTTP message when the error body is empty", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 502 }));

      await expect(busClient.getUacCodes(instrumentName)).rejects.toMatchObject({
        message: "Request failed with status 502",
        statusCode: 502,
      });
    });

    it("wraps POST errors in BusClientError", async () => {
      fetchMock.mockResolvedValue(createJsonResponse({ error: "Bad Request" }, { status: 400 }));

      await expect(busClient.generateUacCodes(instrumentName, ["123"])).rejects.toBeInstanceOf(
        BusClientError,
      );
    });

    it("wraps generic Error values", async () => {
      fetchMock.mockRejectedValue(new Error("Generic error"));

      await expect(busClient.getUacCodes(instrumentName)).rejects.toMatchObject({
        message: "Generic error",
        originalError: expect.any(Error),
      });
    });

    it("uses a generic message for non-Error throws", async () => {
      fetchMock.mockRejectedValue("string error");

      await expect(busClient.getUacCodes(instrumentName)).rejects.toMatchObject({
        message: "An unknown error occurred",
        originalError: undefined,
      });
    });

    it("wraps timeout errors from fetch", async () => {
      const timeoutError = new Error("The operation timed out");

      timeoutError.name = "TimeoutError";
      fetchMock.mockRejectedValue(timeoutError);

      await expect(busClient.getUacCodes(instrumentName)).rejects.toMatchObject({
        message: "The operation timed out",
        originalError: timeoutError,
      });
    });

    it("fails with a BusClientError when a successful response body is empty", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 205 }));

      await expect(busClient.getUacCodes(instrumentName)).rejects.toMatchObject({
        message: "Response body was empty",
        statusCode: undefined,
      });
    });
  });
});
