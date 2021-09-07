import AuthProvider from "./authentication/authentication-provider";
import { AxiosInstance } from "axios";
import { InstrumentUacDetails, InstrumentUacDetailsByCaseId } from "./interfaces/instrument-uac-details";
import { InstrumentUacDetailsMock, InstrumentUacDetailsByCaseIdMock } from "./mock-objects/instrument-uac-details";
declare class BusApiClient {
    BUS_API_URL: string;
    BUS_CLIENT_ID: string;
    httpClient: AxiosInstance;
    authProvider: AuthProvider;
    constructor(BUS_API_URL: string, BUS_CLIENT_ID: string, timeoutInMs?: number);
    generateUacCodes(instrumentName: string, caseIds: string[]): Promise<InstrumentUacDetails>;
    getUacCodes(instrumentName: string): Promise<InstrumentUacDetails>;
    getUacCodesByCaseId(instrumentName: string): Promise<InstrumentUacDetailsByCaseId>;
    private url;
    private get;
    private post;
}
export default BusApiClient;
export { InstrumentUacDetails, InstrumentUacDetailsByCaseId };
export { InstrumentUacDetailsMock, InstrumentUacDetailsByCaseIdMock };
