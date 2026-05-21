import { type AuthorizationHeaderProvider, AuthProvider } from "./auth/authProvider.js";
import { BusClientError } from "./errors.js";
import {
  type Uac,
  type UacCount,
  type UacEnableDisableResponse,
  type UacImport,
  type Uacs,
  type UacsByCaseId,
} from "./uac.types.js";

const INVALID_RESPONSE_BODY_MESSAGE = "Response body was not in the expected format";

type WireUac = Omit<Uac, "questionnaire_name"> & {
  instrument_name?: string;
  questionnaire_name?: string;
};

export class BusClient {
  private readonly busUrl: string;
  private readonly authorizationHeaderProvider: AuthorizationHeaderProvider;
  private readonly timeoutMs?: number;

  constructor(busUrl: string, busClientId: string, timeoutMs?: number);
  constructor(
    busUrl: string,
    authorizationHeaderProvider: AuthorizationHeaderProvider,
    timeoutMs?: number,
  );
  constructor(
    busUrl: string,
    busClientIdOrAuthorizationHeaderProvider: string | AuthorizationHeaderProvider,
    timeoutMs?: number,
  ) {
    this.busUrl = BusClient.normaliseBusUrl(busUrl);
    this.authorizationHeaderProvider = BusClient.createAuthorizationHeaderProvider(
      busClientIdOrAuthorizationHeaderProvider,
    );
    this.timeoutMs = timeoutMs;
  }

  private static createAuthorizationHeaderProvider(
    busClientIdOrAuthorizationHeaderProvider: string | AuthorizationHeaderProvider,
  ): AuthorizationHeaderProvider {
    if (typeof busClientIdOrAuthorizationHeaderProvider !== "string") {
      return busClientIdOrAuthorizationHeaderProvider;
    }

    const trimmedBusClientId = busClientIdOrAuthorizationHeaderProvider.trim();

    if (trimmedBusClientId === "") {
      throw new TypeError("busClientId is required");
    }

    return new AuthProvider(trimmedBusClientId);
  }

  async generateUacs(questionnaireName: string, caseIds: string[]): Promise<Uacs> {
    const response = await this.post("/uacs/generate", {
      instrument_name: questionnaireName,
      case_ids: caseIds,
    });

    return BusClient.parseUacRecord(response);
  }

  async generateUacsForQuestionnaire(questionnaireName: string): Promise<Uacs> {
    const response = await this.post(
      `/uacs/instrument/${encodeURIComponent(questionnaireName)}`,
      null,
    );

    return BusClient.parseUacRecord(response);
  }

  async getUacCount(questionnaireName: string): Promise<UacCount> {
    const response = await this.request(
      `/uacs/instrument/${encodeURIComponent(questionnaireName)}/count`,
    );

    return BusClient.parseUacCount(response);
  }

  async getUacs(questionnaireName: string): Promise<Uacs> {
    const response = await this.request(
      `/uacs/instrument/${encodeURIComponent(questionnaireName)}`,
    );

    return BusClient.parseUacRecord(response);
  }

  async getUacsByCaseId(questionnaireName: string): Promise<UacsByCaseId> {
    const response = await this.request(
      `/uacs/instrument/${encodeURIComponent(questionnaireName)}/bycaseid`,
    );

    return BusClient.parseUacRecord(response);
  }

  async importUacs(uacs: string[]): Promise<UacImport> {
    const response = await this.post("/uacs/import", uacs);

    return BusClient.parseUacImport(response);
  }

  async getDisabledUacs(questionnaireName: string): Promise<Uacs> {
    const response = await this.request(
      `/uacs/uac/${encodeURIComponent(questionnaireName)}/disabled`,
    );

    return BusClient.parseUacRecord(response);
  }

  async enableUac(uac: string): Promise<UacEnableDisableResponse> {
    const response = await this.request(`/uacs/uac/enable/${encodeURIComponent(uac)}`);

    return BusClient.parseUacEnableDisableResponse(response);
  }

  async disableUac(uac: string): Promise<UacEnableDisableResponse> {
    const response = await this.request(`/uacs/uac/disable/${encodeURIComponent(uac)}`);

    return BusClient.parseUacEnableDisableResponse(response);
  }

  private async post(path: string, data: unknown): Promise<unknown> {
    const body = data === null ? undefined : JSON.stringify(data);

    return this.request(path, {
      method: "POST",
      body,
    });
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    try {
      const headers = new Headers(init.headers);
      const authorizationHeader = await this.authorizationHeaderProvider.getAuthorizationHeader();

      headers.set("Authorization", authorizationHeader);

      if (init.body !== undefined) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(`${this.busUrl}${path}`, {
        ...init,
        headers,
        signal: this.timeoutMs === undefined ? undefined : AbortSignal.timeout(this.timeoutMs),
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

      return responseBody;
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
      return this.parseJsonResponse(responseText, response.status);
    }

    return responseText;
  }

  private parseJsonResponse(responseText: string, statusCode: number): unknown {
    try {
      return JSON.parse(responseText);
    } catch (error) {
      throw new BusClientError(
        "Response body was not valid JSON",
        statusCode,
        error instanceof Error ? error : undefined,
      );
    }
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

  private static isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private static getObjectRecord(value: unknown): Record<string, unknown> {
    if (!BusClient.isObjectRecord(value)) {
      throw new BusClientError(INVALID_RESPONSE_BODY_MESSAGE);
    }

    return value;
  }

  private static getRequiredStringField(
    record: Record<string, unknown>,
    fieldName: string,
  ): string {
    const value = record[fieldName];

    if (typeof value !== "string") {
      throw new BusClientError(INVALID_RESPONSE_BODY_MESSAGE);
    }

    return value;
  }

  private static getOptionalStringField(
    record: Record<string, unknown>,
    fieldName: string,
  ): string | undefined {
    const value = record[fieldName];

    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "string") {
      throw new BusClientError(INVALID_RESPONSE_BODY_MESSAGE);
    }

    return value;
  }

  private static getRequiredNumberField(
    record: Record<string, unknown>,
    fieldName: string,
  ): number {
    const value = record[fieldName];

    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new BusClientError(INVALID_RESPONSE_BODY_MESSAGE);
    }

    return value;
  }

  private static parseUacCount(responseBody: unknown): UacCount {
    const record = BusClient.getObjectRecord(responseBody);

    return { count: BusClient.getRequiredNumberField(record, "count") };
  }

  private static parseUacImport(responseBody: unknown): UacImport {
    const record = BusClient.getObjectRecord(responseBody);

    return { uacs_imported: BusClient.getRequiredNumberField(record, "uacs_imported") };
  }

  private static parseUacEnableDisableResponse(responseBody: unknown): UacEnableDisableResponse {
    const record = BusClient.getObjectRecord(responseBody);

    return { message: BusClient.getRequiredStringField(record, "message") };
  }

  private static parseUacChunks(value: unknown): Uac["uac_chunks"] {
    const record = BusClient.getObjectRecord(value);
    const uac4 = BusClient.getOptionalStringField(record, "uac4");

    return {
      uac1: BusClient.getRequiredStringField(record, "uac1"),
      uac2: BusClient.getRequiredStringField(record, "uac2"),
      uac3: BusClient.getRequiredStringField(record, "uac3"),
      ...(uac4 === undefined ? {} : { uac4 }),
    };
  }

  private static parseWireUac(value: unknown): WireUac {
    const record = BusClient.getObjectRecord(value);
    const instrumentName = BusClient.getOptionalStringField(record, "instrument_name");
    const questionnaireName = BusClient.getOptionalStringField(record, "questionnaire_name");
    const fullUac = BusClient.getOptionalStringField(record, "full_uac");

    if (questionnaireName === undefined && instrumentName === undefined) {
      throw new BusClientError(INVALID_RESPONSE_BODY_MESSAGE);
    }

    return {
      case_id: BusClient.getRequiredStringField(record, "case_id"),
      disabled: BusClient.parseDisabledFlag(record["disabled"]),
      uac_chunks: BusClient.parseUacChunks(record["uac_chunks"]),
      ...(fullUac === undefined ? {} : { full_uac: fullUac }),
      ...(instrumentName === undefined ? {} : { instrument_name: instrumentName }),
      ...(questionnaireName === undefined ? {} : { questionnaire_name: questionnaireName }),
    };
  }

  private static parseDisabledFlag(value: unknown): boolean {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    throw new BusClientError(INVALID_RESPONSE_BODY_MESSAGE);
  }

  private static parseUacRecord(responseBody: unknown): Record<string, Uac> {
    return Object.fromEntries(
      Object.entries(BusClient.getObjectRecord(responseBody)).map(([key, details]) => [
        key,
        BusClient.normaliseUac(BusClient.parseWireUac(details)),
      ]),
    );
  }

  private static normaliseUac(uac: WireUac): Uac {
    const { instrument_name, questionnaire_name, ...rest } = uac;

    return {
      ...rest,
      questionnaire_name: (questionnaire_name ?? instrument_name)!,
    };
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

  private static normaliseBusUrl(busUrl: string): string {
    const trimmedBusUrl = busUrl.trim();

    if (trimmedBusUrl === "") {
      throw new TypeError("busUrl is required");
    }

    let parsedBusUrl: URL;

    try {
      parsedBusUrl = new URL(trimmedBusUrl);
    } catch {
      throw new TypeError("busUrl must be an absolute http or https URL");
    }

    if (parsedBusUrl.protocol !== "http:" && parsedBusUrl.protocol !== "https:") {
      throw new TypeError("busUrl must use http or https");
    }

    return parsedBusUrl.toString().replace(/\/+$/, "");
  }
}
