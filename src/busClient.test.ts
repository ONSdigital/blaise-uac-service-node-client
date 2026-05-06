vi.mock("./auth/authProvider.js", () => ({
  AuthProvider: class MockAuthProvider {
    async getAuthHeader(): Promise<{ Authorization: string }> {
      return { Authorization: "Bearer test-token" };
    }
  },
}));

import { BusClient } from "./busClient.js";
import { BusClientError } from "./errors.js";
import { disabledUacsMock, uacsByCaseIdMock, uacsMock } from "./uac.mock.js";

const fetchMock = vi.fn();
const busUrl = "testUri";
const busClientId = "1234534";
const questionnaireName = "dst2106a";
const busClient = new BusClient(`http://${busUrl}`, busClientId);

function toWireUac(uac: (typeof uacsMock)[string]) {
  const { questionnaire_name, ...rest } = uac;

  return {
    ...rest,
    instrument_name: questionnaire_name,
  };
}

function toWireUacs(uacs: typeof uacsMock) {
  return Object.fromEntries(
    Object.entries(uacs).map(([uac, details]) => [uac, toWireUac(details)]),
  );
}

function toWireUacsByCaseId(uacsByCaseId: typeof uacsByCaseIdMock) {
  return Object.fromEntries(
    Object.entries(uacsByCaseId).map(([caseId, details]) => [caseId, toWireUac(details)]),
  );
}

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

    await client.getUacCount(questionnaireName);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];

    expect(options?.signal).toBeUndefined();
  });

  it("sets a timeout signal when a timeout is configured", async () => {
    const client = new BusClient(`http://${busUrl}`, busClientId, 5000);

    fetchMock.mockResolvedValue(createJsonResponse({ count: 10 }));

    await client.getUacCount(questionnaireName);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];

    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  describe("generateUacs", () => {
    it("generates UACs for the requested case IDs", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(uacsMock, { status: 201 }));

      const result = await busClient.generateUacs(questionnaireName, [
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
          instrument_name: questionnaireName,
          case_ids: ["100000001", "100000002", "100000003"],
        }),
      );
      expect(headers.get("Authorization")).toBe("Bearer test-token");
      expect(headers.get("Content-Type")).toBe("application/json");
      expect(result).toEqual(uacsMock);
    });
  });

  describe("generateUacsForQuestionnaire", () => {
    it("generates UACs for a questionnaire", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(toWireUacs(uacsMock), { status: 201 }));

      const result = await busClient.generateUacsForQuestionnaire(questionnaireName);

      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
      const headers = new Headers(options?.headers);

      expect(url).toBe(`http://${busUrl}/uacs/instrument/${questionnaireName}`);
      expect(options?.method).toBe("POST");
      expect(options?.body).toBeUndefined();
      expect(headers.get("Content-Type")).toBeNull();
      expect(result).toEqual(uacsMock);
    });
  });

  describe("getUacCount", () => {
    it("returns the UAC count", async () => {
      fetchMock.mockResolvedValue(createJsonResponse({ count: 10 }));

      const result = await busClient.getUacCount(questionnaireName);

      expect(result.count).toEqual(10);
    });
  });

  describe("getUacs", () => {
    it("returns UAC details keyed by UAC", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(toWireUacs(uacsMock)));

      const result = await busClient.getUacs(questionnaireName);

      expect(result).toEqual(uacsMock);
    });

    it("defaults questionnaire_name to an empty string when the service omits both field names", async () => {
      fetchMock.mockResolvedValue(
        createJsonResponse({
          "000975653827": {
            case_id: "100000001",
            uac_chunks: {
              uac1: "0009",
              uac2: "7565",
              uac3: "3827",
            },
            full_uac: "000975653827",
            disabled: "false",
          },
        }),
      );

      const result = await busClient.getUacs(questionnaireName);

      expect(result).toEqual({
        "000975653827": {
          case_id: "100000001",
          uac_chunks: {
            uac1: "0009",
            uac2: "7565",
            uac3: "3827",
          },
          full_uac: "000975653827",
          disabled: "false",
          questionnaire_name: "",
        },
      });
    });
  });

  describe("getUacsByCaseId", () => {
    it("returns UAC details keyed by case ID", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(toWireUacsByCaseId(uacsByCaseIdMock)));

      const result = await busClient.getUacsByCaseId(questionnaireName);

      expect(result).toEqual(uacsByCaseIdMock);
    });
  });

  describe("getDisabledUacs", () => {
    it("returns disabled UAC details", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(toWireUacs(disabledUacsMock)));

      const result = await busClient.getDisabledUacs(questionnaireName);

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
      const testUac = "000975653827";

      fetchMock.mockResolvedValue(createJsonResponse({ message: "UAC disabled successfully" }));

      const result = await busClient.disableUac(testUac);

      expect(result.message).toEqual("UAC disabled successfully");
    });
  });

  describe("enableUac", () => {
    it("returns a success message", async () => {
      const testUac = "000975653827";

      fetchMock.mockResolvedValue(createJsonResponse({ message: "UAC enabled successfully" }));

      const result = await busClient.enableUac(testUac);

      expect(result.message).toEqual("UAC enabled successfully");
    });
  });

  describe("error handling", () => {
    it("passes through existing BusClientError instances", async () => {
      const existingError = new BusClientError("existing error", 418);

      fetchMock.mockRejectedValue(existingError);

      await expect(busClient.getUacs(questionnaireName)).rejects.toBe(existingError);
    });

    it("wraps network errors in BusClientError", async () => {
      fetchMock.mockRejectedValue(new Error("network error"));

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "network error",
        originalError: expect.any(Error),
      });
    });

    it("preserves the HTTP status code and server error message for HTTP errors", async () => {
      fetchMock.mockResolvedValue(
        createJsonResponse({ error: "Internal Server Error" }, { status: 500 }),
      );

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "Internal Server Error",
        statusCode: 500,
      });
    });

    it("preserves message fields from HTTP error responses", async () => {
      fetchMock.mockResolvedValue(createJsonResponse({ message: "Rate limited" }, { status: 429 }));

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
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

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
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

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "Gateway unavailable",
        statusCode: 504,
      });
    });

    it("falls back to a generic HTTP message when the error body is empty", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 502 }));

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "Request failed with status 502",
        statusCode: 502,
      });
    });

    it("wraps POST errors in BusClientError", async () => {
      fetchMock.mockResolvedValue(createJsonResponse({ error: "Bad Request" }, { status: 400 }));

      await expect(busClient.generateUacs(questionnaireName, ["123"])).rejects.toBeInstanceOf(
        BusClientError,
      );
    });

    it("wraps generic Error values", async () => {
      fetchMock.mockRejectedValue(new Error("Generic error"));

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "Generic error",
        originalError: expect.any(Error),
      });
    });

    it("uses a generic message for non-Error throws", async () => {
      fetchMock.mockRejectedValue("string error");

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "An unknown error occurred",
        originalError: undefined,
      });
    });

    it("wraps timeout errors from fetch", async () => {
      const timeoutError = new Error("The operation timed out");

      timeoutError.name = "TimeoutError";
      fetchMock.mockRejectedValue(timeoutError);

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "The operation timed out",
        originalError: timeoutError,
      });
    });

    it("fails with a BusClientError when a successful response body is empty", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 205 }));

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "Response body was empty",
        statusCode: undefined,
      });
    });
  });
});
