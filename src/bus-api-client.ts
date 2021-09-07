import AuthProvider from "./authentication/authentication-provider"
import axios, {AxiosInstance} from "axios";
import {InstrumentUacDetails} from "./interfaces/instrument-uac-details";

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

    async generateUacCodes(instrumentName: string, caseIds: string[]):Promise<void> {
        const authHeader = await this.authProvider.getAuthHeader();
        const data = {
            "instrument_name": instrumentName,
            "case_ids": caseIds
        };

        await this.post("/uacs/generate", data, {headers: authHeader});
    }

    async getUacCodes(instrumentName: string): Promise<InstrumentUacDetails> {
        const authHeader = await this.authProvider.getAuthHeader();

        return await this.get(`/uacs/instrument/${instrumentName}/bycaseid`, {headers: authHeader});
    }

    private url(url: string): string {
        if (!url.startsWith("/")) {
            url = `/${url}`;
        }
        return url;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async get(url: string,  config: any): Promise<any> {
        const response = await this.httpClient.get(`${this.BUS_API_URL}${this.url(url)}`, config);
        return response.data;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    private async post(url: string, data: any, config: any): Promise<any> {
        const response = await this.httpClient.post(`${this.BUS_API_URL}${this.url(url)}`, data, config);
        return response.data;
    }
}

export default BusApiClient;