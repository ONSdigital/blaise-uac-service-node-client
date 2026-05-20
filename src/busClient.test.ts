vi.mock("./auth/authProvider.js", () => ({
  AuthProvider: class MockAuthProvider {
    async getAuthorizationHeader(): Promise<string> {
      return "Bearer test-token";
    }
  },
}));

import { BusClient } from "./busClient.js";
import { BusClientError } from "./errors.js";
import { disabledUacsMock, uacsByCaseIdMock, uacsMock } from "./uac.mock.js";
import { type Uac, type Uacs, type UacsByCaseId } from "./uac.types.js";

const fetchMock = vi.fn();
const busUrl = "testUri";
const normalisedBusUrl = "testuri";
const busClientId = "1234534";
const questionnaireName = "dst2106a";
const busClient = new BusClient(`http://${busUrl}`, busClientId);

function getFetchCall(callIndex = 0) {
  const call = fetchMock.mock.calls[callIndex];

  if (call === undefined) {
    throw new Error("Expected fetch to be called");
  }

  const [url, options] = call;

  return {
    url: String(url),
    options,
  };
}

function toWireUac(uac: Uac) {
  const { disabled, questionnaire_name, ...rest } = uac;

  return {
    ...rest,
    disabled: disabled ? "true" : "false",
    instrument_name: questionnaire_name,
  };
}

function toWireUacs(uacs: Uacs) {
  return Object.fromEntries(
    Object.entries(uacs).map(([uac, details]) => [uac, toWireUac(details)]),
  );
}

function toWireUacsByCaseId(uacsByCaseId: UacsByCaseId) {
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
  vi.restoreAllMocks();
});

describe("BusClient", () => {
  describe("constructor", () => {
    it("rejects an empty bus URL", () => {
      expect(() => new BusClient("   ", busClientId)).toThrowError(
        new TypeError("busUrl is required"),
      );
    });

    it("rejects a non-HTTP bus URL", () => {
      expect(() => new BusClient("ftp://example.com", busClientId)).toThrowError(
        new TypeError("busUrl must use http or https"),
      );
    });

    it("rejects an empty client ID", () => {
      expect(() => new BusClient(`http://${busUrl}`, "   ")).toThrowError(
        new TypeError("busClientId is required"),
      );
    });

    it("accepts an injected authorization header provider", async () => {
      const authorizationHeaderProvider = {
        getAuthorizationHeader: vi.fn().mockResolvedValue("Bearer injected-token"),
      };
      const client = new BusClient(`http://${busUrl}`, authorizationHeaderProvider);

      fetchMock.mockResolvedValue(createJsonResponse({ count: 10 }));

      await client.getUacCount(questionnaireName);

      const { options } = getFetchCall();
      const headers = new Headers(options?.headers);

      expect(authorizationHeaderProvider.getAuthorizationHeader).toHaveBeenCalledTimes(1);
      expect(headers.get("Authorization")).toBe("Bearer injected-token");
    });

    it("rejects an unparseable bus URL", () => {
      expect(() => new BusClient("://invalid", busClientId)).toThrowError(
        new TypeError("busUrl must be an absolute http or https URL"),
      );
    });
  });

  it("does not expose the legacy importUACs alias", () => {
    expect("importUACs" in busClient).toBe(false);
  });

  it("does not set a timeout signal when no timeout is configured", async () => {
    const client = new BusClient(`http://${busUrl}`, busClientId);

    fetchMock.mockResolvedValue(createJsonResponse({ count: 10 }));

    await client.getUacCount(questionnaireName);

    const { options } = getFetchCall();

    expect(options?.signal).toBeUndefined();
  });

  it("sets a timeout signal when a timeout is configured", async () => {
    const client = new BusClient(`http://${busUrl}`, busClientId, 5000);

    fetchMock.mockResolvedValue(createJsonResponse({ count: 10 }));

    await client.getUacCount(questionnaireName);

    const { options } = getFetchCall();

    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  describe("generateUacs", () => {
    it("generates UACs for the requested case IDs", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(toWireUacs(uacsMock), { status: 201 }));

      const result = await busClient.generateUacs(questionnaireName, [
        "100000001",
        "100000002",
        "100000003",
      ]);

      const { url, options } = getFetchCall();
      const headers = new Headers(options?.headers);

      expect(url).toBe(`http://${normalisedBusUrl}/uacs/generate`);
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

      const { url, options } = getFetchCall();
      const headers = new Headers(options?.headers);

      expect(url).toBe(`http://${normalisedBusUrl}/uacs/instrument/${questionnaireName}`);
      expect(options?.method).toBe("POST");
      expect(options?.body).toBeUndefined();
      expect(headers.get("Content-Type")).toBeNull();
      expect(result).toEqual(uacsMock);
    });

    it("encodes questionnaire names before placing them in the URL path", async () => {
      fetchMock.mockResolvedValue(createJsonResponse(toWireUacs(uacsMock), { status: 201 }));

      await busClient.generateUacsForQuestionnaire("dst 2106/a?");

      const { url } = getFetchCall();

      expect(url).toBe(`http://${normalisedBusUrl}/uacs/instrument/dst%202106%2Fa%3F`);
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

    it("rejects malformed UAC records when the service omits both field names", async () => {
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

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "Response body was not in the expected format",
      });
    });

    it("parses a UAC record that uses questionnaire_name directly and has no full_uac", async () => {
      fetchMock.mockResolvedValue(
        createJsonResponse({
          "000975653827": {
            questionnaire_name: "dst2106a",
            case_id: "100000001",
            uac_chunks: { uac1: "0009", uac2: "7565", uac3: "3827" },
            disabled: false,
          },
        }),
      );

      const result = await busClient.getUacs(questionnaireName);

      expect(result["000975653827"]).toEqual({
        questionnaire_name: "dst2106a",
        case_id: "100000001",
        uac_chunks: { uac1: "0009", uac2: "7565", uac3: "3827" },
        disabled: false,
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

    it("encodes UAC values before placing them in the URL path", async () => {
      fetchMock.mockResolvedValue(createJsonResponse({ message: "UAC disabled successfully" }));

      await busClient.disableUac("0009/7565?");

      const { url } = getFetchCall();

      expect(url).toBe(`http://${normalisedBusUrl}/uacs/uac/disable/0009%2F7565%3F`);
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

    it("preserves the HTTP status code when a JSON response body is invalid", async () => {
      fetchMock.mockResolvedValue(
        new Response("{", {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }),
      );

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "Response body was not valid JSON",
        statusCode: 502,
        originalError: expect.any(SyntaxError),
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

    it("rejects a response body that is not an object record", async () => {
      fetchMock.mockResolvedValue(createJsonResponse([{ count: 10 }]));

      await expect(busClient.getUacCount(questionnaireName)).rejects.toMatchObject({
        message: "Response body was not in the expected format",
      });
    });

    it("rejects a response body when a required string field is not a string", async () => {
      fetchMock.mockResolvedValue(
        createJsonResponse({
          "000975653827": {
            questionnaire_name: "dst2106a",
            case_id: 12345,
            uac_chunks: { uac1: "0009", uac2: "7565", uac3: "3827" },
            disabled: "false",
          },
        }),
      );

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "Response body was not in the expected format",
      });
    });

    it("rejects a response body when an optional string field is present but not a string", async () => {
      fetchMock.mockResolvedValue(
        createJsonResponse({
          "000975653827": {
            questionnaire_name: "dst2106a",
            case_id: "100000001",
            uac_chunks: { uac1: "0009", uac2: "7565", uac3: "3827" },
            full_uac: 12345,
            disabled: "false",
          },
        }),
      );

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "Response body was not in the expected format",
      });
    });

    it("rejects a response body when a required number field is not a number", async () => {
      fetchMock.mockResolvedValue(createJsonResponse({ count: "not-a-number" }));

      await expect(busClient.getUacCount(questionnaireName)).rejects.toMatchObject({
        message: "Response body was not in the expected format",
      });
    });

    it("rejects a UAC response when the disabled field is an invalid value", async () => {
      fetchMock.mockResolvedValue(
        createJsonResponse({
          "000975653827": {
            questionnaire_name: "dst2106a",
            case_id: "100000001",
            uac_chunks: { uac1: "0009", uac2: "7565", uac3: "3827" },
            disabled: null,
          },
        }),
      );

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "Response body was not in the expected format",
      });
    });

    it("passes undefined as originalError when JSON.parse throws a non-Error value", async () => {
      vi.spyOn(JSON, "parse").mockImplementationOnce(() => {
        throw "string error";
      });
      fetchMock.mockResolvedValue(
        new Response("{bad", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      await expect(busClient.getUacs(questionnaireName)).rejects.toMatchObject({
        message: "Response body was not valid JSON",
        originalError: undefined,
      });
    });
  });
});
