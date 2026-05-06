import { AuthProvider } from "./auth/authProvider.js";
import { BusClientError } from "./errors.js";
import {
  type Uac,
  type UacCount,
  type UacEnableDisableResponse,
  type UacImport,
  type Uacs,
  type UacsByCaseId,
} from "./uac.types.js";

type WireUac = Omit<Uac, "questionnaire_name"> & {
  instrument_name?: string;
  questionnaire_name?: string;
};

type WireUacs = Record<string, WireUac>;
type WireUacsByCaseId = Record<string, WireUac>;

export class BusClient {
  private readonly busUrl: string;
  private readonly authProvider: AuthProvider;
  private readonly timeoutInMs?: number;

  constructor(busUrl: string, busClientId: string, timeoutInMs?: number) {
    this.busUrl = busUrl.replace(/\/+$/, "");
    this.authProvider = new AuthProvider(busClientId);
    this.timeoutInMs = timeoutInMs;
  }

  async generateUacs(questionnaireName: string, caseIds: string[]): Promise<Uacs> {
    const response = await this.post<WireUacs>("/uacs/generate", {
      instrument_name: questionnaireName,
      case_ids: caseIds,
    });

    return BusClient.normaliseUacs(response);
  }

  async generateUacsForQuestionnaire(questionnaireName: string): Promise<Uacs> {
    const response = await this.post<WireUacs>(`/uacs/instrument/${questionnaireName}`, null);

    return BusClient.normaliseUacs(response);
  }

  async getUacCount(questionnaireName: string): Promise<UacCount> {
    return this.get<UacCount>(`/uacs/instrument/${questionnaireName}/count`);
  }

  async getUacs(questionnaireName: string): Promise<Uacs> {
    const response = await this.get<WireUacs>(`/uacs/instrument/${questionnaireName}`);

    return BusClient.normaliseUacs(response);
  }

  async getUacsByCaseId(questionnaireName: string): Promise<UacsByCaseId> {
    const response = await this.get<WireUacsByCaseId>(
      `/uacs/instrument/${questionnaireName}/bycaseid`,
    );

    return BusClient.normaliseUacsByCaseId(response);
  }

  async importUacs(uacs: string[]): Promise<UacImport> {
    return this.post<UacImport>("/uacs/import", uacs);
  }

  async getDisabledUacs(questionnaireName: string): Promise<Uacs> {
    const response = await this.get<WireUacs>(`/uacs/uac/${questionnaireName}/disabled`);

    return BusClient.normaliseUacs(response);
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

  private static normaliseUac(uac: WireUac): Uac {
    const { instrument_name, questionnaire_name, ...rest } = uac;

    return {
      ...rest,
      questionnaire_name: questionnaire_name ?? instrument_name ?? "",
    };
  }

  private static normaliseUacs(uacs: WireUacs): Uacs {
    return Object.fromEntries(
      Object.entries(uacs).map(([uac, details]) => [uac, BusClient.normaliseUac(details)]),
    );
  }

  private static normaliseUacsByCaseId(uacsByCaseId: WireUacsByCaseId): UacsByCaseId {
    return Object.fromEntries(
      Object.entries(uacsByCaseId).map(([caseId, details]) => [
        caseId,
        BusClient.normaliseUac(details),
      ]),
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
