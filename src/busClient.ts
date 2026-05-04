import AuthProvider from "./auth/authProvider.js";
import { BusClientError } from "./errors.js";
import {
  type Uacs,
  type UacsByCaseId,
  type UacCount,
  type UacImport,
  type UacEnableDisableResponse,
} from "./uac.types.js";

class BusClient {
  private readonly busUrl: string;
  private readonly authProvider: AuthProvider;
  private readonly timeoutInMs?: number;

  constructor(busUrl: string, busClientId: string, timeoutInMs?: number) {
    this.busUrl = busUrl.replace(/\/+$/, "");
    this.authProvider = new AuthProvider(busClientId);
    this.timeoutInMs = timeoutInMs;
  }

  async generateUacCodes(instrumentName: string, caseIds: string[]): Promise<Uacs> {
    return this.post<Uacs>("/uacs/generate", {
      instrument_name: instrumentName,
      case_ids: caseIds,
    });
  }

  async generateUacCodesForInstrument(instrumentName: string): Promise<Uacs> {
    return this.post<Uacs>(`/uacs/instrument/${instrumentName}`, null);
  }

  async getUacCodeCount(instrumentName: string): Promise<UacCount> {
    return this.get<UacCount>(`/uacs/instrument/${instrumentName}/count`);
  }

  async getUacCodes(instrumentName: string): Promise<Uacs> {
    return this.get<Uacs>(`/uacs/instrument/${instrumentName}`);
  }

  async getUacCodesByCaseId(instrumentName: string): Promise<UacsByCaseId> {
    return this.get<UacsByCaseId>(`/uacs/instrument/${instrumentName}/bycaseid`);
  }

  async importUacs(uacs: string[]): Promise<UacImport> {
    return this.post<UacImport>("/uacs/import", uacs);
  }

  async getDisabledUacCodes(instrumentName: string): Promise<Uacs> {
    return this.get<Uacs>(`/uacs/uac/${instrumentName}/disabled`);
  }

  async enableUac(uac: string): Promise<UacEnableDisableResponse> {
    return this.get<UacEnableDisableResponse>(`/uacs/uac/enable/${uac}`);
  }

  async disableUac(uac: string): Promise<UacEnableDisableResponse> {
    return this.get<UacEnableDisableResponse>(`/uacs/uac/disable/${uac}`);
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  private async post<T>(path: string, data: unknown): Promise<T> {
    const body = data === null ? undefined : JSON.stringify(data);

    return this.request<T>(path, {
      method: "POST",
      body,
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    try {
      const headers = new Headers(init.headers);
      const authHeader = await this.authProvider.getAuthHeader();

      headers.set("Authorization", authHeader.Authorization);

      if (init.body !== undefined) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(`${this.busUrl}${path}`, {
        ...init,
        headers,
        signal: this.timeoutInMs === undefined ? undefined : AbortSignal.timeout(this.timeoutInMs),
      });

      const responseBody = await this.readResponseBody(response);

      if (!response.ok) {
        throw new BusClientError(
          this.getErrorMessage(response.status, responseBody),
          response.status,
        );
      }

      if (responseBody === undefined) {
        throw new BusClientError("Response body was empty");
      }

      return responseBody as T;
    } catch (error) {
      throw this.toBusClientError(error);
    }
  }

  private getErrorMessage(statusCode: number, responseBody: unknown): string {
    if (typeof responseBody === "string" && responseBody.trim() !== "") {
      return responseBody;
    }

    if (BusClient.hasMessage(responseBody)) {
      return responseBody.message;
    }

    if (BusClient.hasError(responseBody)) {
      return responseBody.error;
    }

    return `Request failed with status ${statusCode}`;
  }

  private async readResponseBody(response: Response): Promise<unknown> {
    if (response.status === 204 || response.status === 205) {
      return undefined;
    }

    const responseText = await response.text();

    if (responseText === "") {
      return undefined;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return JSON.parse(responseText) as unknown;
    }

    return responseText;
  }

  private static hasMessage(responseBody: unknown): responseBody is { message: string } {
    return (
      typeof responseBody === "object" &&
      responseBody !== null &&
      "message" in responseBody &&
      typeof responseBody.message === "string"
    );
  }

  private static hasError(responseBody: unknown): responseBody is { error: string } {
    return (
      typeof responseBody === "object" &&
      responseBody !== null &&
      "error" in responseBody &&
      typeof responseBody.error === "string"
    );
  }

  private toBusClientError(error: unknown): BusClientError {
    if (error instanceof BusClientError) {
      return error;
    }

    return new BusClientError(
      error instanceof Error ? error.message : "An unknown error occurred",
      undefined,
      error instanceof Error ? error : undefined,
    );
  }
}

export default BusClient;
