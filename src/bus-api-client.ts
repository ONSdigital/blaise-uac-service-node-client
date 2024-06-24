import AuthProvider from "./authentication/authentication-provider"
import axios, {AxiosInstance} from "axios";

import { InstrumentUacDetails, InstrumentUacDetailsByCaseId, UacCount, UacImport} from "./interfaces/instrument-uac-details";
import {InstrumentUacDetailsMock, InstrumentUacDetailsByCaseIdMock, InstrumentDisabledUacDetailsMock } from "./mock-objects/instrument-uac-details-mocks"

class BusApiClient {
    BUS_API_URL: string;
    BUS_CLIENT_ID: string;
    httpClient: AxiosInstance;
    authProvider: AuthProvider;

    constructor(BUS_API_URL: string, BUS_CLIENT_ID: string, timeoutInMs?: number) {
        this.BUS_API_URL = BUS_API_URL;
        this.BUS_CLIENT_ID = BUS_CLIENT_ID;
        this.authProvider = new AuthProvider(BUS_CLIENT_ID);
        this.httpClient = axios.create();

        if (typeof timeoutInMs !== "undefined") {
            this.httpClient.defaults.timeout = 10000;
        }
    }

    async generateUacCodes(instrumentName: string, caseIds: string[]): Promise<InstrumentUacDetails> {
        const data = {
            "instrument_name": instrumentName,
            "case_ids": caseIds
        };

        return await this.post("/uacs/generate", data);
    }

    async generateUacCodesForInstrument(instrumentName: string): Promise<InstrumentUacDetails> {
        return await this.post(`/uacs/instrument/${instrumentName}`, null);
    }

    async getUacCodeCount(instrumentName: string): Promise<UacCount> {
        return await this.get(`/uacs/instrument/${instrumentName}/count`);
    }

    async getUacCodes(instrumentName: string): Promise<InstrumentUacDetails> {
        return await this.get(`/uacs/instrument/${instrumentName}`);
    }

    async getUacCodesByCaseId(instrumentName: string): Promise<InstrumentUacDetailsByCaseId> {
        return await this.get(`/uacs/instrument/${instrumentName}/bycaseid`);
    }

    async importUACs(uacs: string[]): Promise<UacImport> {
        return await this.post(`/uacs/import`, uacs)
    }

    async getDisabledUacCodes(instrumentName: string): Promise<InstrumentUacDetails> {
        return await this.get(`/uacs/uac/${instrumentName}/disabled`);
    }

    async enableUac(uac: string): Promise<any> {
        return await this.get(`/uacs/uac/enable/${uac}`);
    }

    async disableUac(uac: string): Promise<any> {
        return await this.get(`/uacs/uac/disable/${uac}`);
    }

    private url(url: string): string {
        if (!url.startsWith("/")) {
            url = `/${url}`;
        }
        return url;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async get(url: string): Promise<any> {
        const config = {headers: await this.authProvider.getAuthHeader()}
        const response = await this.httpClient.get(`${this.BUS_API_URL}${this.url(url)}`, config);
        return response.data;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    private async post(url: string, data: any): Promise<any> {
        const config = {
            headers: await this.authProvider.getAuthHeader(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
         }
        const response = await this.httpClient.post(`${this.BUS_API_URL}${this.url(url)}`, data, config);
        return response.data;
    }
}

export default BusApiClient;

export {InstrumentUacDetails, InstrumentUacDetailsByCaseId};
export {InstrumentUacDetailsMock, InstrumentUacDetailsByCaseIdMock, InstrumentDisabledUacDetailsMock }
